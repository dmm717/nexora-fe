import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/services/profileApi';
import { toast } from 'sonner';

const careerProfileKeys = {
  all: ['careerProfile'] as const,
};

const resumeKeys = {
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
