import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  careerGoalsApi,
  buildCreateCareerGoalRequest,
  type CareerGoalFormValues,
  type UpdateCareerGoalRequest,
} from '@/services/careerGoalsApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY } from './useNextRecommendation';
import { PROGRESS_DASHBOARD_QUERY_KEY } from './useProgressDashboard';

export const CAREER_GOALS_QUERY_KEY = ['careerGoals'] as const;

export type { CareerGoalFormValues, CareerGoalResponse } from '@/services/careerGoalsApi';

export const useCareerGoals = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: CAREER_GOALS_QUERY_KEY,
    queryFn: () => careerGoalsApi.list(),
    staleTime: 30 * 1000,
    enabled: authReady && isAuthenticated,
  });
};

export const useCreateCareerGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CareerGoalFormValues) =>
      careerGoalsApi.create(buildCreateCareerGoalRequest(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAREER_GOALS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};

export const useUpdateCareerGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateCareerGoalRequest }) =>
      careerGoalsApi.update(id, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAREER_GOALS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};

/** Archive = deactivate via PATCH active:false (backend has no DELETE). */
export const useArchiveCareerGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      careerGoalsApi.update(id, { activeSpecified: true, active: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAREER_GOALS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};

/** Reactivate via PATCH active:true. */
export const useReactivateCareerGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      careerGoalsApi.update(id, { activeSpecified: true, active: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CAREER_GOALS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};

/** Delete career goal via DELETE with Idempotency-Key. Optimistic update the cache. */
export const useDeleteCareerGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => careerGoalsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Optimistic update
      queryClient.setQueryData<import('@/services/careerGoalsApi').CareerGoalResponse[]>(
        CAREER_GOALS_QUERY_KEY,
        (old) => (old ? old.filter((goal) => goal.id !== deletedId) : [])
      );
      // Still need to invalidate dashboard/recommendation since they might depend on the deleted goal
      void queryClient.invalidateQueries({ queryKey: NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROGRESS_DASHBOARD_QUERY_KEY });
    },
  });
};
