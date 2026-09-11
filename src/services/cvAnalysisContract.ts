// Pure contract helpers and definitions for CV / Resume Analysis

export type ResumeAnalysisMode = 'job_targeted' | 'field_benchmark';

export interface BaseResumeAnalysisOperation {
  userId: string;
  idempotencyKey: string;
  resumeId: string;
  analysisId?: string | null;
  timestamp: string | number;
}

export interface JobTargetedAnalysisOperation extends BaseResumeAnalysisOperation {
  mode: 'job_targeted';
  jobDescriptionId?: string | null;
  jdTitle: string;
  jdContent: string;
}

export interface FieldBenchmarkAnalysisOperation extends BaseResumeAnalysisOperation {
  mode: 'field_benchmark';
  industry: string;
  targetRole: string;
  seniority: string;
}

export type ResumeAnalysisOperation = JobTargetedAnalysisOperation | FieldBenchmarkAnalysisOperation;

export interface CreateJobTargetedAnalysisRequest {
  resumeId: string;
  mode: 'job_targeted';
  jobDescriptionId: string;
}

export interface CreateFieldBenchmarkAnalysisRequest {
  resumeId: string;
  mode: 'field_benchmark';
  industry: string;
  targetRole: string;
  seniority: string;
}

export type CreateAnalysisRequest = CreateJobTargetedAnalysisRequest | CreateFieldBenchmarkAnalysisRequest;

export const OPERATION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const JOB_TARGETED_BREAKDOWN_KEYS = [
  'technicalSkillMatch',
  'experienceRelevance',
  'impactEvidence',
  'clarity',
  'structure',
] as const;

export const FIELD_BENCHMARK_BREAKDOWN_KEYS = [
  'technicalFoundation',
  'projectEvidence',
  'experiencePresentation',
  'impactAchievements',
  'clarity',
  'roleAlignment',
] as const;

export const DETERMINISTIC_ERROR_CODES = [
  'FEATURE_QUOTA_EXCEEDED',
  'FEATURE_NOT_AVAILABLE',
  'RESUME_ANALYSIS_CONTEXT_INVALID',
] as const;

/**
 * Constructs the canonical backend request payload for analysis creation.
 * Guarantees no stray or cross-mode fields are dispatched.
 */
export function buildCreateAnalysisRequest(op: ResumeAnalysisOperation): CreateAnalysisRequest {
  if (op.mode === 'job_targeted') {
    if (!op.jobDescriptionId) {
      throw new Error('jobDescriptionId is required for job_targeted analysis');
    }
    return {
      resumeId: op.resumeId,
      mode: 'job_targeted',
      jobDescriptionId: op.jobDescriptionId,
    };
  }

  if (op.mode === 'field_benchmark') {
    const industry = op.industry.trim();
    const targetRole = op.targetRole.trim();
    const seniority = op.seniority.trim();
    if (!industry || !targetRole || !seniority) {
      throw new Error('industry, targetRole, and seniority are required for field_benchmark analysis');
    }
    return {
      resumeId: op.resumeId,
      mode: 'field_benchmark',
      industry,
      targetRole,
      seniority,
    };
  }

  throw new Error(`Unsupported mode: ${(op as { mode?: string }).mode}`);
}

/**
 * Normalizes and validates persisted pending operations from localStorage.
 * Enforces ownership, <= 1hr expiry, and nonblank trimmed inputs.
 * Transparently migrates valid legacy records lacking explicit mode.
 */
