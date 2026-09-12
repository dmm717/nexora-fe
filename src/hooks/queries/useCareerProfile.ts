import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/services/profileApi';
import { toast } from 'sonner';

export const careerProfileKeys = {
  all: ['careerProfile'] as const,
};

export function useCareerProfile() {
  return useQuery({
    queryKey: careerProfileKeys.all,
    queryFn: profileApi.getCareerProfile,
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useSetPrimaryResume() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (resumeId: string) => profileApi.setPrimaryResume(resumeId),
    onSuccess: () => {
      toast.success('Đã đặt CV làm mặc định thành công!');
      // Refresh the career profile and resume list
      queryClient.invalidateQueries({ queryKey: careerProfileKeys.all });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: () => {
      toast.error('Lỗi khi thiết lập CV chính. CV có thể chưa sẵn sàng hoặc không thuộc quyền sở hữu của bạn.');
    },
  });
}
