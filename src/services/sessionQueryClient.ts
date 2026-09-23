import { QueryClient } from '@tanstack/react-query';
import { getPrincipalEpoch } from '../store/authStore.ts';

export const createSessionQueryClient = (): QueryClient => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

/**
 * Owns the active QueryClient for the current principal epoch.
 * The old client is cleared and then discarded so every private query key is
 * isolated without maintaining a list of account-owned query prefixes.
 */
export class SessionQueryClientManager {
  private epoch: number;
  private client: QueryClient;

  constructor(initialEpoch: number = getPrincipalEpoch()) {
    this.epoch = initialEpoch;
    this.client = createSessionQueryClient();
  }

  getEpoch(): number {
    return this.epoch;
  }

  getQueryClient(): QueryClient {
    return this.client;
  }

  sync(nextEpoch: number): QueryClient {
    if (nextEpoch === this.epoch) return this.client;

    this.client.clear();
    this.client = createSessionQueryClient();
    this.epoch = nextEpoch;
    return this.client;
  }
}