export function normalizePendingAnalysis(raw: unknown, currentUserId?: string): ResumeAnalysisOperation | null {
  if (!raw || typeof raw !== 'object') return null;

  const op = raw as Record<string, unknown>;

  if (currentUserId && op.userId !== currentUserId) {
    return null;
  }

  let ageInMs: number;
  if (typeof op.timestamp === 'number' && Number.isFinite(op.timestamp)) {
    ageInMs = Date.now() - op.timestamp;
  } else if (typeof op.timestamp === 'string') {
    const parsed = new Date(op.timestamp).getTime();
    ageInMs = Date.now() - parsed;
  } else {
    return null;
  }

  if (!Number.isFinite(ageInMs) || ageInMs < 0 || ageInMs > OPERATION_EXPIRY_MS) {
    return null;
  }

  if (
    !op.resumeId ||
    typeof op.resumeId !== 'string' ||
    !op.resumeId.trim() ||
    !op.idempotencyKey ||
    typeof op.idempotencyKey !== 'string' ||
    !op.idempotencyKey.trim()
  ) {
    return null;
  }

  const userId = typeof op.userId === 'string' ? op.userId : (currentUserId ?? '');
  const resumeId = op.resumeId.trim();
  const idempotencyKey = op.idempotencyKey.trim();
  const analysisId = typeof op.analysisId === 'string' ? op.analysisId : null;
  const timestamp = (typeof op.timestamp === 'string' || typeof op.timestamp === 'number') ? op.timestamp : Date.now();

  // Legacy schema migration: un-moded record with nonblank jdTitle + jdContent
  if (!op.mode) {
    const trimmedTitle = typeof op.jdTitle === 'string' ? op.jdTitle.trim() : '';
    const trimmedContent = typeof op.jdContent === 'string' ? op.jdContent.trim() : '';
    if (!trimmedTitle || !trimmedContent) {
      return null;
    }
    return {
      userId,
      idempotencyKey,
      resumeId,
      mode: 'job_targeted',
      jobDescriptionId: typeof op.jobDescriptionId === 'string' ? op.jobDescriptionId : null,
      analysisId,
      jdTitle: trimmedTitle,
      jdContent: trimmedContent,
      timestamp,
    };
  }

  if (op.mode === 'job_targeted') {
    const trimmedTitle = typeof op.jdTitle === 'string' ? op.jdTitle.trim() : '';
    const trimmedContent = typeof op.jdContent === 'string' ? op.jdContent.trim() : '';
    if (!trimmedTitle || !trimmedContent) {
      return null;
    }
    return {
      userId,
      idempotencyKey,
      resumeId,
      mode: 'job_targeted',
      jobDescriptionId: typeof op.jobDescriptionId === 'string' ? op.jobDescriptionId : null,
      analysisId,
      jdTitle: trimmedTitle,
      jdContent: trimmedContent,
      timestamp,
    };
  }

  if (op.mode === 'field_benchmark') {
    const trimmedIndustry = typeof op.industry === 'string' ? op.industry.trim() : '';
    const trimmedTargetRole = typeof op.targetRole === 'string' ? op.targetRole.trim() : '';
    const trimmedSeniority = typeof op.seniority === 'string' ? op.seniority.trim() : '';
    if (!trimmedIndustry || !trimmedTargetRole || !trimmedSeniority) {
      return null;
    }
    return {
      userId,
      idempotencyKey,
      resumeId,
      mode: 'field_benchmark',
      analysisId,
      industry: trimmedIndustry,
      targetRole: trimmedTargetRole,
      seniority: trimmedSeniority,
      timestamp,
    };
  }

  return null;
}

/**
 * Determines whether an error is deterministic (non-retryable at the transport level).
 * 403 quota/availability errors and 400 context errors reject immediately.
 */
export function isDeterministicAnalysisError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as { status?: number; code?: string };

  if (err.code && (DETERMINISTIC_ERROR_CODES as readonly string[]).includes(err.code)) {
    return true;
  }

  if (typeof err.status === 'number') {
    if (err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
      return true;
    }
  }

  return false;
}

/**
 * Returns authoritatively formatted quota error details without assuming account tier.
 */
export function formatQuotaError(code?: string): { title: string; message: string } {
  if (code === 'FEATURE_NOT_AVAILABLE') {
    return {
      title: 'Tính năng chưa khả dụng',
      message: 'Tính năng phân tích CV không khả dụng trong gói hiện tại của bạn.',
    };
  }

  return {
    title: 'Đã hết lượt phân tích CV',
    message: 'Bạn đã sử dụng hết lượt phân tích CV của gói hiện tại.',
  };
}

/**
 * Extracts presentation score and breakdown dimensions according to mode contract.
 */
export function extractAnalysisPresentation(
  result: Record<string, unknown>,
  declaredMode?: ResumeAnalysisMode
): {
  mode: ResumeAnalysisMode;
  score: number;
  breakdown: Record<string, number>;
  skills?: { matched: string[]; missing: string[] };
} {
  const mode: ResumeAnalysisMode = declaredMode
    ?? (result?.readinessScore !== undefined ? 'field_benchmark' : 'job_targeted');

  const rawBreakdown = (result?.breakdown && typeof result.breakdown === 'object')
    ? (result.breakdown as Record<string, unknown>)
    : {};

  if (mode === 'job_targeted') {
    const filteredBreakdown: Record<string, number> = {};
    for (const key of JOB_TARGETED_BREAKDOWN_KEYS) {
      if (typeof rawBreakdown[key] === 'number') {
        filteredBreakdown[key] = rawBreakdown[key];
      }
    }
    return {
      mode: 'job_targeted',
      score: typeof result?.matchScore === 'number' ? result.matchScore : 0,
      breakdown: filteredBreakdown,
      skills: {
        matched: Array.isArray(result?.matchedKeywordsOrSkills) ? result.matchedKeywordsOrSkills : [],
        missing: Array.isArray(result?.missingKeywordsOrSkills) ? result.missingKeywordsOrSkills : [],
      },
    };
  }

  const filteredBreakdown: Record<string, number> = {};
  for (const key of FIELD_BENCHMARK_BREAKDOWN_KEYS) {
    if (typeof rawBreakdown[key] === 'number') {
      filteredBreakdown[key] = rawBreakdown[key];
    }
  }
  return {
    mode: 'field_benchmark',
    score: typeof result?.readinessScore === 'number' ? result.readinessScore : 0,
    breakdown: filteredBreakdown,
  };
}
