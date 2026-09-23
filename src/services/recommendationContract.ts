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
  rationale?: {
    competencyName: string;
    evidenceCount: number;
    hasMoreRecentlyPracticedPeer: boolean;
  } | null;
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
 * Presents a recommendation from server-owned structured rationale.
 * The legacy backend reason remains non-customer-facing because it may be English.
 */
export function getLocalizedRecommendationReason(
  recommendation: Pick<
    NextPracticeRecommendationResponse,
    'activityType' | 'priority' | 'estimatedMinutes' | 'rationale'
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

  const rationale = recommendation.rationale;
  if (rationale?.competencyName.trim()) {
    const priorityReason =
      recommendation.priority <= 1
        ? 'điểm cần ưu tiên cao'
        : recommendation.priority === 2
          ? 'điểm nên củng cố tiếp theo'
          : 'một phần trong lộ trình hiện tại';
    const recencyReason = rationale.hasMoreRecentlyPracticedPeer
      ? ' Nội dung này cũng đã lâu chưa được luyện hơn một điểm cần cải thiện khác cùng mức ưu tiên.'
      : '';

    return `Nên luyện ${rationale.competencyName.trim()} tiếp theo vì đây là ${priorityReason}, dựa trên ${Math.max(0, rationale.evidenceCount)} bằng chứng đã ghi nhận.${recencyReason}${durationLabel}`;
  }

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
    rationale: isRecord(raw.rationale)
      ? {
          competencyName: asString(raw.rationale.competencyName).trim(),
          evidenceCount: Math.max(0, asNumber(raw.rationale.evidenceCount, 0)),
          hasMoreRecentlyPracticedPeer: raw.rationale.hasMoreRecentlyPracticedPeer === true,
        }
      : null,
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
