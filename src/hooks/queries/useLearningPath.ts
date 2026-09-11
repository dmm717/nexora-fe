import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningPathApi } from '@/services/learningPathApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { SKILL_PROFILE_QUERY_KEY } from './useSkillProfile';
import { NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY } from './useNextRecommendation';
import { PROGRESS_DASHBOARD_QUERY_KEY } from './useProgressDashboard';

export const LEARNING_PATH_QUERY_KEY = ['learningPath'] as const;

export type { LearningPathResponse } from '@/services/learningPathApi';

export const useLearningPath = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: LEARNING_PATH_QUERY_KEY,
    queryFn: () => learningPathApi.get(),
    staleTime: 30 * 1000,
    enabled: authReady && isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry when no career goal exists or learning path is not generated yet
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

export const useGenerateLearningPath = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => learningPathApi.generate(),
    onSuccess: (data) => {
      queryClient.setQueryData(LEARNING_PATH_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};

export const useRefreshLearningPath = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => learningPathApi.refresh(),
    onSuccess: (data) => {
      queryClient.setQueryData(LEARNING_PATH_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};

export const useCompleteLearningPathActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => learningPathApi.completeActivity(activityId),
    onSuccess: (data) => {
      queryClient.setQueryData(LEARNING_PATH_QUERY_KEY, data);
      void queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SKILL_PROFILE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};
