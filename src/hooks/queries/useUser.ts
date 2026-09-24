import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/userApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { CURRENT_USER_QUERY_KEY } from '@/services/sharedQueryKeys';

export { CURRENT_USER_QUERY_KEY } from '@/services/sharedQueryKeys';

export const useCurrentUser = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 60 * 1000,
    enabled: authReady && isAuthenticated,
    refetchOnWindowFocus: false,
  });
};
