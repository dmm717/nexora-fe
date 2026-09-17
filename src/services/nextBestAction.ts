import {
  getRecommendationDeepLink,
  RecommendationActivityValues,
  type NextPracticeRecommendationResponse,
} from './recommendationContract.ts';

export function resolveNextBestAction({
  recommendation,
  targetRole,
  needsFirstEvidence,
}: {
  recommendation?: NextPracticeRecommendationResponse | null;
  targetRole?: string | null;
  needsFirstEvidence: boolean;
}) {
  if (needsFirstEvidence) {
    return {
      label: targetRole ? `Phân tích CV theo mục tiêu ${targetRole}` : 'Thiết lập mục tiêu và phân tích CV đầu tiên',
      description: 'Chọn vị trí bạn đang hướng tới và thêm CV để bắt đầu xây dựng bằng chứng của riêng bạn.',
      destination: '/resume-analyses',
      activityType: 'cv_analysis',
      estimatedMinutes: undefined,
    };
  }

  const base = {
    description: recommendation?.reason || 'Chọn bài luyện phù hợp với điều bạn muốn cải thiện tiếp theo.',
    estimatedMinutes:
      recommendation && recommendation.estimatedMinutes > 0
        ? recommendation.estimatedMinutes
        : undefined,
    destination: getRecommendationDeepLink(recommendation || null),
  };
  if (recommendation?.activityType === RecommendationActivityValues.StarDrill) {
    return { ...base, label: 'Luyện phản xạ STAR', activityType: RecommendationActivityValues.StarDrill };
  }
  if (recommendation?.activityType === RecommendationActivityValues.Scenario) {
    return { ...base, label: 'Luyện tình huống thực tế', activityType: RecommendationActivityValues.Scenario };
  }
  if (recommendation?.activityType === RecommendationActivityValues.Interview) {
    const retry = recommendation.action?.type === 'repeat_question' &&
      recommendation.action.sourceInterviewId && recommendation.action.sourceQuestionId;
    return { ...base, label: retry ? 'Luyện lại câu hỏi phỏng vấn' : 'Luyện phỏng vấn AI', activityType: RecommendationActivityValues.Interview };
  }
  if (recommendation?.activityType === RecommendationActivityValues.ResumeImprovement) {
    return { ...base, label: 'Cải thiện CV', activityType: RecommendationActivityValues.ResumeImprovement };
  }
  if (recommendation?.activityType === RecommendationActivityValues.ExternalLearning) {
    return { ...base, label: 'Tài liệu học bên ngoài', activityType: RecommendationActivityValues.ExternalLearning };
  }
  if (!targetRole) {
    return {
      ...base,
      label: 'Thiết lập mục tiêu nghề nghiệp',
      description: 'Chọn vai trò mục tiêu để các đề xuất tiếp theo có bối cảnh phù hợp.',
      destination: '/career-goals',
      activityType: 'career_goal',
    };
  }
  return { ...base, label: 'Bước tiếp theo chưa khả dụng', activityType: 'unknown' };
}
