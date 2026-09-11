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

/**
 * Builds a PATCH request that marks only changed fields as Specified. Unchanged
 * fields are omitted so editing one field never clears the others.
 */
export function buildUpdateCareerGoalRequest(
  current: CareerGoalResponse,
  values: CareerGoalFormValues
): UpdateCareerGoalRequest {
  const request: UpdateCareerGoalRequest = {};

  const nextRole = values.targetRole.trim();
  if (nextRole !== current.targetRole) {
    request.targetRoleSpecified = true;
    request.targetRole = nextRole;
  }

  const nextSeniority = values.seniority.trim();
  if (nextSeniority !== current.seniority) {
    request.senioritySpecified = true;
    request.seniority = nextSeniority;
  }

  const nextIndustry = normalizeOptional(values.industry) ?? null;
  if (nextIndustry !== (current.industry ?? null)) {
    request.industrySpecified = true;
    request.industry = nextIndustry;
  }

  const nextCompany = normalizeOptional(values.targetCompany) ?? null;
  if (nextCompany !== (current.targetCompany ?? null)) {
    request.targetCompanySpecified = true;
    request.targetCompany = nextCompany;
  }

  const nextDate = normalizeOptional(values.targetDate) ?? null;
  if (nextDate !== (current.targetDate ?? null)) {
    request.targetDateSpecified = true;
    request.targetDate = nextDate;
  }

  return request;
}
