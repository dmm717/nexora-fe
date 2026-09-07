import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminApi.getDashboard(),
  });
};
