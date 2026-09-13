import { useInfiniteQuery } from '@tanstack/react-query';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useJobDescriptionsHistory = (pageSize: number = 20) => {
  const { authReady, isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: ['jobDescriptions', pageSize],
    queryFn: ({ pageParam = 1 }) => cvAnalysisApi.getJobDescriptions(pageParam as number, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: authReady && isAuthenticated,
    staleTime: 30000,
  });
};
