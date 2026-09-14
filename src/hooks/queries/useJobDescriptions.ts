import { useQuery } from '@tanstack/react-query';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useJobDescriptions = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['jobDescriptions'],
    queryFn: () => cvAnalysisApi.getJobDescriptions(),
    enabled: authReady && isAuthenticated,
    staleTime: 30000,
  });
};
