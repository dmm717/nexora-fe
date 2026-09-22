import { useQuery } from '@tanstack/react-query';
import { platformStatsApi } from '@/services/platformStatsApi';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['public', 'platform-stats'],
    queryFn: platformStatsApi.get,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
