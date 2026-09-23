import { useQuery } from '@tanstack/react-query';
import { progressDashboardApi } from '@/services/progressDashboardApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const PROGRESS_DASHBOARD_QUERY_KEY = ['progressDashboard'] as const;

export type { ProgressDashboardResponse } from '@/services/progressDashboardApi';

export const useProgressDashboard = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: PROGRESS_DASHBOARD_QUERY_KEY,
    queryFn: () => progressDashboardApi.get(),
    staleTime: 60 * 1000,
    enabled: authReady && isAuthenticated,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Entitlement or deterministic 403 error should not be endlessly retried
      const apiError = error as { code?: string; status?: number };
      if (
        apiError?.code === 'FEATURE_NOT_AVAILABLE' ||
        apiError?.status === 403
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

