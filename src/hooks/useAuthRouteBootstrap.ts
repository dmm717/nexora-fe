'use client';

import { usePathname } from 'next/navigation';
import { shouldEagerlyBootstrapAuth } from '@/services/authRoutePolicy';

export function useAuthRouteBootstrap() {
  let pathname = '/';
  try {
    const current = usePathname();
    if (current) pathname = current;
  } catch {
    if (typeof window !== 'undefined' && window.location?.pathname) {
      pathname = window.location.pathname;
    }
  }

  const shouldBootstrap = shouldEagerlyBootstrapAuth(pathname);
  return { pathname, shouldBootstrap };
}
