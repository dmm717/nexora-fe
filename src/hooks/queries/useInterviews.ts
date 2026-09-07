import { useQuery } from '@tanstack/react-query';
import { interviewApi } from '@/services/interviewApi';

export const useInterview = (id: string, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewApi.getById(id),
    refetchInterval,
  });
};

export const useInterviewReport = (id: string, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  return useQuery({
    queryKey: ['interviewReport', id],
    queryFn: () => interviewApi.getReport(id),
    staleTime: 30000,
    enabled: !!id,
    refetchInterval,
  });
};
