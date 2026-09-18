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
  bootstrapAuthSession,
  AuthRefreshError,
} from '../src/services/authSession.ts';

import {
  shouldEagerlyBootstrapAuth,
} from '../src/services/authRoutePolicy.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Simulates the AuthBootstrapProvider effect lifecycle across route transitions.
 * Reproduces the exact React effect cancellation and subscription logic.
 */
function createProviderLifecycleHarness() {
  let sessionInitialized = false;
  let isAuthenticated = Boolean(getAccessToken());
  let bootstrapError = null;
  let isDefinitivelyUnauthenticated = false;

  let currentEffectCleanup = null;

  const navigateTo = (pathname) => {
    // 1. Cleanup prior effect (sets cancelled = true)
    if (currentEffectCleanup) {
      currentEffectCleanup();
      currentEffectCleanup = null;
    }

    const shouldBootstrap = shouldEagerlyBootstrapAuth(pathname);
    let cancelled = false;

    currentEffectCleanup = () => {
      cancelled = true;
    };

    const runEffect = async () => {
      if (getAccessToken()) {
        if (!cancelled) {
          isAuthenticated = true;
          bootstrapError = null;
          sessionInitialized = true;
        }
        return;
      }

      if (!shouldBootstrap) {
        if (!cancelled) {
          isAuthenticated = false;
          sessionInitialized = true;
        }
        return;
      }

      if (isDefinitivelyUnauthenticated) {
        if (!cancelled) {
          isAuthenticated = false;
          sessionInitialized = true;
        }
        return;
      }

      if (!cancelled) {
        bootstrapError = null;
        sessionInitialized = false;
      }

      try {
        const authResult = await bootstrapAuthSession();
        if (cancelled) return;

        if (authResult) {
          isDefinitivelyUnauthenticated = false;
          isAuthenticated = true;
          bootstrapError = null;
        } else {
          isDefinitivelyUnauthenticated = true;
          isAuthenticated = false;
          bootstrapError = null;
        }
        sessionInitialized = true;
      } catch (error) {
        if (cancelled) return;

        bootstrapError = error instanceof Error ? error : new Error('Bootstrap failed');
        isAuthenticated = Boolean(getAccessToken());
        sessionInitialized = true;
      }
    };

    const effectPromise = runEffect();
    return {
      effectPromise,
      getState: () => ({
        authReady: sessionInitialized,
        sessionInitialized,
        isAuthenticated,
        bootstrapError,
      }),
    };
  };

  return {
    navigateTo,
    getState: () => ({
      authReady: sessionInitialized,
      sessionInitialized,
      isAuthenticated,
      bootstrapError,
    }),
  };
}

