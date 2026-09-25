import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../src/store/authStore.ts';
import {
  beginSessionTermination,
  bootstrapAuthSession,
  getUsableAccessToken,
  isSessionTerminationActive,
  refreshSession,
  resetSessionTerminationForExplicitLogin,
  StaleAuthSessionError,
} from '../src/services/authSession.ts';
import { apiClient } from '../src/services/apiClient.ts';
import { authApi } from '../src/services/authApi.ts';
import { logoutCurrentSession } from '../src/services/sessionActions.ts';
import { isValidInternalPath, resolveSafeReturnUrl } from '../src/utils/authIntent.ts';

const rootDir = path.resolve('.');

function createMockJwt(sub, exp = Math.floor(Date.now() / 1000) + 900) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp })).toString('base64url');
  return `${header}.${payload}.signature`;
}

function mockResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test('1. logout barrier blocks bootstrapAuthSession refresh from starting or applying', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return mockResponse(200, { data: { accessToken: createMockJwt('resurrected') } });
  };

  try {
    beginSessionTermination();
    assert.equal(isSessionTerminationActive(), true);

    const authenticated = await bootstrapAuthSession();
    assert.equal(authenticated, false, 'bootstrapAuthSession must return false when barrier is active');
    assert.equal(fetchCalls, 0, 'No refresh network fetch may be made when termination barrier is active');
    assert.equal(getAccessToken(), null, 'Access token remains null');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('2. logout barrier blocks apiClient 401 refresh fallback', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/auth/refresh')) {
      refreshCalls += 1;
      return mockResponse(200, { data: { accessToken: createMockJwt('account-a') } });
    }
    return mockResponse(401, { message: 'Unauthorized' });
  };

  try {
    beginSessionTermination();
    assert.equal(isSessionTerminationActive(), true);

    await assert.rejects(
      apiClient.get('/overview'),
      StaleAuthSessionError,
      'apiClient 401 must fail-closed with StaleAuthSessionError when termination barrier is active'
    );
    assert.equal(refreshCalls, 0, 'apiClient must not trigger refreshSession when barrier is active');
    assert.equal(getAccessToken(), null);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('3. logout barrier blocks getUsableAccessToken refresh', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return mockResponse(200, { data: { accessToken: createMockJwt('resurrected') } });
  };

  try {
    beginSessionTermination();
    assert.equal(isSessionTerminationActive(), true);

    await assert.rejects(
      getUsableAccessToken(),
      StaleAuthSessionError,
      'getUsableAccessToken must throw StaleAuthSessionError when termination barrier is active'
    );
    assert.equal(fetchCalls, 0, 'getUsableAccessToken must not initiate refresh fetch when barrier is active');
    assert.equal(getAccessToken(), null);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('4. stale in-flight refresh cannot set token after logout begins', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  const tokenA = createMockJwt('account-a', Math.floor(Date.now() / 1000) - 30);
  const refreshedA = createMockJwt('account-a-resurrected');
  setAccessToken(tokenA);

  const originalFetch = globalThis.fetch;
  let resolveRefresh;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/auth/refresh')) {
      return new Promise((resolve) => {
        resolveRefresh = () => resolve(mockResponse(200, { data: { accessToken: refreshedA } }));
      });
    }
    return mockResponse(204);
  };

  try {
    // 1. In-flight refresh is initiated
    const inFlightRefresh = refreshSession();
    await Promise.resolve();

    // 2. Explicit logout begins while refresh is pending
    const logoutPromise = logoutCurrentSession();
    assert.equal(isSessionTerminationActive(), true);
    assert.equal(getAccessToken(), null, 'Local principal is cleared synchronously');

    // 3. Stale network response resolves with 200
    resolveRefresh();
    await logoutPromise;

    // 4. Stale in-flight refresh must reject and must NEVER apply token
    await assert.rejects(inFlightRefresh, StaleAuthSessionError);
    assert.equal(getAccessToken(), null, 'Stale refresh response must not resurrect access token');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('5. explicit successful login clears and re-arms the termination barrier', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  const originalFetch = globalThis.fetch;
  const loginToken = createMockJwt('new-user');
  globalThis.fetch = async (url) => {
    if (String(url).includes('/auth/login')) {
      return mockResponse(200, {
        data: {
          accessToken: loginToken,
          user: { id: 'new-user', email: 'new@nexora.ai' },
        },
      });
    }
    return mockResponse(404);
  };

  try {
    // Activate barrier via logout
    beginSessionTermination();
    assert.equal(isSessionTerminationActive(), true);

    // Explicit login re-arms
    await authApi.login({ email: 'new@nexora.ai', password: 'SecretPassword123' });

    assert.equal(isSessionTerminationActive(), false, 'Explicit login must clear the barrier');
    assert.equal(getAccessToken(), loginToken, 'New access token is established in memory');

    // Subsequent bootstrap respects active session
    const authenticated = await bootstrapAuthSession();
    assert.equal(authenticated, true);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('6. normal non-logout page reload can still restore valid session via HttpOnly cookie', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  const restoredToken = createMockJwt('persisted-session');
  const originalFetch = globalThis.fetch;
  let refreshCalls = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/auth/refresh')) {
      refreshCalls += 1;
      return mockResponse(200, { data: { accessToken: restoredToken } });
    }
    return mockResponse(404);
  };

  try {
    assert.equal(isSessionTerminationActive(), false, 'Barrier must be inactive on regular reload');
    assert.equal(getAccessToken(), null);

    const authenticated = await bootstrapAuthSession();
    assert.equal(authenticated, true);
    assert.equal(refreshCalls, 1, 'Refresh cookie was sent to restore session');
    assert.equal(getAccessToken(), restoredToken, 'Session was successfully restored');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('7. RequireAuth preserves return intent for safe internal product routes', () => {
  const requireAuthSource = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/RequireAuth.tsx'),
    'utf-8'
  );

  assert.match(requireAuthSource, /usePathname/);
  assert.match(requireAuthSource, /isValidInternalPath/);
  assert.match(requireAuthSource, /encodeURIComponent\(currentPath\)/);
  assert.match(requireAuthSource, /router\.replace\(getSafeAuthRedirectUrl\(\)\)/);

  // Assert canonical protected routes pass isValidInternalPath
  const sampleProtectedRoutes = [
    '/interviews/new',
    '/account',
    '/practice',
    '/learning-path',
    '/resume-analyses',
    '/overview',
    '/settings',
    '/payment-history',
    '/admin/users',
  ];

  for (const route of sampleProtectedRoutes) {
    assert.equal(isValidInternalPath(route), true, `Protected route ${route} must be valid internal path`);
  }
});

test('8. malicious returnTo candidates are strictly rejected by authIntent validation', () => {
  const dangerousUrls = [
    'https://evil.com',
    'http://attacker.com/steal',
    '//evil.com',
    '//evil.com/phish',
    '/\\evil.com',
    '/\\evil.com/path',
    'javascript:alert(1)',
    'data:text/html,<script>',
    '/unknown-secret-route',
    '/api/v1/internal',
    '/\r\nevil.com',
    '/overview\tattacker',
  ];

  for (const dangerous of dangerousUrls) {
    assert.equal(isValidInternalPath(dangerous), false, `Dangerous candidate ${dangerous} must be rejected`);
    assert.equal(resolveSafeReturnUrl(dangerous, '/overview'), '/overview', `Dangerous candidate ${dangerous} must fall back`);
  }
});

test('9. protected route audit: dashboard and admin layouts enforce RequireAuth at layout boundary', () => {
  const dashboardLayoutSource = fs.readFileSync(
    path.join(rootDir, 'src/app/(dashboard)/layout.tsx'),
    'utf-8'
  );
  const adminLayoutSource = fs.readFileSync(
    path.join(rootDir, 'src/app/(admin)/layout.tsx'),
    'utf-8'
  );

  assert.match(dashboardLayoutSource, /<RequireAuth>/);
  assert.match(adminLayoutSource, /<RequireAuth>/);
  assert.match(adminLayoutSource, /<RequireAdmin>/);

  // Verify all audited routes exist on disk inside (dashboard) or (admin)
  const requiredDashboardRoutes = [
    '(dashboard)/overview/page.tsx',
    '(dashboard)/interviews/new/page.tsx',
    '(dashboard)/interviews/history/page.tsx',
    '(dashboard)/cv-analysis/history/page.tsx',
    '(dashboard)/practice/page.tsx',
    '(dashboard)/learning-path/page.tsx',
    '(dashboard)/analytics/page.tsx',
    '(dashboard)/account/page.tsx',
    '(dashboard)/settings/page.tsx',
    '(dashboard)/payment-history/page.tsx',
  ];

  for (const relPath of requiredDashboardRoutes) {
    const fullPath = path.join(rootDir, 'src/app', relPath);
    assert.equal(fs.existsSync(fullPath), true, `Protected route ${relPath} must exist under protected layout`);
  }

  const requiredAdminRoutes = [
    '(admin)/admin/page.tsx',
    '(admin)/admin/users/page.tsx',
    '(admin)/admin/plans/page.tsx',
    '(admin)/admin/scenarios/page.tsx',
    '(admin)/admin/site-content/page.tsx',
    '(admin)/admin/feedback/page.tsx',
    '(admin)/admin/transactions/page.tsx',
  ];

  for (const relPath of requiredAdminRoutes) {
    const fullPath = path.join(rootDir, 'src/app', relPath);
    assert.equal(fs.existsSync(fullPath), true, `Admin route ${relPath} must exist under protected layout`);
  }
});

test('10. logout network call uses keepalive: true and handles server failure authoritatively', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  const tokenA = createMockJwt('account-a');
  setAccessToken(tokenA);

  const originalFetch = globalThis.fetch;
  let capturedInit = null;
  globalThis.fetch = async (_url, init) => {
    capturedInit = init;
    return mockResponse(204);
  };

  try {
    const result = await logoutCurrentSession();
    assert.equal(result.serverLogoutSucceeded, true);
    assert.equal(capturedInit?.keepalive, true, 'Logout request must specify keepalive: true');
    assert.equal(capturedInit?.headers?.Authorization, `Bearer ${tokenA}`);
    assert.equal(isSessionTerminationActive(), true, 'Barrier remains active after successful logout');
    assert.equal(getAccessToken(), null);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('11. failed server logout does not restore local session and retains termination barrier', async () => {
  clearAccessToken();
  resetSessionTerminationForExplicitLogin();

  const tokenA = createMockJwt('account-a');
  setAccessToken(tokenA);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Network timeout');
  };

  try {
    const result = await logoutCurrentSession();
    assert.equal(result.serverLogoutSucceeded, false, 'Server failure is authoritatively reported');
    assert.equal(getAccessToken(), null, 'Local credentials remain cleared even on server failure');
    assert.equal(isSessionTerminationActive(), true, 'Termination barrier remains active even on server failure');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});
