import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountDeletionError, requestPublicAccountDeletion, confirmPublicAccountDeletion } from '../src/services/accountDeletionApi.ts';
import { shouldEagerlyBootstrapAuth } from '../src/services/authRoutePolicy.ts';

const result = { id: 'request-1', status: 'queued', requestedAt: '2026-10-04T10:00:00Z', completedAt: null };
const response = (status, data) => new Response(JSON.stringify(data), { status });

test('public POST uses email only and excludes credentials, auth, referrer and retries', async () => {
  let calls = 0;
  await requestPublicAccountDeletion('  qb@example.test  ', async (url, init) => {
    calls++;
    assert.match(url, /\/account-deletion\/external\/request$/);
    assert.deepEqual(JSON.parse(init.body), { email: 'qb@example.test' });
    assert.equal(init.credentials, 'omit');
    assert.equal(init.headers.Authorization, undefined);
    assert.equal(init.referrerPolicy, 'no-referrer');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    return response(202, { data: { message: 'arbitrary backend message' } });
  });
  assert.equal(calls, 1);
});

test('accepted email result does not expose account-dependent response content', async () => {
  for (const body of [{ data: { message: 'account exists' } }, { data: { message: 'not found' } }, null]) {
    assert.equal(await requestPublicAccountDeletion('qb@example.test', async () => response(202, body)), undefined);
  }
});

test('confirmation unwraps exact backend envelope and sends only the token', async () => {
  assert.deepEqual(await confirmPublicAccountDeletion('fake-test-token', async (url, init) => {
    assert.match(url, /\/external\/confirm$/);
    assert.deepEqual(JSON.parse(init.body), { token: 'fake-test-token' });
    return response(202, { data: result });
  }), result);
});

for (const [status, code, expected] of [[429, '', 'rate-limit'], [400, 'DELETION_VERIFICATION_INVALID', 'invalid-link'], [401, '', 'unavailable'], [503, '', 'uncertain']]) {
  test(`confirmation ${status}/${code} is sanitized without refresh or retry`, async () => {
    let calls = 0;
    await assert.rejects(confirmPublicAccountDeletion('secret-test-token', async () => {
      calls++;
      return response(status, { error: { code, message: 'secret-test-token internal details' } });
    }), error => error instanceof AccountDeletionError && error.kind === expected && !error.message.includes('secret-test-token'));
    assert.equal(calls, 1);
  });
}

test('network/timeout and malformed accepted confirmation are uncertain, never proof of failure', async () => {
  for (const fetcher of [async () => { throw new Error('secret-token'); }, async () => response(202, {}), async () => response(202, { data: { ...result, status: 'invented' } })]) {
    await assert.rejects(confirmPublicAccountDeletion('secret-token', fetcher), error => error.kind === 'uncertain' && !error.message.includes('secret-token'));
  }
});

test('request validation and unexpected authorization error are handled without authentication', async () => {
  await assert.rejects(requestPublicAccountDeletion('invalid', async () => response(400, {})), error => error.kind === 'validation');
  await assert.rejects(requestPublicAccountDeletion('qb@example.test', async () => response(401, {})), error => error.kind === 'unavailable');
});

test('deletion routes skip auth bootstrap while other auth-aware routes retain their policy', () => {
  for (const route of ['/account-deletion', '/account-deletion/confirm?token=fake', '/account-deletion/']) assert.equal(shouldEagerlyBootstrapAuth(route), false);
  for (const route of ['/', '/auth', '/settings', '/pricing']) assert.equal(shouldEagerlyBootstrapAuth(route), true);
});
