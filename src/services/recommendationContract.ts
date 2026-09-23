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

export interface NextPracticeRecommendationRationale {
  competencyCode?: string;
  competencyName?: string;
  evidenceCount: number;
  hasMoreRecentlyPracticedPeer: boolean;
}

export interface NextPracticeRecommendationResponse {
  reason: string;
  activityType: string;
  resourceId: string | null;
  estimatedMinutes: number;
  priority: number;
  rationale?: NextPracticeRecommendationRationale | null;
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
 * Known competency codes derived from actual backend taxonomy:
 * - behavioral.* (Situation, Task, Action, Result)
 * - interview.* (Interview rubrics & question focus areas)
 * - resume.* (CV criteria & qualitative signals)
 * - scenario.* (Scenario competencies)
 */
export const KNOWN_COMPETENCY_LABELS: Record<string, string> = {
  // behavioral.*
  'behavioral.situation': 'bối cảnh',
  'behavioral.task': 'nhiệm vụ',
  'behavioral.action': 'hành động',
  'behavioral.result': 'kết quả',

  // interview.*
  'interview.structure': 'cấu trúc câu trả lời',
  'interview.clarity': 'độ rõ ràng trong câu trả lời',
  'interview.correctness': 'độ chính xác',
  'interview.completeness': 'tính đầy đủ của câu trả lời',
  'interview.communication': 'kỹ năng giao tiếp',
  'interview.risk_management': 'quản lý rủi ro',
  'interview.problem_solving': 'khả năng giải quyết vấn đề',
  'interview.leadership': 'năng lực lãnh đạo',

  // resume.*
  'resume.impact_evidence': 'minh chứng về tác động trong CV',
  'resume.impact_achievements': 'thành tích tạo ra tác động',
  'resume.clarity': 'độ rõ ràng của CV',
  'resume.structure': 'cấu trúc CV',
  'resume.technical_skill_match': 'độ phù hợp kỹ năng chuyên môn',
  'resume.project_evidence': 'minh chứng dự án',
  'resume.quantifiable_results': 'kết quả định lượng',

  // scenario.*
  'scenario.problem_solving': 'khả năng giải quyết vấn đề',
  'scenario.customer_service': 'dịch vụ khách hàng',
  'scenario.prioritization': 'khả năng sắp xếp thứ tự ưu tiên',
  'scenario.incident_response': 'ứng phó sự cố',
  'scenario.conflict_resolution': 'giải quyết xung đột',
  'scenario.communication': 'kỹ năng giao tiếp',
  'scenario.teamwork': 'làm việc nhóm',
  'scenario.time_management': 'quản lý thời gian',
  'scenario.leadership': 'năng lực lãnh đạo',
};

/**
 * Resolves a natural Vietnamese label for a competency code.
 * If code is missing or unknown, falls back to a safe activity-based Vietnamese label.
 * NEVER renders raw English competency names verbatim.
 */
export function getLocalizedCompetencyLabel(
  competencyCode?: string | null,
  activityType?: string | null
): string {
  if (competencyCode && typeof competencyCode === 'string') {
    const normalized = competencyCode.trim().toLowerCase();
    if (KNOWN_COMPETENCY_LABELS[normalized]) {
      return KNOWN_COMPETENCY_LABELS[normalized];
    }
    // Handle bare identity lookup if passed without category prefix
    const separator = normalized.indexOf('.');
    if (separator === -1 && activityType) {
      const category = {
        [RecommendationActivityValues.Interview]: 'interview',
        [RecommendationActivityValues.StarDrill]: 'behavioral',
        [RecommendationActivityValues.Scenario]: 'scenario',
        [RecommendationActivityValues.ResumeImprovement]: 'resume',
      }[activityType];
      if (category && KNOWN_COMPETENCY_LABELS[`${category}.${normalized}`]) {
        return KNOWN_COMPETENCY_LABELS[`${category}.${normalized}`];
      }
    }
  }

  // Safe activity-based Vietnamese fallback. Never invent or leak raw English.
  switch (activityType) {
    case RecommendationActivityValues.Interview:
      return 'kỹ năng phỏng vấn cần ưu tiên';
    case RecommendationActivityValues.StarDrill:
      return 'kỹ năng trả lời STAR cần ưu tiên';
    case RecommendationActivityValues.Scenario:
      return 'kỹ năng xử lý tình huống cần ưu tiên';
    case RecommendationActivityValues.ResumeImprovement:
      return 'điểm cần cải thiện trong CV';
    case RecommendationActivityValues.ExternalLearning:
      return 'chủ đề học tập cần ưu tiên';
    default:
      return 'kỹ năng cần ưu tiên';
  }
}

export interface LocalizedRecommendationReasonOptions {
  /**
   * Whether to append duration to the reason string.
   * Defaults to false because UI surfaces (Overview, Analytics, PracticeHub, NextPracticeRecommendationContent)
   * already render dedicated metadata pills for estimated duration, avoiding double-stated duration.
   */
  includeDuration?: boolean;
}

/**
 * Presents a recommendation from server-owned structured rationale.
 * The legacy backend reason remains non-customer-facing because it may be English.
 * Uses stable competencyCode for natural Vietnamese localization.
 */
export function getLocalizedRecommendationReason(
  recommendation:
    | Pick<
        NextPracticeRecommendationResponse,
        'activityType' | 'priority' | 'estimatedMinutes' | 'rationale'
      >
    | null
    | undefined,
  options?: LocalizedRecommendationReasonOptions
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
    options?.includeDuration === true && recommendation.estimatedMinutes > 0
      ? ` Dành khoảng ${recommendation.estimatedMinutes} phút cho lượt luyện này.`
      : '';

  const rationale = recommendation.rationale;
  if (rationale) {
    const competencyLabel = getLocalizedCompetencyLabel(
      rationale.competencyCode,
      recommendation.activityType
    );

    const priorityReason =
      recommendation.priority <= 1
        ? 'điểm cần ưu tiên cao'
        : recommendation.priority === 2
          ? 'điểm nên củng cố tiếp theo'
          : 'một phần trong lộ trình hiện tại';

    const recencyReason = rationale.hasMoreRecentlyPracticedPeer
      ? ' Nội dung này cũng đã lâu chưa được luyện hơn một điểm cùng mức ưu tiên.'
      : '';

    const actionPrefix =
      recommendation.activityType === RecommendationActivityValues.ResumeImprovement
        ? 'Nên hoàn thiện'
        : 'Nên luyện';

    return `${actionPrefix} ${competencyLabel} tiếp theo vì đây là ${priorityReason}, dựa trên ${Math.max(0, rationale.evidenceCount)} bằng chứng đã ghi nhận.${recencyReason}${durationLabel}`;
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
          competencyCode: asNullableString(raw.rationale.competencyCode) || undefined,
          competencyName: asString(raw.rationale.competencyName).trim() || undefined,
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
