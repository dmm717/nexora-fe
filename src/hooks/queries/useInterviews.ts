import { useQuery } from '@tanstack/react-query';
import { interviewApi } from '@/services/interviewApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useInterview = (id: string, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewApi.getById(id),
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query: any) => {
      const data = query.state.data as any;
      if (data && (data.status === 'completed' || data.status === 'failed' || data.status === 'abandoned')) {
        return false;
      }
      return 15000;
    },
  });
};

export const useInterviewReport = (id: string, refetchInterval?: number | false | ((query: any) => number | false | undefined)) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interviewReport', id],
    queryFn: () => interviewApi.getReport(id),
    staleTime: 30000,
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval: refetchInterval !== undefined ? refetchInterval : (query: any) => {
      if (query.state.data) return false;
      return 15000;
    },
  });
};
