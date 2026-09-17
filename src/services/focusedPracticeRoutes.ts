const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Determines whether a pathname corresponds to an interview preflight / setup route:
 * /interviews/new or /practice/interview/preflight
 */
export function isInterviewPreflightRoute(pathname: string): boolean {
  return pathname === '/interviews/new' || pathname === '/practice/interview/preflight';
}

/**
 * Determines whether a pathname corresponds to an active interview room session:
 * /interviews/{id} where id is a strict dynamic session UUID.
 * Static segments ('new', 'history', etc.) and subroutes ('/report') are rejected.
 */
export function isInterviewRoomRoute(pathname: string): boolean {
  if (!pathname.startsWith('/interviews/')) return false;
  const segment = pathname.slice('/interviews/'.length);
  if (!segment || segment.includes('/')) return false;
  return UUID_REGEX.test(segment);
}

/**
 * Determines whether the route should hide the default AuthenticatedHeader shell
 * and render a focused practice canvas without distraction.
 * Both setup preflight and active practice rooms are focused shells.
 */
export function isFocusedPracticeRoute(pathname: string): boolean {
  return (
    isInterviewPreflightRoute(pathname) ||
    isInterviewRoomRoute(pathname) ||
    pathname === '/practice/star' ||
    /^\/practice\/scenarios\/[^/]+$/.test(pathname)
  );
}

/**
 * Determines whether the FocusedPracticeHeader should be rendered for the route.
 * Both preflight setup (/interviews/new) and active practice rooms (/interviews/{UUID}, STAR, scenarios)
 * render the top focused header with safe back navigation.
 */
export function shouldRenderFocusedPracticeHeader(pathname: string): boolean {
  return isFocusedPracticeRoute(pathname);
}

/**
 * Resolves the default exit destination when no custom exitTo is configured.
 * Routes under /interviews exit to /interviews.
 * Routes under /practice exit to /practice.
 */
export function resolveDefaultFocusedExit(pathname: string): string {
  return pathname.startsWith('/interviews') ? '/interviews' : '/practice';
}
