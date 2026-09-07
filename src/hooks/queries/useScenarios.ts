import { useQuery } from '@tanstack/react-query';
import { scenarioApi } from '@/services/scenarioApi';

export const useScenarios = () => {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenarioApi.getScenarios(),
    staleTime: Infinity, // Scenarios are static catalog data
  });
};

export const useScenarioDetails = (slug: string) => {
  return useQuery({
    queryKey: ['scenarioDetails', slug],
    queryFn: () => scenarioApi.getScenarioDetails(slug),
    staleTime: Infinity,
    enabled: !!slug,
  });
};
