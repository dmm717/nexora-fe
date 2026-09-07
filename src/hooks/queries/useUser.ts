import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/userApi';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 30000, // 30 seconds for dynamic user data
  });
};
