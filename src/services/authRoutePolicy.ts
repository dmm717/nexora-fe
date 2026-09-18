/**
 * Route-aware authentication bootstrap policy.
 *
 * Distinguishes routes with auth-aware UI from truly stateless public routes.
 *
 * Routes with auth-aware UI (such as '/', '/auth', '/pricing', and all protected routes)
 * MUST eagerly restore the session via /api/v1/auth/refresh when the in-memory access token
 * is absent, so that a valid HttpOnly refresh-cookie session is preserved across hard page reloads.
 *
 * Truly stateless routes (such as '/status' and '/design-system') have no authentication-dependent
 * UI components (no auth-aware Header, CTAs, or guards) and skip eager session probing.
 */

// Truly stateless public routes whose UI has zero auth dependencies
export const STATELESS_NON_AUTH_ROUTES: readonly string[] = [
  '/status',
  '/design-system',
];

export const normalizePathname = (pathname?: string | null): string => {
  if (!pathname) return '/';
  const cleaned = pathname.split('?')[0].split('#')[0].trim();
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    return cleaned.slice(0, -1);
  }
  return cleaned || '/';
};

export const isStatelessNonAuthRoute = (pathname?: string | null): boolean => {
  const normalized = normalizePathname(pathname);
  return STATELESS_NON_AUTH_ROUTES.some((route) => {
    return normalized === route || normalized.startsWith(`${route}/`);
  });
};

export const shouldEagerlyBootstrapAuth = (pathname?: string | null): boolean => {
  // Truly stateless routes skip eager bootstrap
  if (isStatelessNonAuthRoute(pathname)) {
    return false;
  }
  // All other routes (including '/', '/auth', '/pricing', and protected routes)
  // contain auth-aware UI and must eagerly restore sessions on hard reload.
  return true;
};
