export interface NextPracticeRecommendationLike {
  activityType?: string;
  reason?: string;
  estimatedMinutes?: number;
  action?: {
    type?: string;
    sourceInterviewId?: string;
    sourceQuestionId?: string;
  } | null;
}

export function resolveNextBestAction({
  recommendation,
  targetRole,
  needsFirstEvidence,
  scenarioEnabled,
}: {
  recommendation?: NextPracticeRecommendationLike | null;
  targetRole?: string | null;
  needsFirstEvidence: boolean;
  scenarioEnabled: boolean;
}) {
  if (!targetRole || needsFirstEvidence) {
    return {
      label: targetRole ? `Phân tích CV theo mục tiêu ${targetRole}` : 'Thiết lập mục tiêu và phân tích CV đầu tiên',
      description: 'Chọn vị trí bạn đang hướng tới và thêm CV để bắt đầu xây dựng bằng chứng của riêng bạn.',
      destination: '/resume-analyses',
      activityType: 'cv_analysis',
      estimatedMinutes: 15,
    };
  }

  const base = {
    description: recommendation?.reason || 'Chọn bài luyện phù hợp với điều bạn muốn cải thiện tiếp theo.',
    estimatedMinutes: recommendation?.estimatedMinutes ?? 15,
  };
  if (recommendation?.activityType === 'star') {
    return { ...base, label: 'Luyện phản xạ STAR', destination: '/practice/star', activityType: 'star' };
  }
  if (recommendation?.activityType === 'scenario') {
    return { ...base, label: 'Luyện tình huống thực tế', destination: scenarioEnabled ? '/practice/scenarios' : '/pricing', activityType: 'scenario' };
  }
  if (recommendation?.activityType === 'interview') {
    const retry = recommendation.action?.type === 'repeat_question' &&
      recommendation.action.sourceInterviewId && recommendation.action.sourceQuestionId;
    return { ...base, label: retry ? 'Luyện lại câu hỏi phỏng vấn' : 'Luyện phỏng vấn AI', destination: retry ? '/interviews/new' : '/interviews/new', activityType: 'interview' };
  }
  return { ...base, label: 'Chọn bước luyện tiếp theo', destination: '/practice', activityType: 'practice' };
}
