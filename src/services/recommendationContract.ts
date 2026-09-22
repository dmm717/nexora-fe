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
  action?: {
    type: string;
    reason: string;
    sourceInterviewId?: string;
    sourceQuestionId?: string;
    focusTopic?: string;
    suggestedInterviewType?: string;
  } | null;
}

/**
 * Presents a recommendation with product copy derived from structured fields.
 * The backend reason is retained for contract compatibility, but it is not
 * customer-facing because it may be generated in English.
 */
export function getLocalizedRecommendationReason(
  recommendation: Pick<
    NextPracticeRecommendationResponse,
    'activityType' | 'priority' | 'estimatedMinutes'
  > | null | undefined
): string {
  if (!recommendation) {
    return 'Chọn bài luyện phù hợp với điều bạn muốn cải thiện tiếp theo.';
  }

  const activityLabel = {
    [RecommendationActivityValues.Scenario]: 'Luyện tình huống thực tế',
    [RecommendationActivityValues.StarDrill]: 'Luyện trả lời STAR',
    [RecommendationActivityValues.Interview]: 'Luyện phỏng vấn AI',
    [RecommendationActivityValues.ResumeImprovement]: 'Cải thiện CV',
    [RecommendationActivityValues.ExternalLearning]: 'Xem tài liệu học phù hợp',
  }[recommendation.activityType] || 'Bài luyện tiếp theo';

  const priorityLabel =
    recommendation.priority <= 1
      ? 'đang được ưu tiên'
      : recommendation.priority === 2
        ? 'nên thực hiện tiếp theo'
        : 'có thể thực hiện sau';
  const durationLabel =
    recommendation.estimatedMinutes > 0
      ? ` Dành khoảng ${recommendation.estimatedMinutes} phút cho lượt luyện này.`
      : '';

  return `${activityLabel} ${priorityLabel} theo lộ trình hiện tại của bạn.${durationLabel}`;
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
    action: isRecord(raw.action)
      ? {
          type: asString(raw.action.type),
          reason: asString(raw.action.reason),
          sourceInterviewId: asNullableString(raw.action.sourceInterviewId) || undefined,
          sourceQuestionId: asNullableString(raw.action.sourceQuestionId) || undefined,
          focusTopic: asNullableString(raw.action.focusTopic) || undefined,
          suggestedInterviewType: asNullableString(raw.action.suggestedInterviewType) || undefined,
        }
      : null,
  };
}

/**
 * Resolves safe product deep links for a recommended activity.
 *
 * Rules:
 * - Scenario: `/practice/scenarios/${resourceId}` if resourceId is present, else `/practice/scenarios`
 * - StarDrill: `/practice/star`
 * - Interview: `/interviews/new`
 * - ResumeImprovement: `/resumes`
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
        ? `/practice/scenarios/${recommendation.resourceId}`
        : '/practice/scenarios';
    case RecommendationActivityValues.StarDrill:
      return '/practice/star';
    case RecommendationActivityValues.Interview:
      return '/interviews/new';
    case RecommendationActivityValues.ResumeImprovement:
      return '/resume-analyses';
    case RecommendationActivityValues.ExternalLearning:
    default:
      return null;
  }
}
