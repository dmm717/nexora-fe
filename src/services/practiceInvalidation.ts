import type { QueryClient, QueryKey } from '@tanstack/react-query';
import {
  CURRENT_USER_QUERY_KEY,
  NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY,
  PROGRESS_DASHBOARD_QUERY_KEY,
} from './sharedQueryKeys.ts';

export { CURRENT_USER_QUERY_KEY, NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY, PROGRESS_DASHBOARD_QUERY_KEY };
export const DASHBOARD_SUMMARY_QUERY_KEY = ['dashboardSummary'] as const;
export const ANALYTICS_QUERY_KEY = ['analytics'] as const;
export const INTERVIEWS_QUERY_KEY = ['interviews'] as const;
export const INTERVIEWS_HISTORY_QUERY_KEY = ['interviewsHistory'] as const;

/**
 * Authoritative practice-derived aggregate query keys.
 * These server-owned resources depend on completed practice activities (Interviews, Scenarios, STAR)
 * and must be invalidated upon terminal completion so that returning to dashboard/overview
 * does not display stale metrics despite a non-zero staleTime.
 */
export const PRACTICE_AGGREGATE_QUERY_KEYS: readonly QueryKey[] = [
  PROGRESS_DASHBOARD_QUERY_KEY,
  NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY,
  DASHBOARD_SUMMARY_QUERY_KEY,
  ANALYTICS_QUERY_KEY,
  CURRENT_USER_QUERY_KEY,
];

export interface RealtimeEvent {
  eventId: string;
  resourceType: string;
  resourceId: string;
  status: string;
  occurredAt: string;
}

/**
 * Maps resource types emitted by the backend to authoritative queries.
 * Events are notifications, so the query functions still fetch the final API state.
 * Terminal practice completions invalidate both resource-specific and aggregate dashboard queries.
 */
export function getQueryKeysForEvent(event: RealtimeEvent): QueryKey[] {
  const resourceType = event.resourceType.toLowerCase();
  const status = event.status.toLowerCase();

  switch (resourceType) {
    case 'interview': {
      if (status === 'completed') {
        return [
          ['interview', event.resourceId],
          ['interviewReport', event.resourceId],
          INTERVIEWS_QUERY_KEY,
          INTERVIEWS_HISTORY_QUERY_KEY,
          ...PRACTICE_AGGREGATE_QUERY_KEYS,
        ];
      }
      return [['interview', event.resourceId]];
    }
    case 'scenarioattempt': {
      const baseKeys: QueryKey[] = [
        ['scenarioAttempt', event.resourceId],
        ['scenarioAttempts'],
        ['scenarioHistory'],
        ['scenarioProgress'],
      ];
      if (status === 'completed') {
        return [...baseKeys, ...PRACTICE_AGGREGATE_QUERY_KEYS];
      }
      return [['scenarioAttempt', event.resourceId]];
    }
    case 'starattempt': {
      const baseKeys: QueryKey[] = [
        ['starAttempt', event.resourceId],
        ['starAttempts'],
      ];
      if (status === 'completed') {
        return [...baseKeys, ...PRACTICE_AGGREGATE_QUERY_KEYS];
      }
      return [['starAttempt', event.resourceId]];
    }
    case 'resume':
      return [['resume', event.resourceId], ['resumes'], ['careerProfile']];
    case 'resumeanalysis':
      return [['resumeAnalysis', event.resourceId], ['resumes'], ['careerProfile']];
    case 'user':
    case 'billing':
    case 'entitlement':
      return [['currentUser'], ['billingPlans'], ...PRACTICE_AGGREGATE_QUERY_KEYS];
    default:
      return [];
  }
}

/**
 * Helper to invalidate all practice-derived aggregate queries in React Query.
 */
export function invalidatePracticeAggregates(queryClient: QueryClient): void {
  for (const queryKey of PRACTICE_AGGREGATE_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * Runs a query fetch and invalidates terminal aggregates only on a cached
 * non-completed -> completed transition. Historical completed reads stay inert.
 */
export async function fetchPracticeSnapshot<T extends { status?: unknown }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  fetchSnapshot: () => Promise<T>,
  onTerminalTransition: () => void
): Promise<T> {
  const previous = queryClient.getQueryData<T>(queryKey);
  const incoming = await fetchSnapshot();
  const previousStatus = typeof previous?.status === 'string' ? previous.status.toLowerCase() : '';
  const incomingStatus = typeof incoming?.status === 'string' ? incoming.status.toLowerCase() : '';

  if (previous && previousStatus !== 'completed' && incomingStatus === 'completed') {
    onTerminalTransition();
  }

  return incoming;
}

/** Refreshes interview aggregates and list views without refetching the query that observed completion. */
export function invalidateObservedInterviewCompletion(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: INTERVIEWS_HISTORY_QUERY_KEY });
  invalidatePracticeAggregates(queryClient);
}

