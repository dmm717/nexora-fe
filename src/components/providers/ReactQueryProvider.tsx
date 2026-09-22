'use client';

import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getPrincipalEpoch, subscribePrincipalEpoch } from '@/store/authStore';
import { createSessionQueryClient } from '@/services/sessionQueryClient';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const principalEpoch = useSyncExternalStore(
    subscribePrincipalEpoch,
    getPrincipalEpoch,
    () => 0,
  );
  // The dependency is intentionally only used as a lifecycle boundary: a new
  // epoch must always receive a completely new client instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queryClient = useMemo(() => createSessionQueryClient(), [principalEpoch]);

  useEffect(() => () => {
    queryClient.clear();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient} key={`principal-${principalEpoch}`}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
