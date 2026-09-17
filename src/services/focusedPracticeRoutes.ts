export function isFocusedPracticeRoute(pathname: string): boolean {
  return (
    /^\/interviews\/[^/]+$/.test(pathname) ||
    pathname === '/practice/star' ||
    /^\/practice\/scenarios\/[^/]+$/.test(pathname)
  );
}
