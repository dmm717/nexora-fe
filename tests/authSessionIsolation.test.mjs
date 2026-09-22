import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  clearAccessToken,
  getAccessToken,
  getPrincipalEpoch,
  invalidatePrincipal,
  setAccessToken,
} from '../src/store/authStore.ts';
import { QueryClient } from '@tanstack/react-query';
import {
  getUsableAccessToken,
  StaleAuthSessionError,
} from '../src/services/authSession.ts';
import { apiClient } from '../src/services/apiClient.ts';
import { logoutCurrentSession } from '../src/services/sessionActions.ts';
import { SessionQueryClientManager } from '../src/services/sessionQueryClient.ts';
import { VERIFICATION_RESEND_COOLDOWN_SECONDS } from '../src/constants/auth.ts';

const rootDir = path.resolve('.');

function createMockJwt(sub, exp = Math.floor(Date.now() / 1000) + 900) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function response(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test('A private cache is discarded across logout and principal replacement', () => {
  clearAccessToken();
  setAccessToken(createMockJwt('account-a'));

  const manager = new SessionQueryClientManager(getPrincipalEpoch());
  const accountAClient = manager.getQueryClient();
  accountAClient.setQueryData(['currentUser'], { email: 'a@example.com' });
  accountAClient.setQueryData(['resumes'], [{ id: 'resume-a' }]);

  invalidatePrincipal(getPrincipalEpoch());
  setAccessToken(createMockJwt('account-b'));
  const accountBClient = manager.sync(getPrincipalEpoch());

  assert.notStrictEqual(accountBClient, accountAClient, 'principal replacement creates a new QueryClient');
  assert.equal(accountBClient.getQueryData(['currentUser']), undefined);
  assert.equal(accountBClient.getQueryData(['resumes']), undefined);
});

test('a late Account A query can only resolve into the discarded Account A client', async () => {
  clearAccessToken();
  setAccessToken(createMockJwt('account-a'));

  const manager = new SessionQueryClientManager(getPrincipalEpoch());
  const accountAClient = manager.getQueryClient();
  let resolveAccountA;
  const lateQuery = new Promise((resolve) => {
    resolveAccountA = () => {
      accountAClient.setQueryData(['currentUser'], { email: 'a@example.com' });
      resolve();
    };
  });
  assert.equal(typeof resolveAccountA, 'function');

  invalidatePrincipal(getPrincipalEpoch());
  setAccessToken(createMockJwt('account-b'));
  const accountBClient = manager.sync(getPrincipalEpoch());

  resolveAccountA({ email: 'a@example.com' });
  await lateQuery;

  assert.equal(accountBClient.getQueryData(['currentUser']), undefined);
  accountAClient.clear();
  accountBClient.clear();
});

test('an obsolete Account A refresh cannot replace Account B', async () => {
  clearAccessToken();
  const tokenA = createMockJwt('account-a', Math.floor(Date.now() / 1000) - 30);
  const tokenB = createMockJwt('account-b');
  const refreshedA = createMockJwt('account-a');
  setAccessToken(tokenA);

  const originalFetch = globalThis.fetch;
  let resolveRefresh;
  globalThis.fetch = async () => new Promise((resolve) => {
    resolveRefresh = () => resolve(response(200, { data: { accessToken: refreshedA } }));
  });

  try {
    const obsoleteRefresh = getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 });
    await Promise.resolve();

    invalidatePrincipal(getPrincipalEpoch());
    setAccessToken(tokenB);
    resolveRefresh();

    await assert.rejects(obsoleteRefresh, StaleAuthSessionError);
    assert.equal(getAccessToken(), tokenB, 'Account B token remains active');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('same-principal token refresh keeps the active QueryClient and epoch', async () => {
  clearAccessToken();
  setAccessToken(createMockJwt('account-b', Math.floor(Date.now() / 1000) - 30));
  const epochBefore = getPrincipalEpoch();
  const manager = new SessionQueryClientManager(epochBefore);
  const clientBefore = manager.getQueryClient();
  const refreshedB = createMockJwt('account-b');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response(200, { data: { accessToken: refreshedB } });

  try {
    assert.equal(await getUsableAccessToken(), refreshedB);
    assert.equal(getPrincipalEpoch(), epochBefore);
    assert.strictEqual(manager.sync(getPrincipalEpoch()), clientBefore);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('a stale Account A 401 cannot clear or redirect Account B', async () => {
  clearAccessToken();
  const tokenA = createMockJwt('account-a');
  const tokenB = createMockJwt('account-b');
  setAccessToken(tokenA);

  const originalFetch = globalThis.fetch;
  let resolveRequest;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Promise((resolve) => {
      resolveRequest = () => resolve(response(401, { message: 'Unauthorized' }));
    });
  };

  try {
    const staleRequest = apiClient.get('/me');
    await Promise.resolve();

    invalidatePrincipal(getPrincipalEpoch());
    setAccessToken(tokenB);
    resolveRequest();

    await assert.rejects(staleRequest, StaleAuthSessionError);
    assert.equal(getAccessToken(), tokenB);
    assert.equal(fetchCalls, 1, 'stale 401 does not start a refresh or retry');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('logout clears local state before a failed server logout and uses captured credentials', async () => {
  clearAccessToken();
  const tokenA = createMockJwt('account-a');
  const tokenB = createMockJwt('account-b');
  setAccessToken(tokenA);

  const originalFetch = globalThis.fetch;
  let capturedInit;
  let rejectLogout;
  globalThis.fetch = async (_input, init) => {
    capturedInit = init;
    return new Promise((_resolve, reject) => {
      rejectLogout = reject;
    });
  };

  try {
    const logout = logoutCurrentSession();
    assert.equal(getAccessToken(), null, 'local token is cleared synchronously');

    setAccessToken(tokenB);
    rejectLogout(new Error('offline'));
    const result = await logout;

    assert.equal(result.serverLogoutSucceeded, false);
    assert.equal(capturedInit.headers.Authorization, `Bearer ${tokenA}`);
    assert.equal(getAccessToken(), tokenB, 'a new session remains untouched by old logout failure');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('registration starts resend cooldown immediately and resend success uses the same cooldown', () => {
  const authSource = fs.readFileSync(path.join(rootDir, 'src/components/features/auth/Auth.tsx'), 'utf8');
  const verifySource = fs.readFileSync(path.join(rootDir, 'src/app/verify-email/page.tsx'), 'utf8');

  assert.equal(VERIFICATION_RESEND_COOLDOWN_SECONDS, 60);
  assert.match(authSource, /resendInFlightRef\.current/);
  assert.match(authSource, /setRegisteredEmail\(registerData\.email\);[\s\S]*setResendCooldown\(VERIFICATION_RESEND_COOLDOWN_SECONDS\)/);
  assert.match(authSource, /await authApi\.resendVerification[\s\S]*setResendCooldown\(VERIFICATION_RESEND_COOLDOWN_SECONDS\)/);
  assert.match(authSource, /Gửi lại sau \(\$\{resendCooldown\}s\)/);
  assert.match(verifySource, /resendInFlightRef\.current/);
  assert.match(verifySource, /await authApi\.resendVerification[\s\S]*setResendCooldown\(VERIFICATION_RESEND_COOLDOWN_SECONDS\)/);
});

test('session query client manager creates a new client only when the principal epoch changes', () => {
  const manager = new SessionQueryClientManager(10);
  const first = manager.getQueryClient();
  assert.ok(first instanceof QueryClient);
  assert.strictEqual(manager.sync(10), first);
  assert.notStrictEqual(manager.sync(11), first);
});
