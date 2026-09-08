import { useQuery } from '@tanstack/react-query';
import { starBuilderApi } from '@/services/starBuilderApi';
import { scenarioApi } from '@/services/scenarioApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useStarAttempt = (id: string, isScenario: boolean, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: isScenario ? ['scenarioAttempt', id] : ['starAttempt', id],
    queryFn: () => isScenario ? scenarioApi.getAttempt(id) as any : starBuilderApi.getAttempt(id) as any,
    staleTime: 0,
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query: any) => {
      const data = query.state.data as any;
      if (data) {
        const status = (data.status || data.Status || '').toLowerCase();
        if (status === 'completed' || status === 'failed' || status === 'abandoned') {
          return false;
        }
      }
      return 15000;
    },
  });
};
