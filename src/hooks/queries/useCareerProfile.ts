import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, type CareerProfileResponse } from '@/services/profileApi';
import type { ResumeView } from '@/services/cvAnalysisApi';
import { toast } from 'sonner';

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
    onSuccess: (_, variables) => {
      if (variables === null) {
        toast.success('Đã gỡ CV mặc định thành công!');
      } else {
        toast.success('Đã đặt CV làm mặc định thành công!');
      }
      // Refresh the career profile and resume list
      queryClient.invalidateQueries({ queryKey: careerProfileKeys.all });
      queryClient.invalidateQueries({ queryKey: resumeKeys.all });
    },
    onError: () => {
      toast.error('Lỗi khi thiết lập CV chính. CV có thể chưa sẵn sàng hoặc không thuộc quyền sở hữu của bạn.');
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
