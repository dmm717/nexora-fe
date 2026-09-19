import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, type CareerProfileResponse } from '@/services/profileApi';
import type { ResumeView } from '@/services/cvAnalysisApi';
import { toast } from 'sonner';
import { CURRENT_USER_QUERY_KEY } from './useUser';
import {
  applyPrimaryResumeToCareerProfile,
  getPrimaryResumeErrorMessage,
  shouldRetryCareerProfileRequest,
} from './careerProfilePolicy';

export const careerProfileKeys = {
  all: ['careerProfile'] as const,
};

export const resumeKeys = {
  all: ['resumes'] as const,
};

export function useCareerProfile() {
  return useQuery({
    queryKey: careerProfileKeys.all,
    queryFn: profileApi.getCareerProfile,
    staleTime: 60000, // Cache for 1 minute
    retry: shouldRetryCareerProfileRequest,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.all,
    queryFn: profileApi.getResumes,
    staleTime: 60000,
  });
}

export function useSetPrimaryResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resumeId: string | null) => profileApi.setPrimaryResume(resumeId),
    onSuccess: async (primaryResume, variables) => {
      queryClient.setQueryData<CareerProfileResponse>(careerProfileKeys.all, (current) =>
        applyPrimaryResumeToCareerProfile(current, primaryResume),
      );

      if (variables === null) {
        toast.success('Đã gỡ CV mặc định thành công!');
      } else {
        toast.success('Đã đặt CV làm mặc định thành công!');
      }
      // Reconcile related server-owned views without discarding the authoritative mutation result.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: careerProfileKeys.all }),
        queryClient.invalidateQueries({ queryKey: resumeKeys.all }),
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
      ]);
    },
    onError: (error) => {
      toast.error(getPrimaryResumeErrorMessage(error));
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resumeId: string) => profileApi.deleteResume(resumeId),
    onSuccess: (_, resumeId) => {
      // 1. Remove the deleted resume from cached resume list immediately where safe
      queryClient.setQueryData<ResumeView[]>(resumeKeys.all, (old) =>
        old ? old.filter((r) => r.id !== resumeId) : old
      );

      // 2. Clear primaryResume in career profile cache if it matches the deleted resume
      queryClient.setQueryData<CareerProfileResponse>(careerProfileKeys.all, (old) => {
        if (!old) return old;
        if (old.primaryResume?.id === resumeId) {
          return {
            ...old,
            primaryResume: null,
            onboarding: old.onboarding
              ? {
                  ...old.onboarding,
                  hasPrimaryResume: false,
                  isComplete: false,
                }
              : old.onboarding,
          };
        }
        return old;
      });

      // 3. Invalidate authoritative queries
      void queryClient.invalidateQueries({ queryKey: resumeKeys.all });
      void queryClient.invalidateQueries({ queryKey: careerProfileKeys.all });
    },
  });
}
