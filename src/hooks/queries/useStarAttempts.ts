import { useQuery } from '@tanstack/react-query';
import { starBuilderApi, type StarAttemptResponse } from '@/services/starBuilderApi';
import { scenarioApi, type ScenarioAttemptResponse } from '@/services/scenarioApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus, type RealtimeFallbackInterval } from '@/utils/queryPolling';

export const useStarAttempt = (id: string, isScenario: boolean, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: isScenario ? ['scenarioAttempt', id] : ['starAttempt', id],
    queryFn: async (): Promise<ScenarioAttemptResponse | StarAttemptResponse> => (
      isScenario ? scenarioApi.getAttempt(id) : starBuilderApi.getAttempt(id)
    ),
    staleTime: 0,
    enabled: authReady && isAuthenticated && !!id,
    // The backend does not currently emit ResourceChanged events for STAR or scenario attempts.
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query) => {
      const status = readStatus(query.state.data);
      if (status === 'completed' || status === 'failed' || status === 'abandoned') {
        return false;
      }
      return REALTIME_FALLBACK_POLL_MS;
    },
  });
};
