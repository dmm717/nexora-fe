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
  isPublicInformationalRoute,
  isAuthSensitiveRoute,
  isProtectedRoute,
  shouldEagerlyBootstrapAuth,
  normalizePathname,
} from '../src/services/authRoutePolicy.ts';

import {
  bootstrapAuthSession,
} from '../src/services/authSession.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('A. fresh anonymous "/": route policy skips eager refresh probe to avoid unnecessary 401', async () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);

  assert.equal(isPublicInformationalRoute('/'), true);
  assert.equal(isPublicInformationalRoute(''), true);
  assert.equal(isPublicInformationalRoute('/?ref=promo'), true);
  assert.equal(shouldEagerlyBootstrapAuth('/'), false);

  // Other public marketing routes also skip eager probe
  assert.equal(shouldEagerlyBootstrapAuth('/status'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/courses'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/design-system'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/auth'), false);
  assert.equal(shouldEagerlyBootstrapAuth('/login'), false);

  // Verify that AuthBootstrapProvider uses shouldBootstrap to bypass network refresh
  const providerContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/AuthBootstrapProvider.tsx'),
    'utf-8'
  );
  assert.match(
    providerContent,
    /useAuthRouteBootstrap/,
    'AuthBootstrapProvider must consume route bootstrap policy'
  );
  assert.match(
    providerContent,
    /if\s*\(!shouldBootstrap\)\s*{[\s\S]*setIsAuthenticated\(false\);[\s\S]*setSessionInitialized\(true\);[\s\S]*return;[\s\S]*}/,
    'AuthBootstrapProvider must immediately initialize anonymous state without network refresh when shouldBootstrap is false'
  );
});

test('B. anonymous "/": public landing works normally without auth requirement', () => {
  const pageContent = fs.readFileSync(path.join(rootDir, 'src/app/page.tsx'), 'utf-8');
  assert.doesNotMatch(pageContent, /RequireAuth/);
  assert.doesNotMatch(pageContent, /router\.replace\(['"]\/auth['"]\)/);
});

test('C. authenticated in-memory session on "/": existing auth state remains immediately usable', async () => {
  setAccessToken('valid_user_session_token');
  try {
    assert.equal(getAccessToken(), 'valid_user_session_token');

    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error('fetch should not be called when in-memory token exists');
    };

    try {
      const result = await bootstrapAuthSession();
      assert.equal(result, true);
      assert.equal(fetchCalled, false);
      assert.equal(getAccessToken(), 'valid_user_session_token');
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    clearAccessToken();
  }
});

test('D. hard-loaded "/pricing": session restoration is required and resolves before shell selection', () => {
  assert.equal(isAuthSensitiveRoute('/pricing'), true);
  assert.equal(isAuthSensitiveRoute('/plans'), true);
  assert.equal(shouldEagerlyBootstrapAuth('/pricing'), true);
  assert.equal(shouldEagerlyBootstrapAuth('/plans'), true);

  const shellContent = fs.readFileSync(
    path.join(rootDir, 'src/components/features/pricing/PricingPageShell.tsx'),
    'utf-8'
  );
  assert.match(shellContent, /if\s*\(isAuthenticated\)/);
  assert.match(shellContent, /if\s*\(!authReady\)/);
  assert.match(shellContent, /animate-spin/);
});

test('E. protected route: session restoration remains required before protected access', () => {
  const protectedPaths = [
    '/overview',
    '/billing',
    '/account',
    '/analytics',
    '/interviews',
    '/interviews/new',
    '/practice',
    '/practice/scenarios/system-design',
    '/learning-path',
    '/cv-analysis',
  ];

  for (const path of protectedPaths) {
    assert.equal(isProtectedRoute(path), true, `${path} must be classified as protected`);
    assert.equal(shouldEagerlyBootstrapAuth(path), true, `${path} must require eager bootstrap`);
  }
});

test('F. expired protected session: canonical 401 auth handling clears memory token', async () => {
  clearAccessToken();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Unauthorized refresh cookie' }),
  });

  try {
    const result = await bootstrapAuthSession();
    assert.equal(result, false, 'Expired session returns false');
    assert.equal(getAccessToken(), null, 'Access token is kept cleared');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('G. REST 401 refresh behavior remains unchanged and unregressed', () => {
  const apiClientContent = fs.readFileSync(
    path.join(rootDir, 'src/services/apiClient.ts'),
    'utf-8'
  );

  assert.match(apiClientContent, /response\.status === 401/);
  assert.match(apiClientContent, /refreshSession\(\)/);
  assert.match(apiClientContent, /clearAccessToken\(\)/);
});

test('H. SignalR token refresh behavior from this PR remains unchanged', () => {
  const realtimeProviderContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/RealtimeProvider.tsx'),
    'utf-8'
  );

  assert.match(realtimeProviderContent, /getUsableAccessToken/);
  assert.match(realtimeProviderContent, /refreshIfExpiringWithinSeconds:\s*60/);
});

test('I. Pathname normalization handles edges cleanly', () => {
  assert.equal(normalizePathname(''), '/');
  assert.equal(normalizePathname(null), '/');
  assert.equal(normalizePathname(undefined), '/');
  assert.equal(normalizePathname('/'), '/');
  assert.equal(normalizePathname('/overview/'), '/overview');
  assert.equal(normalizePathname('/pricing?tier=pro#features'), '/pricing');
});
