/**
 * Route-aware authentication bootstrap policy.
 *
 * Determines whether initial page load or route entry should eagerly probe
 * the server's /api/v1/auth/refresh endpoint when the in-memory access token is absent.
 *
 * Marketing / public informational routes (such as '/', '/status', '/courses')
 * render purely public content and must NOT trigger an expected 401 network probe
 * in fresh anonymous / incognito sessions.
 *
 * Auth-sensitive public routes (such as '/pricing', '/plans') and protected product
 * routes (such as '/(dashboard)/*', '/interviews/*', '/billing', '/overview')
 * DO require eager session bootstrap to restore authenticated state before rendering
 * or routing.
 */

// Public informational routes that never require eager auth refresh probes when anonymous
export const PUBLIC_INFORMATIONAL_ROUTES: readonly string[] = [
  '/',
  '/public',
  '/status',
  '/design-system',
  '/courses',
  '/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

// Auth-sensitive public routes where presentation differs for authenticated vs anonymous users
export const AUTH_SENSITIVE_PUBLIC_ROUTES: readonly string[] = [
  '/pricing',
  '/plans',
];

export const normalizePathname = (pathname?: string | null): string => {
  if (!pathname) return '/';
  const cleaned = pathname.split('?')[0].split('#')[0].trim();
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    return cleaned.slice(0, -1);
  }
  return cleaned || '/';
};

export const isPublicInformationalRoute = (pathname?: string | null): boolean => {
  const normalized = normalizePathname(pathname);
  if (normalized === '/' || normalized === '') return true;

  return PUBLIC_INFORMATIONAL_ROUTES.some((route) => {
    if (route === '/') return normalized === '/';
    return normalized === route || normalized.startsWith(`${route}/`);
  });
};

export const isAuthSensitiveRoute = (pathname?: string | null): boolean => {
  const normalized = normalizePathname(pathname);
  return AUTH_SENSITIVE_PUBLIC_ROUTES.some((route) => {
    return normalized === route || normalized.startsWith(`${route}/`);
  });
};

export const isProtectedRoute = (pathname?: string | null): boolean => {
  return !isPublicInformationalRoute(pathname) && !isAuthSensitiveRoute(pathname);
};

export const shouldEagerlyBootstrapAuth = (pathname?: string | null): boolean => {
  // If it's a public informational route, do NOT eagerly call refresh
  if (isPublicInformationalRoute(pathname)) {
    return false;
  }
  // For auth-sensitive public routes and all protected product routes, eager bootstrap is required
  return true;
};
