'use client';

import { usePathname } from 'next/navigation';

/** Sensitive public flows use local SVG icons and do not load the external icon font. */
export function MaterialSymbolsStyles() {
  const pathname = usePathname();
  if (pathname === '/account-deletion' || pathname?.startsWith('/account-deletion/')) return null;
  return <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />;
}
