import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/dashboardApi';
import { progressApi } from '@/services/progressApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useDashboardSummary = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => dashboardApi.getDashboardSummary(),
    staleTime: 60 * 1000,
    enabled: authReady && isAuthenticated,
    refetchOnWindowFocus: false,
  });
};

export const useAnalytics = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => progressApi.getProgressAnalytics(),
    staleTime: 60 * 1000,
    enabled: authReady && isAuthenticated,
    refetchOnWindowFocus: false,
  });
};
