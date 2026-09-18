import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const managerSource = await readFile(
  new URL('../src/services/speechTokenManager.ts', import.meta.url),
  'utf8',
);

const managerJs = ts.transpileModule(managerSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const speechApiStub = `data:text/javascript,${encodeURIComponent(
  'export const fetchInterviewSpeechAuthorization = async () => { throw new Error("Use the injected test fetcher."); };',
)}`;
const isolatedManagerJs = managerJs.replace(
  /from ["']\.\/speechApi["']/g,
  `from '${speechApiStub}'`,
);
const managerModule = await import(
  `data:text/javascript;base64,${Buffer.from(isolatedManagerJs).toString('base64')}`
);

const { createSpeechTokenManager, SPEECH_TOKEN_MIN_VALIDITY_MS } = managerModule;
const originalNow = Date.now;
let now = Date.parse('2026-01-01T00:00:00.000Z');

const authorization = (token, expiresAt = now + 5 * 60_000) => ({
  token,
  region: 'westeurope',
  expiresAt: new Date(expiresAt).toISOString(),
});

test.beforeEach(() => {
  Date.now = () => now;
});

test.afterEach(() => {
  Date.now = originalNow;
});

test('reuses a fresh authorization from the in-memory cache', async () => {
  let calls = 0;
  const manager = createSpeechTokenManager(async () => {
    calls += 1;
    return authorization('fresh-token');
  });

  const first = await manager.getInterviewSpeechAuthorization('interview-1');
  const second = await manager.getInterviewSpeechAuthorization('interview-1');

  assert.equal(first, second);
  assert.equal(calls, 1);
});

test('refreshes a cached authorization inside the 60-second safety margin', async () => {
  let calls = 0;
  const manager = createSpeechTokenManager(async () => {
    calls += 1;
    return calls === 1
      ? authorization('first-token', now + SPEECH_TOKEN_MIN_VALIDITY_MS + 5_000)
      : authorization('refreshed-token');
  });

  const first = await manager.getInterviewSpeechAuthorization('interview-1');
  now += 10_000;
  const refreshed = await manager.getInterviewSpeechAuthorization('interview-1');

  assert.equal(first.token, 'first-token');
  assert.equal(refreshed.token, 'refreshed-token');
  assert.equal(calls, 2);
});

test('rejects expired, malformed, or incomplete authorizations', async (t) => {
  const invalidAuthorizations = [
    ['expired', authorization('expired-token', now)],
    ['invalid expiry', { ...authorization('bad-date'), expiresAt: 'not-a-date' }],
    ['missing token', { ...authorization(''), token: '' }],
    ['missing region', { ...authorization('no-region'), region: '' }],
    [
      'too little remaining validity',
      authorization('near-expiry', now + SPEECH_TOKEN_MIN_VALIDITY_MS),
    ],
  ];

  for (const [label, result] of invalidAuthorizations) {
    await t.test(label, async () => {
      const manager = createSpeechTokenManager(async () => result);
      await assert.rejects(
        manager.getInterviewSpeechAuthorization('interview-1'),
        /malformed or expires too soon/,
      );
    });
  }
});

test('deduplicates concurrent authorization requests for one interview', async () => {
  let calls = 0;
  let resolveFetch;
  const fetchPromise = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const manager = createSpeechTokenManager(() => {
    calls += 1;
    return fetchPromise;
  });

  const first = manager.getInterviewSpeechAuthorization('interview-1');
  const second = manager.getInterviewSpeechAuthorization('interview-1');
  const third = manager.getInterviewSpeechAuthorization('interview-1');
  assert.equal(calls, 1);

  resolveFetch(authorization('shared-token'));
  const results = await Promise.all([first, second, third]);
  assert.deepEqual(results.map(({ token }) => token), [
    'shared-token',
    'shared-token',
    'shared-token',
  ]);
});

test('keeps cache and in-flight requests separate by interview ID', async () => {
  const requestedIds = [];
  const manager = createSpeechTokenManager(async (interviewId) => {
    requestedIds.push(interviewId);
    return authorization(`token-for-${interviewId}`);
  });

  const first = await manager.getInterviewSpeechAuthorization('interview/one');
  const second = await manager.getInterviewSpeechAuthorization('interview two');

  assert.deepEqual(requestedIds, ['interview/one', 'interview two']);
  assert.equal(first.token, 'token-for-interview/one');
  assert.equal(second.token, 'token-for-interview two');
});

test('supports clearing one interview or the whole authorization cache', async () => {
  let calls = 0;
  const manager = createSpeechTokenManager(async () => {
    calls += 1;
    return authorization(`token-${calls}`);
  });

  await manager.getInterviewSpeechAuthorization('interview-1');
  manager.clearInterviewSpeechAuthorizationCache('interview-1');
  await manager.getInterviewSpeechAuthorization('interview-1');
  manager.clearInterviewSpeechAuthorizationCache();
  await manager.getInterviewSpeechAuthorization('interview-1');

  assert.equal(calls, 3);
});

test('keeps authorization storage in memory only', () => {
  assert.doesNotMatch(managerSource, /localStorage|sessionStorage|indexedDB|document\.cookie/i);
});
