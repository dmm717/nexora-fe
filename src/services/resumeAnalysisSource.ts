import type { ResumeAnalysisMode } from './cvAnalysisContract';

export type ResumeAnalysisSourceMode = 'current_profile' | 'custom';

export interface ResumeAnalysisResumeInput {
  id: string;
  status?: string | null;
  fileName?: string | null;
}

export interface ResumeAnalysisGoalInput {
  id?: string | null;
  targetRole?: string | null;
  seniority?: string | null;
  industry?: string | null;
}

export interface ResumeAnalysisReadinessInput {
  sourceMode: ResumeAnalysisSourceMode;
  analysisMode: ResumeAnalysisMode;
  primaryResume?: ResumeAnalysisResumeInput | null;
  activeCareerGoal?: ResumeAnalysisGoalInput | null;
  customResume?: ResumeAnalysisResumeInput | null;
  industry?: string | null;
  targetRole?: string | null;
  seniority?: string | null;
  jdTitle?: string | null;
  jdContent?: string | null;
  isUploading?: boolean;
}

export interface ResumeAnalysisReadiness {
  canAnalyze: boolean;
  missingPrimaryResume: boolean;
  missingCareerGoal: boolean;
  missingIndustry: boolean;
  missingCustomResume: boolean;
  missingJd: boolean;
  primaryResumeId?: string;
  customResumeId?: string;
}

const hasText = (value?: string | null): boolean => Boolean(value?.trim());

const isReady = (resume?: ResumeAnalysisResumeInput | null): boolean => resume?.status === 'ready';

/**
 * Keeps visible readiness and submit readiness on the same source of truth.
 * Current Profile is resolved only from server-backed profile fields. Custom
 * analysis is resolved only from the explicitly selected ready resume.
 */
export function getResumeAnalysisReadiness(
  input: ResumeAnalysisReadinessInput,
): ResumeAnalysisReadiness {
  const missingPrimaryResume = input.sourceMode === 'current_profile' && !isReady(input.primaryResume);
  const missingCareerGoal = input.sourceMode === 'current_profile' && (
    !input.activeCareerGoal
    || !hasText(input.activeCareerGoal.targetRole)
    || !hasText(input.activeCareerGoal.seniority)
  );
  const currentProfileIndustry = hasText(input.industry) ? input.industry : input.activeCareerGoal?.industry;
  const missingIndustry = input.analysisMode === 'field_benchmark' && !hasText(
    input.sourceMode === 'current_profile' ? currentProfileIndustry : input.industry,
  );
  const missingCustomResume = input.sourceMode === 'custom'
    && (!isReady(input.customResume) || input.isUploading === true);
  const missingJd = input.analysisMode === 'job_targeted'
    && (!hasText(input.jdTitle) || !hasText(input.jdContent));

  const canAnalyze = input.sourceMode === 'current_profile'
    ? !missingPrimaryResume && !missingCareerGoal && !missingIndustry && !missingJd
    : !missingCustomResume
      && (input.analysisMode !== 'field_benchmark'
        || (hasText(input.industry) && hasText(input.targetRole) && hasText(input.seniority)))
      && !missingJd;

  return {
    canAnalyze,
    missingPrimaryResume,
    missingCareerGoal,
    missingIndustry,
    missingCustomResume,
    missingJd,
    primaryResumeId: input.primaryResume?.id,
    customResumeId: input.customResume?.id,
  };
}

/**
 * Builds the resume/goal authority for an analysis operation.
 * Current Profile intentionally leaves resumeId unset so the API resolves the
 * server-backed primary resume. Custom always carries the selected resume ID.
 */
export function getResumeAnalysisSourceContract(input: {
  sourceMode: ResumeAnalysisSourceMode;
  primaryResume?: ResumeAnalysisResumeInput | null;
  activeCareerGoal?: ResumeAnalysisGoalInput | null;
  customResume?: ResumeAnalysisResumeInput | null;
}): { resumeId?: string | null; careerGoalId?: string } {
  if (input.sourceMode === 'current_profile') {
    return {
      resumeId: null,
      ...(input.activeCareerGoal?.id ? { careerGoalId: input.activeCareerGoal.id } : {}),
    };
  }

  return input.customResume?.id ? { resumeId: input.customResume.id } : {};
}
