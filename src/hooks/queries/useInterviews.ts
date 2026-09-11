import { useMemo } from 'react';
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
  createReportPollingAttemptTracker,
  getReportPollingDecision,
  type ReportPollingDecision,
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
  const reportPollingTracker = useMemo(
    () => createReportPollingAttemptTracker(),
    []
  );

  const interviewStatus =
    typeof interviewStatusOrInterval === 'string' ? interviewStatusOrInterval : undefined;
  const refetchInterval =
    typeof interviewStatusOrInterval === 'function' ||
    typeof interviewStatusOrInterval === 'number' ||
    typeof interviewStatusOrInterval === 'boolean'
      ? interviewStatusOrInterval
      : customRefetchInterval;
  const usesDefaultPolling = refetchInterval === undefined;

  const query = useQuery({
    queryKey: ['interviewReport', id],
    queryFn: async () => {
      reportPollingTracker.ensureCycle(id);
      if (usesDefaultPolling && reportPollingTracker.consumeScheduledPoll()) {
        reportPollingTracker.recordFallbackPoll();
      }

      const report = await interviewApi.getReport(id);
      reportPollingTracker.reset();
      return report;
    },
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
            if (query.state.data) {
              reportPollingTracker.reset();
              return false;
            }

            reportPollingTracker.ensureCycle(id);
            const decision = getReportPollingDecision({
              interviewStatus,
              error: query.state.error,
              fallbackAttemptCount: reportPollingTracker.getAttemptCount(),
            });

            if (!decision.shouldPoll) {
              // Keep the exhausted count visible so the UI can explain the timeout.
              if (decision.reason !== 'bound_exhausted') {
                reportPollingTracker.reset();
              }
              return false;
            }

            reportPollingTracker.scheduleFallbackPoll();
            return decision.intervalMs ?? REALTIME_FALLBACK_POLL_MS;
          },
  });

  const reportPollingDecision: ReportPollingDecision = getReportPollingDecision({
    interviewStatus,
    error: query.error,
    fallbackAttemptCount: reportPollingTracker.getAttemptCount(),
  });

  return {
    ...query,
    reportPollingDecision,
    reportPollingBoundExhausted:
      usesDefaultPolling &&
      !query.data &&
      Boolean(query.error) &&
      reportPollingDecision.reason === 'bound_exhausted',
    resetReportPollingAttempts: reportPollingTracker.reset,
  };
};
