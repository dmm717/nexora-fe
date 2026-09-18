/**
 * B9 Career goals contract (pure, dependency-free).
 *
 * Mirrors the backend `Nexora.Api.Contracts.CareerGoalContracts` wire shapes and
 * provides the form<->request mapping used by the React Query hooks. Keeping the
 * mapping pure lets production-contract tests exercise the exact same logic the
 * UI uses; ownership is always enforced server-side, so no user id is sent.
 */

export interface CareerGoalResponse {
  id: string;
  targetRole: string;
  seniority: string;
  industry: string | null;
  targetCompany: string | null;
  targetJobDescriptionId: string | null;
  targetDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCareerGoalRequest {
  targetRole: string;
  seniority: string;
  industry?: string | null;
  targetCompany?: string | null;
  targetJobDescriptionId?: string | null;
  targetDate?: string | null;
}

export interface UpdateCareerGoalRequest {
  targetRoleSpecified?: boolean;
  targetRole?: string | null;
  senioritySpecified?: boolean;
  seniority?: string | null;
  industrySpecified?: boolean;
  industry?: string | null;
  targetCompanySpecified?: boolean;
  targetCompany?: string | null;
  targetJobDescriptionIdSpecified?: boolean;
  targetJobDescriptionId?: string | null;
  targetDateSpecified?: boolean;
  targetDate?: string | null;
  activeSpecified?: boolean;
  active?: boolean | null;
}

export interface CareerGoalFormValues {
  targetRole: string;
  seniority: string;
  industry?: string;
  targetCompany?: string;
  targetDate?: string;
}

export const CAREER_GOAL_SENIORITY_OPTIONS = [
  { value: 'intern', label: 'Thực tập sinh (Intern)' },
  { value: 'entry', label: 'Mới đi làm (Entry-level)' },
  { value: 'junior', label: 'Nhân viên (Junior)' },
  { value: 'mid', label: 'Chuyên viên (Mid-level)' },
  { value: 'senior', label: 'Chuyên viên cao cấp (Senior)' },
  { value: 'lead', label: 'Trưởng nhóm (Lead)' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal' },
  { value: 'manager', label: 'Quản lý (Manager)' },
  { value: 'director', label: 'Giám đốc (Director)' },
  { value: 'executive', label: 'Điều hành (Executive)' },
] as const;

export type CareerGoalSeniorityValue = (typeof CAREER_GOAL_SENIORITY_OPTIONS)[number]['value'];

export function formatSeniorityLabel(seniority: string | null | undefined): string {
  if (!seniority) return 'Chưa cập nhật';
  const trimmed = seniority.trim().toLowerCase();
  const match = CAREER_GOAL_SENIORITY_OPTIONS.find((opt) => opt.value === trimmed);
  return match ? match.label : seniority;
}

const normalizeOptional = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Maps validated form values to the exact backend `CreateCareerGoalRequest`.
 * `targetRole`/`seniority` are required; blank optional fields are omitted
 * rather than sent as empty strings.
 */
export function buildCreateCareerGoalRequest(
  values: CareerGoalFormValues
): CreateCareerGoalRequest {
  const industry = normalizeOptional(values.industry);
  const targetCompany = normalizeOptional(values.targetCompany);
  const targetDate = normalizeOptional(values.targetDate);

  return {
    targetRole: values.targetRole.trim(),
    seniority: values.seniority.trim(),
    ...(industry ? { industry } : {}),
    ...(targetCompany ? { targetCompany } : {}),
    ...(targetDate ? { targetDate } : {}),
  };
}

export type UpdatableCareerGoalCurrent = {
  targetRole?: string | null;
  seniority?: string | null;
  industry?: string | null;
  targetCompany?: string | null;
  targetDate?: string | null;
};

const normalizeDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.split('T')[0];
};

/**
 * Builds a PATCH request that marks only changed fields as Specified. Unchanged
 * fields are omitted so editing one field never clears the others.
 */
export function buildUpdateCareerGoalRequest(
  current: UpdatableCareerGoalCurrent,
  values: CareerGoalFormValues
): UpdateCareerGoalRequest {
  const request: UpdateCareerGoalRequest = {};

  const nextRole = values.targetRole.trim();
  if (nextRole !== (current.targetRole?.trim() ?? '')) {
    request.targetRoleSpecified = true;
    request.targetRole = nextRole;
  }

  const nextSeniority = values.seniority.trim();
  if (nextSeniority !== (current.seniority?.trim() ?? '')) {
    request.senioritySpecified = true;
    request.seniority = nextSeniority;
  }

  const currentIndustry = normalizeOptional(current.industry) ?? null;
  const nextIndustry = normalizeOptional(values.industry) ?? null;
  if (nextIndustry !== currentIndustry) {
    request.industrySpecified = true;
    request.industry = nextIndustry;
  }

  const currentCompany = normalizeOptional(current.targetCompany) ?? null;
  const nextCompany = normalizeOptional(values.targetCompany) ?? null;
  if (nextCompany !== currentCompany) {
    request.targetCompanySpecified = true;
    request.targetCompany = nextCompany;
  }

  const currentDate = normalizeDate(current.targetDate);
  const nextDate = normalizeDate(values.targetDate);
  if (nextDate !== currentDate) {
    request.targetDateSpecified = true;
    request.targetDate = nextDate;
  }

  return request;
}

/**
 * Builds a partial update request for editing goal context from the Career Profile hub,
 * touching only the fields exposed in the Career Profile edit form (targetRole, seniority, industry)
 * and strictly leaving all other fields (targetCompany, targetJobDescriptionId, targetDate, active)
 * unspecified so they are not cleared.
 */
export function buildCareerProfileGoalUpdateRequest(
  current: {
    targetRole?: string | null;
    seniority?: string | null;
    industry?: string | null;
  },
  values: {
    targetRole: string;
    seniority: string;
    industry?: string | null;
  }
): UpdateCareerGoalRequest {
  const request: UpdateCareerGoalRequest = {};

  const nextRole = values.targetRole.trim();
  if (nextRole !== (current.targetRole?.trim() ?? '')) {
    request.targetRoleSpecified = true;
    request.targetRole = nextRole;
  }

  const nextSeniority = values.seniority.trim();
  if (nextSeniority !== (current.seniority?.trim() ?? '')) {
    request.senioritySpecified = true;
    request.seniority = nextSeniority;
  }

  const currentIndustry = normalizeOptional(current.industry) ?? null;
  const nextIndustry = normalizeOptional(values.industry) ?? null;
  if (nextIndustry !== currentIndustry) {
    request.industrySpecified = true;
    request.industry = nextIndustry;
  }

  return request;
}

/**
 * Reconciles the canonical active goal from CareerProfile with the management list.
 * In Nexora's architecture, useCareerProfile() owns the canonical active Career Goal snapshot,
 * while useCareerGoals() provides the management list.
 * A stale or failed full-list cache must NEVER override a fresher Career Profile active goal.
 */
export function reconcileCareerGoals<
  TActive extends (UpdatableCareerGoalCurrent & { id?: string }) | null | undefined,
  TGoal extends { id: string; active?: boolean }
>(
  activeGoalFromProfile: TActive,
  allGoals: TGoal[]
): {
  activeGoal: TActive extends object ? TActive : null;
  otherGoals: TGoal[];
} {
  const activeGoal = (activeGoalFromProfile || null) as (TActive extends object ? TActive : null);
  const activeGoalId = activeGoal?.id;

  const otherGoals = activeGoalId
    ? allGoals.filter((g) => g.id !== activeGoalId)
    : allGoals.filter((g) => !g.active);

  return { activeGoal, otherGoals };
}
