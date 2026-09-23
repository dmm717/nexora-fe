import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const PROGRESS_DASHBOARD_QUERY_KEY = ['progressDashboard'] as const;
export const NEXT_PRACTICE_RECOMMENDATION_QUERY_KEY = ['nextPracticeRecommendation'] as const;
export const CURRENT_USER_QUERY_KEY = ['currentUser'] as const;
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
  if (attemptId) {
    void queryClient.invalidateQueries({ queryKey: ['scenarioAttempt', attemptId] });
  }
  void queryClient.invalidateQueries({ queryKey: ['scenarioAttempts'] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioHistory'] });
  void queryClient.invalidateQueries({ queryKey: ['scenarioProgress'] });
  invalidatePracticeAggregates(queryClient);
}

/**
 * Authoritative invalidation on terminal STAR attempt completion.
 */
export function invalidateStarTerminalCompletion(queryClient: QueryClient, attemptId?: string): void {
  if (attemptId) {
    void queryClient.invalidateQueries({ queryKey: ['starAttempt', attemptId] });
  }
  void queryClient.invalidateQueries({ queryKey: ['starAttempts'] });
  invalidatePracticeAggregates(queryClient);
}
