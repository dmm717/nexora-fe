import { useQuery } from '@tanstack/react-query';
import { interviewApi } from '@/services/interviewApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus, type RealtimeFallbackInterval } from '@/utils/queryPolling';
import {
  isDeterministicError,
  isReportProcessingError,
  isReportFailedError,
  isReportUnavailableError,
  getReportPollingDecision,
} from '@/services/interviewContract';

export const useInterview = (id: string, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewApi.getById(id),
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval:
      refetchInterval !== undefined
        ? refetchInterval
        : (query) => {
            const status = readStatus(query.state.data);
            // starting and completing are pending transitions; poll until settled
            if (status === 'starting' || status === 'completing') {
              return REALTIME_FALLBACK_POLL_MS;
            }
            return false;
          },
  });
};

export const useInterviewReport = (
  id: string,
  interviewStatusOrInterval?: string | RealtimeFallbackInterval,
  customRefetchInterval?: RealtimeFallbackInterval
) => {
  const { authReady, isAuthenticated } = useAuth();

  const interviewStatus =
    typeof interviewStatusOrInterval === 'string' ? interviewStatusOrInterval : undefined;
  const refetchInterval =
    typeof interviewStatusOrInterval === 'function' ||
    typeof interviewStatusOrInterval === 'number' ||
    typeof interviewStatusOrInterval === 'boolean'
      ? interviewStatusOrInterval
      : customRefetchInterval;

  return useQuery({
    queryKey: ['interviewReport', id],
    queryFn: () => interviewApi.getReport(id),
    staleTime: 30000,
    enabled: authReady && isAuthenticated && !!id,
    retry: (failureCount, error) => {
      // Never transport-retry deterministic business errors or explicit report statuses
      if (
        isDeterministicError(error) ||
        isReportProcessingError(error) ||
        isReportFailedError(error) ||
        isReportUnavailableError(error)
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval:
      refetchInterval !== undefined
        ? refetchInterval
        : (query) => {
            if (query.state.data) return false;
            const decision = getReportPollingDecision({
              interviewStatus,
              error: query.state.error,
              fallbackAttemptCount: query.state.dataUpdateCount ?? 0,
            });
            if (decision.shouldPoll) {
              return decision.intervalMs ?? REALTIME_FALLBACK_POLL_MS;
            }
            return false;
          },
  });
};
