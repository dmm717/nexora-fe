import type { CareerProfileResponse, PrimaryResumeSummary } from '../../services/profileApi';

type RequestFailure = {
  code?: string;
  status?: number;
};

const retryableStatuses = new Set([408, 429, 502, 503, 504]);

export function shouldRetryCareerProfileRequest(failureCount: number, error: unknown) {
  if (failureCount >= 1) return false;

  const status = (error as RequestFailure | null)?.status;
  if (status === undefined) return true;
  return retryableStatuses.has(status);
}

export function applyPrimaryResumeToCareerProfile(
  current: CareerProfileResponse | undefined,
  primaryResume: PrimaryResumeSummary | null,
) {
  if (!current) return current;

  const hasPrimaryResume = primaryResume !== null;
  const onboarding = {
    ...current.onboarding,
    hasPrimaryResume,
    isComplete:
      current.onboarding.hasDisplayName &&
      current.onboarding.hasYearsOfExperience &&
      hasPrimaryResume &&
      current.onboarding.hasActiveCareerGoal,
  };

  return { ...current, primaryResume, onboarding };
}

export function getPrimaryResumeErrorMessage(error: unknown) {
  const code = (error as RequestFailure | null)?.code;

  if (code === 'RESUME_NOT_READY') return 'CV chưa xử lý xong.';
  if (code === 'NOT_FOUND') return 'CV không còn tồn tại hoặc không thuộc tài khoản.';
  return 'Chưa thể cập nhật CV chính. Vui lòng thử lại sau.';
}
