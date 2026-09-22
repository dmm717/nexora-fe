import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '@/services/feedbackApi';
import type {
  AdminFeedbackFilters,
  FeedbackRequest,
  FeedbackResponse,
} from '@/services/feedbackContract';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const feedbackKeys = {
  all: ['feedback'] as const,
  me: () => [...feedbackKeys.all, 'me'] as const,
  public: (limit?: number) => [...feedbackKeys.all, 'public', limit ?? 20] as const,
  admin: {
    all: ['admin', 'feedback'] as const,
    list: (filters: AdminFeedbackFilters) => ['admin', 'feedback', 'list', filters] as const,
    summary: () => ['admin', 'feedback', 'summary'] as const,
  },
};

/**
 * Current user's feedback query.
 */
export function useMyFeedback() {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: feedbackKeys.me(),
    queryFn: () => feedbackApi.getMyFeedback(),
    enabled: authReady && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Public testimonials query (no polling).
 */
export function usePublicFeedback(limit: number = 20) {
  return useQuery({
    queryKey: feedbackKeys.public(limit),
    queryFn: () => feedbackApi.getPublicFeedback(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Admin feedback list query with filters.
 */
export function useAdminFeedback(filters: AdminFeedbackFilters = {}) {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: feedbackKeys.admin.list(filters),
    queryFn: () => feedbackApi.getAdminFeedback(filters),
    enabled: authReady && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Admin feedback summary & rating distribution query.
 */
export function useAdminFeedbackSummary() {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: feedbackKeys.admin.summary(),
    queryFn: () => feedbackApi.getAdminFeedbackSummary(),
    enabled: authReady && isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation for candidate creating or updating their feedback.
 */
export function useUpsertFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: FeedbackRequest) => feedbackApi.upsertMyFeedback(request),
    onSuccess: (saved: FeedbackResponse) => {
      queryClient.setQueryData(feedbackKeys.me(), saved);
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.me() });
    },
  });
}

/**
 * Mutation for candidate deleting / withdrawing their feedback.
 */
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => feedbackApi.deleteMyFeedback(),
    onSuccess: () => {
      queryClient.setQueryData(feedbackKeys.me(), null);
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.me() });
    },
  });
}

/**
 * Admin moderation mutations.
 */
export function useApproveFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (param: string | { id: string; reason?: string }) => {
      const id = typeof param === 'string' ? param : param.id;
      const reason = typeof param === 'object' ? param.reason : undefined;
      return feedbackApi.approveFeedback(id, reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.admin.all });
    },
  });
}

export function useRejectFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (param: string | { id: string; reason?: string }) => {
      const id = typeof param === 'string' ? param : param.id;
      const reason = typeof param === 'object' ? param.reason : undefined;
      return feedbackApi.rejectFeedback(id, reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.admin.all });
    },
  });
}

export function useFeatureFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (param: string | { id: string; reason?: string }) => {
      const id = typeof param === 'string' ? param : param.id;
      const reason = typeof param === 'object' ? param.reason : undefined;
      return feedbackApi.featureFeedback(id, reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.admin.all });
    },
  });
}

export function useUnfeatureFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (param: string | { id: string; reason?: string }) => {
      const id = typeof param === 'string' ? param : param.id;
      const reason = typeof param === 'object' ? param.reason : undefined;
      return feedbackApi.unfeatureFeedback(id, reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.admin.all });
    },
  });
}
