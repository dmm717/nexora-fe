import { useQuery, useQueryClient } from '@tanstack/react-query';
import { starBuilderApi, type StarAttemptResponse } from '@/services/starBuilderApi';
import { scenarioApi, type ScenarioAttemptResponse } from '@/services/scenarioApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus, type RealtimeFallbackInterval } from '@/utils/queryPolling';
import { invalidatePracticeAggregates } from '@/services/practiceInvalidation';

export const useStarAttempt = (id: string, isScenario: boolean, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: isScenario ? ['scenarioAttempt', id] : ['starAttempt', id],
    queryFn: async (): Promise<ScenarioAttemptResponse | StarAttemptResponse> => {
      const result = isScenario ? await scenarioApi.getAttempt(id) : await starBuilderApi.getAttempt(id);
      if (result && 'status' in result && result.status === 'completed') {
        invalidatePracticeAggregates(queryClient);
      }
      return result;
    },
    staleTime: 0,
    enabled: authReady && isAuthenticated && !!id,
    // Realtime notifications are primary via SignalR resourceChanged; polling provides safety-net fallback.
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query) => {
      const status = readStatus(query.state.data);
      if (status === 'completed' || status === 'failed' || status === 'abandoned') {
        return false;
      }
      return REALTIME_FALLBACK_POLL_MS;
    },
  });
};

export const useStarAttempts = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['starAttempts'],
    queryFn: () => starBuilderApi.listRecentAttempts(),
    staleTime: 30 * 1000,
    enabled: authReady && isAuthenticated,
  });
};
