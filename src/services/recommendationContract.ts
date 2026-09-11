/**
 * B12 Next Practice Recommendation Contract (pure, dependency-free).
 * Mirrors backend `Nexora.Api.Contracts.NextPracticeRecommendationResponse` and
 * `Nexora.Business.Recommendations.NextPracticeRecommendationView` exactly.
 */

export const RecommendationActivityValues = {
  Scenario: 'scenario',
  StarDrill: 'star_drill',
  Interview: 'interview',
  ResumeImprovement: 'resume_improvement',
  ExternalLearning: 'external_learning',
} as const;

export interface NextPracticeRecommendationResponse {
  reason: string;
  activityType: string;
  resourceId: string | null;
  estimatedMinutes: number;
  priority: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * Normalizes backend recommendation wire data.
 * Returns null if data is null, undefined, or empty.
 */
export function normalizeNextPracticeRecommendationResponse(
  raw: unknown
): NextPracticeRecommendationResponse | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (!isRecord(raw)) {
    return null;
  }

  // If object has no meaningful fields, treat as null
  if (!raw.reason && !raw.activityType) {
    return null;
  }

  return {
    reason: asString(raw.reason),
    activityType: asString(raw.activityType),
    resourceId: asNullableString(raw.resourceId),
    estimatedMinutes: asNumber(raw.estimatedMinutes, 0),
    priority: asNumber(raw.priority, 1),
  };
}

/**
 * Resolves safe product deep links for a recommended activity.
 *
 * Rules:
 * - Scenario: `/dashboard/scenarios/${resourceId}` if resourceId is present, else `/dashboard/scenarios`
 * - StarDrill: `/dashboard/star-builder`
 * - Interview: `/dashboard/interviews/new`
 * - ResumeImprovement: `/dashboard/resumes`
 * - ExternalLearning: null (B12 provides no externalUrl, never invent a fake link)
 * - Unknown: null
 */
export function getRecommendationDeepLink(
  recommendation: NextPracticeRecommendationResponse | null
): string | null {
  if (!recommendation || !recommendation.activityType) {
    return null;
  }

  switch (recommendation.activityType) {
    case RecommendationActivityValues.Scenario:
      return recommendation.resourceId
        ? `/dashboard/scenarios/${recommendation.resourceId}`
        : '/dashboard/scenarios';
    case RecommendationActivityValues.StarDrill:
      return '/dashboard/star-builder';
    case RecommendationActivityValues.Interview:
      return '/dashboard/interviews/new';
    case RecommendationActivityValues.ResumeImprovement:
      return '/dashboard/resumes';
    case RecommendationActivityValues.ExternalLearning:
    default:
      return null;
  }
}

