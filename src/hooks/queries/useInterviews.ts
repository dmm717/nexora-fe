import { useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
  REPORT_POLL_MAX_ATTEMPTS,
  type ReportPollingDecision,
  type InterviewReportState,
  shouldFetchInterviewReport,
  shouldUseLegacyReportCompatibility,
} from '@/services/interviewContract';

export const useInterview = (id: string, refetchInterval?: RealtimeFallbackInterval) => {
  const { authReady, isAuthenticated } = useAuth();
  const statusPollingTracker = useMemo(() => createReportPollingAttemptTracker(), []);

  const query = useQuery({
    queryKey: ['interview', id],
    queryFn: async () => {
      statusPollingTracker.ensureCycle(id);
      if (statusPollingTracker.consumeScheduledPoll()) {
        statusPollingTracker.recordFallbackPoll();
      }
      return interviewApi.getById(id);
    },
    enabled: authReady && isAuthenticated && !!id,
    refetchInterval:
      refetchInterval !== undefined
        ? refetchInterval
        : (query) => {
            const interview = query.state.data;
            const status = readStatus(interview);
            const pending = status === 'starting' ||
              interview?.reportState === 'processing' ||
              interview?.resultState === 'processing' ||
              interview?.questionPreparationState === 'processing' ||
              (interview?.reportState === undefined && status === 'completing');
            if (pending && statusPollingTracker.getAttemptCount() < REPORT_POLL_MAX_ATTEMPTS) {
              statusPollingTracker.scheduleFallbackPoll();
              return REALTIME_FALLBACK_POLL_MS;
            }
            if (!pending) statusPollingTracker.reset();
            return false;
          },
  });

  const pending = query.data?.status === 'starting' ||
    query.data?.reportState === 'processing' ||
    query.data?.resultState === 'processing' ||
    query.data?.questionPreparationState === 'processing' ||
    (query.data?.reportState === undefined && query.data?.status === 'completing');
  return {
    ...query,
    statusPollingBoundExhausted:
      Boolean(pending) && statusPollingTracker.getAttemptCount() >= REPORT_POLL_MAX_ATTEMPTS,
    resetStatusPollingAttempts: statusPollingTracker.reset,
  };
};

export const useInterviewReport = (
  id: string,
  reportState?: InterviewReportState,
  interviewStatus?: string
) => {
  const { authReady, isAuthenticated } = useAuth();
  const legacyReportPollingTracker = useMemo(() => createReportPollingAttemptTracker(), []);
  const usesLegacyReportCompatibility = shouldUseLegacyReportCompatibility(
    reportState,
    interviewStatus
  );
  const shouldFetchReport = shouldFetchInterviewReport(reportState, interviewStatus);

  const query = useQuery({
    queryKey: ['interviewReport', id],
    queryFn: async () => {
      if (usesLegacyReportCompatibility) {
        legacyReportPollingTracker.ensureCycle(id);
        if (legacyReportPollingTracker.consumeScheduledPoll()) {
          legacyReportPollingTracker.recordFallbackPoll();
        }
      }

      const report = await interviewApi.getReport(id);
      legacyReportPollingTracker.reset();
      return report;
    },
    staleTime: 30000,
    enabled: authReady && isAuthenticated && !!id && shouldFetchReport,
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
    refetchInterval: (query) => {
      if (!usesLegacyReportCompatibility) return false;
      if (query.state.data) {
        legacyReportPollingTracker.reset();
        return false;
      }

      legacyReportPollingTracker.ensureCycle(id);
      const decision = getReportPollingDecision({
        interviewStatus,
        error: query.state.error,
        fallbackAttemptCount: legacyReportPollingTracker.getAttemptCount(),
      });
      if (!decision.shouldPoll) return false;

      legacyReportPollingTracker.scheduleFallbackPoll();
      return REALTIME_FALLBACK_POLL_MS;
    },
  });

  const reportPollingDecision: ReportPollingDecision = getReportPollingDecision({
    interviewStatus,
    error: query.error,
    fallbackAttemptCount: usesLegacyReportCompatibility
      ? legacyReportPollingTracker.getAttemptCount()
      : undefined,
  });

  return {
    ...query,
    reportPollingDecision,
    legacyReportPollingBoundExhausted:
      usesLegacyReportCompatibility &&
      !query.data &&
      legacyReportPollingTracker.getAttemptCount() >= REPORT_POLL_MAX_ATTEMPTS,
  };
};

export const useInterviewsHistory = (pageSize: number = 20) => {
  const { authReady, isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: ['interviewsHistory', pageSize],
    queryFn: ({ pageParam = 1 }) => interviewApi.getInterviews(pageParam as number, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: authReady && isAuthenticated,
    staleTime: 30000,
  });
};
