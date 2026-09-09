import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenarioApi } from '@/services/scenarioApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import type { ScenarioFilterParams } from '@/types/scenario';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus, type RealtimeFallbackInterval } from '@/utils/queryPolling';

export const useScenarioCategories = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarioCategories'],
    queryFn: () => scenarioApi.getCategories(),
    staleTime: 5 * 60 * 1000,
    enabled: authReady && isAuthenticated,
  });
};

export const useScenarios = (filters?: ScenarioFilterParams) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarios', filters],
    queryFn: () => scenarioApi.getScenarios(filters),
    staleTime: 60 * 1000,
    enabled: authReady && isAuthenticated,
  });
};

export const useScenarioDetails = (idOrSlug: string) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarioDetails', idOrSlug],
    queryFn: () => scenarioApi.getScenarioDetails(idOrSlug),
    staleTime: 60 * 1000,
    enabled: authReady && isAuthenticated && !!idOrSlug,
  });
};

export const useScenarioProgress = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarioProgress'],
    queryFn: () => scenarioApi.getProgress(),
    staleTime: 10 * 1000,
    enabled: authReady && isAuthenticated,
  });
};

export const useScenarioAttempt = (
  attemptId: string,
  refetchInterval?: RealtimeFallbackInterval
) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarioAttempt', attemptId],
    queryFn: () => scenarioApi.getAttempt(attemptId),
    staleTime: 0,
    enabled: authReady && isAuthenticated && !!attemptId,
    refetchInterval:
      refetchInterval !== undefined
        ? refetchInterval
        : (query) => {
            const status = readStatus(query.state.data);
            if (status === 'completed' || status === 'failed') {
              return false;
            }
            return REALTIME_FALLBACK_POLL_MS;
          },
  });
};

export const useScenarioAttemptHistory = (idOrSlug: string) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['scenarioHistory', idOrSlug],
    queryFn: () => scenarioApi.getAttemptHistory(idOrSlug),
    staleTime: 5 * 1000,
    enabled: authReady && isAuthenticated && !!idOrSlug,
  });
};

export const useCreateScenarioAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scenarioId,
      idempotencyKey,
    }: {
      scenarioId: string;
      idempotencyKey?: string;
    }) => scenarioApi.createAttempt(scenarioId, idempotencyKey),
    onSuccess: (attempt) => {
      void queryClient.invalidateQueries({ queryKey: ['scenarioAttempt', attempt.id] });
    },
  });
};

export const useSubmitScenarioAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      answer,
      idempotencyKey,
    }: {
      attemptId: string;
      answer: string;
      idempotencyKey?: string;
    }) => scenarioApi.submitAttempt(attemptId, answer, idempotencyKey),
    onSuccess: (attempt) => {
      void queryClient.invalidateQueries({ queryKey: ['scenarioAttempt', attempt.id] });
      void queryClient.invalidateQueries({ queryKey: ['scenarioHistory'] });
      void queryClient.invalidateQueries({ queryKey: ['scenarioProgress'] });
    },
  });
};

export const useRetryScenario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scenarioId,
      idempotencyKey,
    }: {
      scenarioId: string;
      idempotencyKey?: string;
    }) => scenarioApi.retryScenario(scenarioId, idempotencyKey),
    onSuccess: (attempt) => {
      void queryClient.invalidateQueries({ queryKey: ['scenarioAttempt', attempt.id] });
      void queryClient.invalidateQueries({ queryKey: ['scenarioHistory'] });
      void queryClient.invalidateQueries({ queryKey: ['scenarioProgress'] });
    },
  });
};
