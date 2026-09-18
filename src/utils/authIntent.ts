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
  '/career-profile',
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

const INTERNAL_URL_ORIGIN = 'https://nexora.internal';

function isBillingOrPricingPath(pathname: string): boolean {
  return ['/billing', '/pricing'].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Builds the canonical billing destination for an authenticated checkout.
 * `planPriceId` is authoritative; a billing/pricing candidate may contribute
 * one safe nested destination, while a normal safe internal path is already
 * the post-checkout destination.
 */
export function resolveCheckoutDestination(
  planPriceId: string | null | undefined,
  candidate?: string | null
): string | null {
  const selectedPriceId = typeof planPriceId === 'string' ? planPriceId.trim() : '';
  if (!selectedPriceId) return null;

  const params = new URLSearchParams();
  params.set('selectedPriceId', selectedPriceId);

  if (isValidInternalPath(candidate)) {
    const safeCandidate = candidate!.trim();
    const parsedCandidate = new URL(safeCandidate, INTERNAL_URL_ORIGIN);
    let postCheckoutTarget: string | null = safeCandidate;

    if (isBillingOrPricingPath(parsedCandidate.pathname)) {
      const nestedTargets = parsedCandidate.searchParams.getAll('returnTo');
      postCheckoutTarget = null;

      // Ambiguous or recursive wrappers fail closed instead of creating a
      // billing -> billing/pricing -> ... redirect chain.
      if (nestedTargets.length === 1 && isValidInternalPath(nestedTargets[0])) {
        const nestedTarget = nestedTargets[0].trim();
        const parsedNestedTarget = new URL(nestedTarget, INTERNAL_URL_ORIGIN);
        const nestedCheckoutTargets = parsedNestedTarget.searchParams
          .getAll('returnTo')
          .some((value) => {
            if (!isValidInternalPath(value)) return false;
            const nestedUrl = new URL(value.trim(), INTERNAL_URL_ORIGIN);
            return isBillingOrPricingPath(nestedUrl.pathname);
          });

        if (!isBillingOrPricingPath(parsedNestedTarget.pathname) && !nestedCheckoutTargets) {
          postCheckoutTarget = nestedTarget;
        }
      }
    } else {
      const hasNestedCheckoutTarget = parsedCandidate.searchParams.getAll('returnTo').some((value) => {
        if (!isValidInternalPath(value)) return false;
        const nestedUrl = new URL(value.trim(), INTERNAL_URL_ORIGIN);
        return isBillingOrPricingPath(nestedUrl.pathname);
      });
      if (hasNestedCheckoutTarget) postCheckoutTarget = null;
    }

    if (postCheckoutTarget) params.set('returnTo', postCheckoutTarget);
  }

  return `/billing?${params.toString()}`;
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

function parseStoredAuthIntent(raw: string): AuthIntent | null {
  try {
    const parsed = JSON.parse(raw) as AuthIntent;
    return parsed && isValidInternalPath(parsed.targetUrl) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Reads a safe stored intent without clearing it.
 */
export function peekAuthIntent(): AuthIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? parseStoredAuthIntent(raw) : null;
  } catch {
    return null;
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
    return parseStoredAuthIntent(raw);
  } catch {
    return null;
  }
}