test('A. Route A bootstrap pending -> pathname changes to Route B -> refresh succeeds -> current route becomes authReady/authenticated', async () => {
  clearAccessToken();

  let resolveFetch;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    new Promise((resolve) => {
      resolveFetch = () => {
        resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: { accessToken: 'shared_restored_token_abc' },
          }),
        });
      };
    });

  try {
    const harness = createProviderLifecycleHarness();

    // 1. Initial route '/' triggers bootstrap
    const routeA = harness.navigateTo('/');
    assert.equal(harness.getState().sessionInitialized, false, 'Route A starts pending');

    // 2. Client navigates to '/overview' while Route A's refresh is still in-flight
    const routeB = harness.navigateTo('/overview');
    assert.equal(harness.getState().sessionInitialized, false, 'Route B starts pending while awaiting shared request');

    // 3. Network request resolves with 200
    resolveFetch();
    await Promise.all([routeA.effectPromise, routeB.effectPromise]);

    const finalState = harness.getState();
    assert.equal(finalState.authReady, true, 'Current route becomes authReady=true');
    assert.equal(finalState.isAuthenticated, true, 'Current route becomes authenticated=true');
    assert.equal(finalState.bootstrapError, null, 'bootstrapError is null');
    assert.equal(getAccessToken(), 'shared_restored_token_abc', 'Token is preserved in memory');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('B. Route A bootstrap pending -> pathname changes -> refresh returns 401 -> current route resolves authReady=true, isAuthenticated=false, bootstrapError=null', async () => {
  clearAccessToken();

  let resolveFetch;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    new Promise((resolve) => {
      resolveFetch = () => {
        resolve({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Unauthorized' }),
        });
      };
    });

  try {
    const harness = createProviderLifecycleHarness();

    const routeA = harness.navigateTo('/');
    assert.equal(harness.getState().sessionInitialized, false);

    const routeB = harness.navigateTo('/pricing');
    assert.equal(harness.getState().sessionInitialized, false);

    resolveFetch();
    await Promise.all([routeA.effectPromise, routeB.effectPromise]);

    const finalState = harness.getState();
    assert.equal(finalState.authReady, true, 'Current route resolves authReady=true after 401');
    assert.equal(finalState.isAuthenticated, false, 'Current route resolves isAuthenticated=false');
    assert.equal(finalState.bootstrapError, null, 'bootstrapError is null on canonical 401');
    assert.equal(getAccessToken(), null, 'Access token is null');
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('C. Route A bootstrap pending -> pathname changes -> refresh returns 503 -> current route resolves authReady=true with bootstrapError populated', async () => {
  clearAccessToken();

  let resolveFetch;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    new Promise((resolve) => {
      resolveFetch = () => {
        resolve({
          ok: false,
          status: 503,
          json: async () => ({ message: 'Service Unavailable (cold start)' }),
        });
      };
    });

  try {
    const harness = createProviderLifecycleHarness();

    const routeA = harness.navigateTo('/');
    const routeB = harness.navigateTo('/interviews/new');

    resolveFetch();
    await Promise.all([routeA.effectPromise, routeB.effectPromise]);

    const finalState = harness.getState();
    assert.equal(finalState.authReady, true, 'Current route resolves authReady=true after 503');
    assert.equal(finalState.isAuthenticated, false, 'isAuthenticated is false on failure without token');
    assert.ok(finalState.bootstrapError instanceof AuthRefreshError, 'bootstrapError is populated');
    assert.equal(finalState.bootstrapError.status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('D. Two route effects awaiting same bootstrap -> exactly ONE refresh network request', async () => {
  clearAccessToken();

  let networkCalls = 0;
  let resolveFetch;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input) => {
    if (String(input).includes('/auth/refresh')) {
      networkCalls += 1;
      return new Promise((resolve) => {
        resolveFetch = () => {
          resolve({
            ok: true,
            status: 200,
            json: async () => ({
              data: { accessToken: 'single_network_token' },
            }),
          });
        };
      });
    }
    throw new Error('Unexpected fetch');
  };

  try {
    const harness = createProviderLifecycleHarness();

    const routeA = harness.navigateTo('/');
    const routeB = harness.navigateTo('/billing');

    resolveFetch();
    await Promise.all([routeA.effectPromise, routeB.effectPromise]);

    assert.equal(networkCalls, 1, 'Exactly ONE network refresh request occurred despite route transition during in-flight bootstrap');
    assert.equal(getAccessToken(), 'single_network_token');
    assert.equal(harness.getState().authReady, true);
    assert.equal(harness.getState().isAuthenticated, true);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('E. After transient failure, later retry remains possible and succeeds', async () => {
  clearAccessToken();

  let attemptCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    attemptCount += 1;
    if (attemptCount === 1) {
      return Promise.resolve({
        ok: false,
        status: 503,
        json: async () => ({ message: 'Render cold start' }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: { accessToken: 'retried_token_xyz' } }),
    });
  };

  try {
    const harness = createProviderLifecycleHarness();

    // Attempt 1 fails with 503
    const route1 = harness.navigateTo('/overview');
    await route1.effectPromise;
    assert.equal(harness.getState().authReady, true);
    assert.ok(harness.getState().bootstrapError);

    // Later retry (e.g. user retries or navigates again)
    const retryRoute = harness.navigateTo('/overview');
    await retryRoute.effectPromise;

    assert.equal(harness.getState().authReady, true);
    assert.equal(harness.getState().isAuthenticated, true);
    assert.equal(harness.getState().bootstrapError, null, 'bootstrapError was cleared on successful retry');
    assert.equal(getAccessToken(), 'retried_token_xyz');
    assert.equal(attemptCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
    clearAccessToken();
  }
});

test('F. AuthBootstrapProvider source check: removed early isBootstrappingRef return and preserved shared promise awaiting', () => {
  const providerContent = fs.readFileSync(
    path.join(rootDir, 'src/components/providers/AuthBootstrapProvider.tsx'),
    'utf-8'
  );

  assert.doesNotMatch(
    providerContent,
    /isBootstrappingRef\.current/,
    'AuthBootstrapProvider must not use isBootstrappingRef to early-return before awaiting bootstrap'
  );

  assert.match(
    providerContent,
    /const authenticated = await bootstrapAuthSession\(\);/,
    'AuthBootstrapProvider must await shared bootstrapAuthSession'
  );

  assert.match(
    providerContent,
    /if\s*\(cancelled\)\s*return;/,
    'AuthBootstrapProvider must check cancelled flag after awaiting bootstrap'
  );
});
