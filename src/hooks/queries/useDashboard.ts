import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/dashboardApi';
import { progressApi } from '@/services/progressApi';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => dashboardApi.getDashboardSummary(),
    staleTime: 30000,
  });
};

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => progressApi.getProgressAnalytics(),
  });
};
