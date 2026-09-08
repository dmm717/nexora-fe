import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useAdminDashboard = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminApi.getDashboard(),
    enabled: authReady && isAuthenticated,
  });
};
