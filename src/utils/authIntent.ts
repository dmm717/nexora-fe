/**
 * Safe Auth Intent Preservation & Restoration utilities.
 * Ensures open-redirect prevention by strictly validating paths against internal route patterns.
 */

export interface AuthIntent {
  action: 'cv_analysis' | 'interview' | 'star' | 'scenario' | 'pricing' | 'checkout' | 'navigation';
  targetUrl: string;
  planPriceId?: string;
}

const STORAGE_KEY = 'nexora_auth_intent';

/**
 * Whitelist of permitted internal pathname prefixes.
 * Any destination outside these prefixes fails closed.
 */
export const ALLOWED_PATH_PREFIXES = [
  '/',
  '/overview',
  '/cv-analysis',
  '/interview',
  '/interviews',
  '/pricing',
  '/plans',
  '/practice',
  '/scenarios',
  '/star-builder',
  '/analytics',
  '/career-goals',
  '/account',
  '/billing',
  '/resumes',
  '/resume-analyses',
  '/learning-path',
  '/skill-profile',
];

/**
 * Validates whether a given URL string is a safe, internal relative path.
 * Disallows absolute URLs (e.g. https://evil.com), protocol-relative URLs (//evil.com),
 * and Javascript pseudo-protocols.
 *
 * Rules:
 * - "/" matches ONLY the exact root.
 * - Non-root prefixes match either exact prefix or prefix/...
 * - Arbitrary unknown subpaths (e.g. /some-random-route, /api/...) fail closed.
 */
export function isValidInternalPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();

  // Must begin with a single slash, not double slash or backslash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false;
  }

  // Prevent backslash smuggling or newline/tab injection
  if (/[\r\n\t\\]/.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, 'https://nexora.internal');
    if (parsed.origin !== 'https://nexora.internal') {
      return false;
    }

    const pathname = parsed.pathname;

    // Exact root matches only '/'
    if (pathname === '/') return true;

    // Non-root prefixes match exact prefix or prefix + '/'
    return ALLOWED_PATH_PREFIXES
      .filter((prefix) => prefix !== '/')
      .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

/**
 * Checks if a validated internal path is an interview route (e.g. /interview, /interviews/123).
 */
export function isInterviewRoute(url: string | null | undefined): boolean {
  if (!isValidInternalPath(url)) return false;
  try {
    const parsed = new URL(url!.trim(), 'https://nexora.internal');
    const pathname = parsed.pathname;
    return (
      pathname === '/interview' ||
      pathname.startsWith('/interview/') ||
      pathname === '/interviews' ||
      pathname.startsWith('/interviews/')
    );
  } catch {
    return false;
  }
}

/**
 * Resolves a safe redirect destination, falling back to /overview.
 */
export function resolveSafeReturnUrl(
  candidate: string | null | undefined,
  fallback = '/overview'
): string {
  if (isValidInternalPath(candidate)) {
    return candidate!.trim();
  }
  return fallback;
}

/**
 * Encodes an intent into a safe returnTo query param string for /auth.
 */
export function buildAuthRedirectUrl(
  intent: AuthIntent,
  mode: 'login' | 'register' = 'login'
): string {
  const safeTarget = resolveSafeReturnUrl(intent.targetUrl, '/overview');
  const params = new URLSearchParams();

  if (mode === 'register') {
    params.set('mode', 'register');
  }

  params.set('returnTo', safeTarget);
  params.set('intentAction', intent.action);

  if (intent.planPriceId) {
    params.set('planPriceId', intent.planPriceId);
  }

  return `/auth?${params.toString()}`;
}

/**
 * Persists an intent to sessionStorage for recovery across multi-step auth pages if needed.
 */
export function storeAuthIntent(intent: AuthIntent): void {
  if (typeof window === 'undefined') return;
  try {
    if (isValidInternalPath(intent.targetUrl)) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    }
  } catch {
    // SessionStorage may be restricted
  }
}

/**
 * Retrieves and clears stored intent.
 */
export function consumeAuthIntent(): AuthIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as AuthIntent;
    if (parsed && isValidInternalPath(parsed.targetUrl)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
