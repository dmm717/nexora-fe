import { useQuery } from '@tanstack/react-query';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';

export const useResumeAnalysis = (id: string, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  return useQuery({
    queryKey: ['resumeAnalysis', id],
    queryFn: () => cvAnalysisApi.getAnalysis(id),
    staleTime: 30000,
    enabled: !!id,
    refetchInterval,
  });
};
