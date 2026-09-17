import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from '../src/store/authStore.ts';

import {
  parseJwtPayload,
  parseJwtExpiration,
  isTokenValidAndFresh,
  getUsableAccessToken,
  AuthRefreshError,
} from '../src/services/authSession.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createMockJwt(expInSeconds, extraClaims = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'user_test', exp: expInSeconds, ...extraClaims })).toString('base64url');
  const sig = 'signature_abc';
  return `${header}.${payload}.${sig}`;
}

test('A. getUsableAccessToken: when no token exists in memory, triggers refreshSession and sets new token', async () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);

  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  const mockToken = createMockJwt(Math.floor(Date.now() / 1000) + 900);

  globalThis.fetch = async (input) => {
    if (String(input).includes('/auth/refresh')) {
      refreshCalls += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { accessToken: mockToken } }),
      };
    }
    throw new Error(`Unexpected fetch call to ${input}`);
  };

  try {
    const token = await getUsableAccessToken();
    assert.equal(token, mockToken);
    assert.equal(getAccessToken(), mockToken);
    assert.equal(refreshCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('B. getUsableAccessToken: when token exists and is safely valid (> bufferSeconds remaining), returns existing token without refresh', async () => {
  const freshExp = Math.floor(Date.now() / 1000) + 600; // 10 minutes remaining
  const validToken = createMockJwt(freshExp);
  setAccessToken(validToken);

  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('fetch should not be called for fresh token');
  };

  try {
    const token = await getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 });
    assert.equal(token, validToken);
    assert.equal(fetchCalled, false);
    assert.equal(getAccessToken(), validToken);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('C. getUsableAccessToken: when token is expired, refreshes session and sets new token', async () => {
  const expiredExp = Math.floor(Date.now() / 1000) - 120; // expired 2 minutes ago
  const expiredToken = createMockJwt(expiredExp);
  setAccessToken(expiredToken);

  const freshExp = Math.floor(Date.now() / 1000) + 900;
  const newToken = createMockJwt(freshExp);

  let refreshCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    refreshCalls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { accessToken: newToken } }),
    };
  };

  try {
    const token = await getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 });
    assert.equal(token, newToken);
    assert.equal(getAccessToken(), newToken);
    assert.equal(refreshCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('D. getUsableAccessToken: when token is near expiration (within buffer), refreshes session proactively', async () => {
  const nearExpiryExp = Math.floor(Date.now() / 1000) + 30; // 30s remaining, buffer is 60s
  const nearExpiryToken = createMockJwt(nearExpiryExp);
  setAccessToken(nearExpiryToken);

  const brandNewToken = createMockJwt(Math.floor(Date.now() / 1000) + 1200);

  let refreshCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    refreshCalls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { accessToken: brandNewToken } }),
    };
  };

  try {
    const token = await getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 });
    assert.equal(token, brandNewToken);
    assert.equal(getAccessToken(), brandNewToken);
    assert.equal(refreshCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('E. JWT token decoding: parseJwtPayload and parseJwtExpiration handle valid and malformed tokens safely', () => {
  const now = Math.floor(Date.now() / 1000);
  const validToken = createMockJwt(now + 300, { email: 'test@nexora.vn' });

  const payload = parseJwtPayload(validToken);
  assert.ok(payload);
  assert.equal(payload.sub, 'user_test');
  assert.equal(payload.email, 'test@nexora.vn');
  assert.equal(parseJwtExpiration(validToken), now + 300);

  // Malformed tokens
  assert.equal(parseJwtPayload(''), null);
  assert.equal(parseJwtPayload('invalid.token'), null);
  assert.equal(parseJwtPayload('a.b.c'), null);
  assert.equal(parseJwtExpiration('invalid'), null);
  assert.equal(isTokenValidAndFresh('invalid', 60), false);

  // Expired check
  const expiredToken = createMockJwt(now - 10);
  assert.equal(isTokenValidAndFresh(expiredToken, 60, now), false);

  // Within buffer check
  const withinBufferToken = createMockJwt(now + 40);
  assert.equal(isTokenValidAndFresh(withinBufferToken, 60, now), false);

  // Fresh token check
  const freshToken = createMockJwt(now + 120);
  assert.equal(isTokenValidAndFresh(freshToken, 60, now), true);
});

test('F. getUsableAccessToken: concurrent callers share a single in-flight refresh request', async () => {
  clearAccessToken();

  let networkCalls = 0;
  const brandNewToken = createMockJwt(Math.floor(Date.now() / 1000) + 1200);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { accessToken: brandNewToken } }),
    };
  };

  try {
    const [t1, t2, t3] = await Promise.all([
      getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 }),
      getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 }),
      getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 }),
    ]);

    assert.equal(t1, brandNewToken);
    assert.equal(t2, brandNewToken);
    assert.equal(t3, brandNewToken);
    assert.equal(networkCalls, 1, 'Exactly one network refresh request for concurrent callers');
    assert.equal(getAccessToken(), brandNewToken);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('G. getUsableAccessToken: 401 refresh failure clears token from memory and throws AuthRefreshError', async () => {
  setAccessToken('stale_token_prior_to_401');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Refresh session expired' }),
  });

  try {
    await assert.rejects(
      async () => {
        await getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 });
      },
      (err) => {
        assert.ok(err instanceof AuthRefreshError);
        assert.equal(err.status, 401);
        return true;
      }
    );

    assert.equal(getAccessToken(), null, 'Access token must be cleared upon 401');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('H. RealtimeProvider: source uses getUsableAccessToken with safety window and exits retry on cleared token', () => {
  const realtimeProviderContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/RealtimeProvider.tsx'),
    'utf-8'
  );

  // Check imports
  assert.match(
    realtimeProviderContent,
    /import\s+{[^}]*getUsableAccessToken[^}]*}\s+from\s+['"]@\/services\/authSession['"]/,
    'RealtimeProvider must import getUsableAccessToken'
  );

  // Check accessTokenFactory uses getUsableAccessToken with 60s safety buffer
  assert.match(
    realtimeProviderContent,
    /accessTokenFactory:\s*async\s*\(\)\s*=>\s*{[\s\S]*getUsableAccessToken\({\s*refreshIfExpiringWithinSeconds:\s*60\s*}\)/,
    'accessTokenFactory must call getUsableAccessToken with 60s buffer'
  );

  // Check retry loop does not spin infinitely when token is absent/cleared
  assert.match(
    realtimeProviderContent,
    /if\s*\(!getAccessToken\(\)\)\s*return;/,
    'connectWithRetry must halt immediately when token is absent or invalidated'
  );
});

test('J. apiClient: REST 401 recovery behavior remains intact', () => {
  const apiClientContent = fs.readFileSync(
    path.join(rootDir, 'src/services/apiClient.ts'),
    'utf-8'
  );

  assert.match(
    apiClientContent,
    /const refreshResponse = await refreshSession\(\);/,
    'apiClient must maintain its canonical refreshSession recovery flow'
  );
  assert.match(
    apiClientContent,
    /setAccessToken\(newToken\);/,
    'apiClient must store the refreshed token'
  );
});
