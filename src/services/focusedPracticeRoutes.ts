/**
 * Determines whether a pathname corresponds to an active interview room session:
 * /interviews/{id} where id is a dynamic session identifier (e.g. UUID)
 * and NOT static pages such as 'new' (preflight), 'history', or subroutes like '/report'.
 */
export function isInterviewRoomRoute(pathname: string): boolean {
  if (!pathname.startsWith('/interviews/')) return false;
  const segment = pathname.slice('/interviews/'.length);
  if (!segment || segment.includes('/')) return false;
  return segment !== 'new' && segment !== 'history';
}

export function isFocusedPracticeRoute(pathname: string): boolean {
  return (
    isInterviewRoomRoute(pathname) ||
    pathname === '/practice/star' ||
    /^\/practice\/scenarios\/[^/]+$/.test(pathname)
  );
}
