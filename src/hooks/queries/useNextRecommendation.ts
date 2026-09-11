import { useQuery } from '@tanstack/react-query';
import { recommendationsApi } from '@/services/recommendationsApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY = [
  'nextPracticeRecommendation',
] as const;

export type { NextPracticeRecommendationResponse } from '@/services/recommendationsApi';

export const useNextRecommendation = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY,
    queryFn: () => recommendationsApi.getNext(),
    staleTime: 30 * 1000,
    enabled: authReady && isAuthenticated,
    retry: (failureCount, error) => {
      // Deterministic prerequisite errors should not be retried continuously
      const apiError = error as { code?: string; status?: number };
      if (
        apiError?.code === 'ACTIVE_CAREER_GOAL_REQUIRED' ||
        apiError?.code === 'LEARNING_PATH_NOT_FOUND' ||
        apiError?.status === 404 ||
        apiError?.status === 400
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

