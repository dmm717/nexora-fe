import { useQuery } from '@tanstack/react-query';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useResumeAnalysis = (id: string, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['resumeAnalysis', id],
    queryFn: () => cvAnalysisApi.getAnalysis(id),
    staleTime: 30000,
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval,
  });
};
