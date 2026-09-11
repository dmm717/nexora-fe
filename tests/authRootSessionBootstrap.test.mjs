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
  bootstrapAuthSession,
  AuthRefreshError,
} from '../src/services/authSession.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Structural Invariant Tests: Provider Placement & Redundant Provider Removal
// ---------------------------------------------------------------------------

test('1. root app mounts AuthBootstrapProvider inside ReactQueryProvider and wraps children', () => {
  const layoutContent = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf-8');
  assert.match(
    layoutContent,
    /import\s+AuthBootstrapProvider\s+from\s+['"]@\/components\/providers\/AuthBootstrapProvider['"]/,
    'RootLayout must import AuthBootstrapProvider'
  );
  assert.match(
    layoutContent,
    /<ReactQueryProvider>[\s\S]*<AuthBootstrapProvider>[\s\S]*{children}[\s\S]*<\/AuthBootstrapProvider>[\s\S]*<\/ReactQueryProvider>/,
    'RootLayout must wrap children in AuthBootstrapProvider inside ReactQueryProvider'
  );
});

test('2. public "/" page remains completely public and does not require authentication', () => {
  const pageContent = fs.readFileSync(path.join(rootDir, 'src/app/page.tsx'), 'utf-8');
  assert.doesNotMatch(
    pageContent,
    /RequireAuth/,
    'Landing page / must not be wrapped in RequireAuth'
  );
  assert.doesNotMatch(
    pageContent,
    /router\.replace\(['"]\/auth['"]\)/,
    'Landing page / must not redirect unauthenticated users'
  );
});

test('3. dashboard layout remains protected by RequireAuth guard', () => {
  const dashboardLayoutContent = fs.readFileSync(
    path.join(rootDir, 'src/app/dashboard/layout.tsx'),
    'utf-8'
  );
  assert.match(
    dashboardLayoutContent,
    /import\s+RequireAuth\s+from\s+['"]@\/components\/providers\/RequireAuth['"]/,
    'Dashboard layout must import RequireAuth'
  );
  assert.match(
    dashboardLayoutContent,
    /<RequireAuth>[\s\S]*<DashboardLayout>[\s\S]*<\/DashboardLayout>[\s\S]*<\/RequireAuth>/,
    'Dashboard layout must wrap DashboardLayout in RequireAuth'
  );
});

test('4. no nested duplicate AuthBootstrapProvider in dashboard or public layouts', () => {
  const dashboardLayoutContent = fs.readFileSync(
    path.join(rootDir, 'src/app/dashboard/layout.tsx'),
    'utf-8'
  );
  const publicLayoutContent = fs.readFileSync(
    path.join(rootDir, 'src/app/public/layout.tsx'),
    'utf-8'
  );

  assert.doesNotMatch(
    dashboardLayoutContent,
    /AuthBootstrapProvider/,
    'Dashboard layout must not mount duplicate AuthBootstrapProvider'
  );
  assert.doesNotMatch(
    publicLayoutContent,
    /AuthBootstrapProvider/,
    'Public layout must not mount duplicate AuthBootstrapProvider'
  );
});

test('5. AuthBootstrapProvider does not contain route redirect logic', () => {
  const providerContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/AuthBootstrapProvider.tsx'),
    'utf-8'
  );
  assert.doesNotMatch(
    providerContent,
    /useRouter|router\.replace|router\.push/,
    'AuthBootstrapProvider at root must not own routing or redirects'
  );
  assert.doesNotMatch(
    providerContent,
    /usePathname/,
    'AuthBootstrapProvider at root must not inspect pathname for redirection'
  );
});

test('6. RequireAuth guard handles protection, redirects unauthenticated, and shows recoverable error on transient failure', () => {
  const guardContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/RequireAuth.tsx'),
    'utf-8'
  );
  assert.match(
    guardContent,
    /authReady && !isAuthenticated && !bootstrapError/,
    'RequireAuth must redirect unauthenticated only when bootstrap completed without error'
  );
  assert.match(
    guardContent,
    /router\.replace\(['"]\/auth['"]\)/,
    'RequireAuth must redirect to /auth when unauthenticated'
  );
  assert.match(
    guardContent,
    /bootstrapError && !isAuthenticated/,
    'RequireAuth must render recoverable retry state when bootstrapError occurs'
  );
});

test('7. Header consumes root auth context and prevents false logged-out flicker', () => {
  const headerContent = fs.readFileSync(
    path.join(rootDir, 'src/components/layouts/Header.tsx'),
    'utf-8'
  );
  assert.match(
    headerContent,
    /import\s+{\s*useAuth\s*}\s+from\s+['"]@\/components\/providers\/AuthBootstrapProvider['"]/,
    'Header must import useAuth from root provider'
  );
  assert.match(
    headerContent,
    /const\s+{\s*authReady,\s*isAuthenticated\s*}\s*=\s*useAuth\(\)/,
    'Header must consume authReady and isAuthenticated from auth context'
  );
  assert.match(
    headerContent,
    /!authReady[\s\S]*animate-pulse/,
    'Header must render neutral placeholder while authReady is false'
  );
  assert.match(
    headerContent,
    /isAuthenticated\s*\?[\s\S]*\/dashboard/,
    'Header must show dashboard CTA when authenticated'
  );
});

test('8. memory access token design: no localStorage/sessionStorage/IndexedDB token persistence', () => {
  const authStoreContent = fs.readFileSync(
    path.join(rootDir, 'src/store/authStore.ts'),
    'utf-8'
  );
  // Strip block/line comments to verify actual code statements do not invoke web storage
  const codeOnly = authStoreContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  assert.doesNotMatch(
    codeOnly,
    /localStorage|sessionStorage|indexedDB|cookieStore/,
    'authStore code must not use web storage APIs'
  );

  // Invariant verification on store methods
  clearAccessToken();
  assert.equal(getAccessToken(), null);
  setAccessToken('jwt_session_token_example');
  assert.equal(getAccessToken(), 'jwt_session_token_example');
  clearAccessToken();
  assert.equal(getAccessToken(), null);
});

// ---------------------------------------------------------------------------
// Bootstrap Runtime Semantics Tests (bootstrapAuthSession & authSession)
// ---------------------------------------------------------------------------

test('9. existing access token in memory skips unnecessary refresh request', async () => {
  setAccessToken('already_authenticated_token');
  try {
    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('fetch should not have been called');
    };

    try {
      const result = await bootstrapAuthSession();
      assert.equal(result, true, 'bootstrapAuthSession returns true immediately');
      assert.equal(fetchCalled, false, 'network refresh was not called');
      assert.equal(getAccessToken(), 'already_authenticated_token');
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    clearAccessToken();
  }
});

test('10. missing access token triggers bootstrap refresh with credentials include and sets access token on 200', async () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);

  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestInit;

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestInit = init;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          accessToken: 'new_refreshed_access_token_abc',
        },
      }),
    };
  };

  try {
    const result = await bootstrapAuthSession();
    assert.equal(result, true);
    assert.match(requestedUrl, /\/auth\/refresh$/);
    assert.equal(requestInit?.method, 'POST');
    assert.equal(requestInit?.credentials, 'include');
    assert.equal(getAccessToken(), 'new_refreshed_access_token_abc');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('11. refresh 401 marks session unauthenticated and clears memory token', async () => {
  clearAccessToken();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({
      message: 'Refresh token expired or invalid',
    }),
  });

  try {
    const result = await bootstrapAuthSession();
    assert.equal(result, false, '401 returns false (unauthenticated)');
    assert.equal(getAccessToken(), null, 'access token remains null');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('12. non-401 refresh failure (network/500/CORS) throws recoverable error without authoritative logout', async () => {
  clearAccessToken();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({
      message: 'Service Unavailable',
    }),
  });

  try {
    await assert.rejects(
      async () => {
        await bootstrapAuthSession();
      },
      (err) => {
        assert.ok(err instanceof AuthRefreshError);
        assert.equal(err.status, 503);
        return true;
      },
      '503 throws AuthRefreshError to be captured as bootstrapError rather than silent false logout'
    );
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('13. network exception during refresh preserves recoverable error', async () => {
  clearAccessToken();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch (network error / CORS)');
  };

  try {
    await assert.rejects(
      async () => {
        await bootstrapAuthSession();
      },
      (err) => {
        assert.ok(err instanceof TypeError);
        assert.equal(err.message, 'Failed to fetch (network error / CORS)');
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('14. concurrent bootstrap invocations deduplicate into a single in-flight refresh request', async () => {
  clearAccessToken();

  let networkCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkCalls += 1;
    await new Promise((r) => setTimeout(r, 10));
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: { accessToken: 'deduped_token_xyz' },
      }),
    };
  };

  try {
    const [res1, res2, res3] = await Promise.all([
      bootstrapAuthSession(),
      bootstrapAuthSession(),
      bootstrapAuthSession(),
    ]);

    assert.equal(res1, true);
    assert.equal(res2, true);
    assert.equal(res3, true);
    assert.equal(networkCalls, 1, 'Exactly one network refresh request made despite concurrent callers');
    assert.equal(getAccessToken(), 'deduped_token_xyz');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});