/** Refreshes non-detail scenario views after the attempt query observes completion. */
export function invalidateObservedScenarioCompletion(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['scenarioAttempts'] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioHistory'] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioProgress'] });
  invalidatePracticeAggregates(queryClient);
}

/** Refreshes STAR history after the attempt query observes completion. */
export function invalidateObservedStarCompletion(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['starAttempts'] });
  invalidatePracticeAggregates(queryClient);
}

/** Queue acceptance changes interview list state, but does not settle quota or aggregates. */
export function invalidateInterviewResourceChanged(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: INTERVIEWS_HISTORY_QUERY_KEY });
}

export function invalidateInterviewCompletionResult(
  queryClient: QueryClient,
  interviewId: string,
  status: unknown,
  snapshot?: unknown
): void {
  if (snapshot !== undefined) queryClient.setQueryData(['interview', interviewId], snapshot);
  if (typeof status === 'string' && status.toLowerCase() === 'completed') {
    invalidateInterviewTerminalCompletion(queryClient, interviewId);
  } else {
    invalidateInterviewResourceChanged(queryClient);
  }
}

export function invalidateScenarioAttemptResult(
  queryClient: QueryClient,
  attemptId: string,
  status: unknown,
  snapshot?: unknown
): void {
  if (snapshot !== undefined) queryClient.setQueryData(['scenarioAttempt', attemptId], snapshot);
  if (typeof status === 'string' && status.toLowerCase() === 'completed') {
    invalidateScenarioTerminalCompletion(queryClient, attemptId);
  } else {
    invalidateScenarioResourceChanged(queryClient, attemptId);
  }
}

export function invalidateStarAttemptResult(
  queryClient: QueryClient,
  attemptId: string,
  status: unknown,
  snapshot?: unknown
): void {
  if (snapshot !== undefined) queryClient.setQueryData(['starAttempt', attemptId], snapshot);
  if (typeof status === 'string' && status.toLowerCase() === 'completed') {
    invalidateStarTerminalCompletion(queryClient, attemptId);
  } else {
    invalidateStarResourceChanged(queryClient, attemptId);
  }
}

/** Refreshes attempt lists after queue acceptance, without claiming terminal completion. */
export function invalidateScenarioResourceChanged(queryClient: QueryClient, attemptId?: string): void {
  if (attemptId) void queryClient.invalidateQueries({ queryKey: ['scenarioAttempt', attemptId] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioAttempts'] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioHistory'] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioProgress'] });
}

/** Refreshes STAR attempt resources after queue acceptance. */
export function invalidateStarResourceChanged(queryClient: QueryClient, attemptId?: string): void {
  if (attemptId) void queryClient.invalidateQueries({ queryKey: ['starAttempt', attemptId] });
  void queryClient.invalidateQueries({ queryKey: ['starAttempts'] });
}

/**
 * Authoritative invalidation on terminal Interview completion.
 */
export function invalidateInterviewTerminalCompletion(queryClient: QueryClient, interviewId?: string): void {
  if (interviewId) {
    void queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
    void queryClient.invalidateQueries({ queryKey: ['interviewReport', interviewId] });
  }
  void queryClient.invalidateQueries({ queryKey: INTERVIEWS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: INTERVIEWS_HISTORY_QUERY_KEY });
  invalidatePracticeAggregates(queryClient);
}

/**
 * Authoritative invalidation on terminal Scenario attempt completion.
 */
export function invalidateScenarioTerminalCompletion(queryClient: QueryClient, attemptId?: string): void {
  invalidateScenarioResourceChanged(queryClient, attemptId);
  invalidatePracticeAggregates(queryClient);
}

/**
 * Authoritative invalidation on terminal STAR attempt completion.
 */
export function invalidateStarTerminalCompletion(queryClient: QueryClient, attemptId?: string): void {
  invalidateStarResourceChanged(queryClient, attemptId);
  invalidatePracticeAggregates(queryClient);
}
