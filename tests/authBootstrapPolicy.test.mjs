import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getAccessToken,
  clearAccessToken,
} from '../src/store/authStore.ts';

import {
  isStatelessNonAuthRoute,
  shouldEagerlyBootstrapAuth,
  normalizePathname,
} from '../src/services/authRoutePolicy.ts';

import {
  bootstrapAuthSession,
  AuthRefreshError,
} from '../src/services/authSession.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('A. authenticated refresh-cookie session hard reload on "/" performs session restoration', async () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);

  // "/" contains an auth-aware Header and must eagerly bootstrap session
  assert.equal(isStatelessNonAuthRoute('/'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/'), true);

  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes('/auth/refresh')) {
      refreshCalls += 1;
      assert.equal(init?.credentials, 'include');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: { accessToken: 'restored_session_cookie_jwt' },
        }),
      };
    }
    throw new Error(`Unexpected fetch to ${input}`);
  };

  try {
    const success = await bootstrapAuthSession();
    assert.equal(success, true);
    assert.equal(refreshCalls, 1);
    assert.equal(getAccessToken(), 'restored_session_cookie_jwt');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('B. after successful restoration: public Header renders authenticated dashboard CTA', () => {
  const headerContent = fs.readFileSync(
    path.join(rootDir, 'src/components/layouts/Header.tsx'),
    'utf-8'
  );

  assert.match(
    headerContent,
    /const\s+{\s*authReady,\s*isAuthenticated\s*}\s*=\s*useAuth\(\)/,
    'Header must read authReady and isAuthenticated from auth context'
  );
  assert.match(
    headerContent,
    /isAuthenticated\s*\?[\s\S]*\/overview[\s\S]*Vào Dashboard/,
    'Header must render "Vào Dashboard" leading to /overview when authenticated'
  );
  assert.match(
    headerContent,
    /!authReady[\s\S]*<Skeleton/,
    'Header must render a neutral skeleton while session is resolving'
  );
});

test('C. anonymous "/": remains publicly accessible even if refresh returns expected 401', async () => {
  clearAccessToken();

  const pageContent = fs.readFileSync(path.join(rootDir, 'src/app/page.tsx'), 'utf-8');
  assert.doesNotMatch(pageContent, /RequireAuth/);
  assert.doesNotMatch(pageContent, /router\.replace\(['"]\/auth['"]\)/);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'No active refresh session' }),
  });

  try {
    const success = await bootstrapAuthSession();
    assert.equal(success, false, 'Expected 401 returns false (unauthenticated)');
    assert.equal(getAccessToken(), null, 'Access token remains null');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('D. "/auth": can restore an existing authenticated refresh-cookie session', async () => {
  clearAccessToken();

  // /auth is auth-aware and must not permanently skip session restoration
  assert.equal(isStatelessNonAuthRoute('/auth'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/auth'), true);

  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  globalThis.fetch = async () => {
    refreshCalls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: { accessToken: 'auth_route_restored_jwt' },
      }),
    };
  };

  try {
    const success = await bootstrapAuthSession();
    assert.equal(success, true);
    assert.equal(refreshCalls, 1);
    assert.equal(getAccessToken(), 'auth_route_restored_jwt');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('E. transient bootstrap 5xx/network failure does NOT permanently suppress later bootstrap attempts', async () => {
  clearAccessToken();

  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      // First attempt fails transiently with 503
      return {
        ok: false,
        status: 503,
        json: async () => ({ message: 'Service Unavailable (Render cold start)' }),
      };
    }
    // Subsequent retry succeeds
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: { accessToken: 'retried_success_token' },
      }),
    };
  };

  try {
    // 1. Initial attempt fails with transient 503
    await assert.rejects(
      async () => {
        await bootstrapAuthSession();
      },
      (err) => {
        assert.ok(err instanceof AuthRefreshError);
        assert.equal(err.status, 503);
        return true;
      }
    );

    assert.equal(getAccessToken(), null);

    // 2. Subsequent retry must NOT be blocked and should succeed
    const retryResult = await bootstrapAuthSession();
    assert.equal(retryResult, true, 'Retry after transient failure must be permitted and succeed');
    assert.equal(getAccessToken(), 'retried_success_token');
    assert.equal(attempts, 2);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('F. definitive refresh 401 marks session unauthenticated and clears access token', async () => {
  clearAccessToken();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Refresh token expired' }),
  });

  try {
    const success = await bootstrapAuthSession();
    assert.equal(success, false);
    assert.equal(getAccessToken(), null, 'Memory access token must be cleared upon 401');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('G. "/pricing": restores session before choosing authenticated vs public pricing shell', () => {
  assert.equal(isStatelessNonAuthRoute('/pricing'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/pricing'), true);

  const shellContent = fs.readFileSync(
    path.join(rootDir, 'src/components/features/pricing/PricingPageShell.tsx'),
    'utf-8'
  );
  assert.match(shellContent, /if\s*\(authReady\s*&&\s*isAuthenticated\)/);
  assert.match(shellContent, /if\s*\(!authReady\)/);
  assert.match(shellContent, /if\s*\(!authReady\)[\s\S]*<Skeleton/);
});

test('H. protected routes: restore session before RequireAuth guard resolves', () => {
  const protectedPaths = [
    '/overview',
    '/billing',
    '/account',
    '/analytics',
    '/interviews',
    '/interviews/new',
    '/practice',
    '/learning-path',
  ];

  for (const p of protectedPaths) {
    assert.equal(isStatelessNonAuthRoute(p), false);
    assert.equal(shouldEagerlyBootstrapAuth(p), true);
  }

  const guardContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/RequireAuth.tsx'),
    'utf-8'
  );
  assert.match(
    guardContent,
    /authReady && !isAuthenticated && !bootstrapError/,
    'RequireAuth redirects only upon authoritative unauthenticated resolution'
  );
  assert.match(
    guardContent,
    /bootstrapError && !isAuthenticated/,
    'RequireAuth shows recoverable retry view on transient bootstrap error'
  );
});

test('I. only truly stateless routes skip eager bootstrap probe; /status redirects away', () => {
  assert.equal(isStatelessNonAuthRoute('/status'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/status'), true);
  assert.equal(isStatelessNonAuthRoute('/design-system'), true);
  assert.equal(shouldEagerlyBootstrapAuth('/design-system'), false);

  assert.equal(normalizePathname('/status/'), '/status');
  assert.equal(normalizePathname('/'), '/');
});
