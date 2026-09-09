import { useQuery } from '@tanstack/react-query';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus, type RealtimeFallbackInterval } from '@/utils/queryPolling';

export const useResumeAnalysis = (id: string, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['resumeAnalysis', id],
    queryFn: () => cvAnalysisApi.getAnalysis(id),
    staleTime: 30000,
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query) => {
      const status = readStatus(query.state.data);
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return REALTIME_FALLBACK_POLL_MS;
    },
  });
};
