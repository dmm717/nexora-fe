import { useQuery } from '@tanstack/react-query';
import { interviewApi } from '@/services/interviewApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus, type RealtimeFallbackInterval } from '@/utils/queryPolling';

export const useInterview = (id: string, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewApi.getById(id),
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query) => {
      const status = readStatus(query.state.data);
      if (status === 'active' || status === 'ready' || status === 'completed' || status === 'failed' || status === 'abandoned') {
        return false;
      }
      return REALTIME_FALLBACK_POLL_MS;
    },
  });
};

export const useInterviewReport = (id: string, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interviewReport', id],
    queryFn: () => interviewApi.getReport(id),
    staleTime: 30000,
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query) => {
      if (query.state.data) return false;
      return REALTIME_FALLBACK_POLL_MS;
    },
  });
};
