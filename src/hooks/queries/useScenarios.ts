import { useQuery } from '@tanstack/react-query';
import { scenarioApi } from '@/services/scenarioApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useScenarios = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenarioApi.getScenarios(),
    staleTime: Infinity, // Scenarios are static catalog data
    enabled: authReady && isAuthenticated,
  });
};

export const useScenarioDetails = (slug: string) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarioDetails', slug],
    queryFn: () => scenarioApi.getScenarioDetails(slug),
    staleTime: Infinity,
    enabled: authReady && isAuthenticated && !!slug,
  });
};
