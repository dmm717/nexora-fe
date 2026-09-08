import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/userApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useCurrentUser = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 30000, // 30 seconds for dynamic user data
    enabled: authReady && isAuthenticated,
  });
};
