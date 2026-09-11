/**
 * B10 Skill Profile Contract (pure, dependency-free).
 * Mirrors backend `Nexora.Api.Contracts.SkillProfileContracts` exactly.
 */

export interface SkillProfileSourceResponse {
  sourceType: string;
  evidenceCount: number;
  latestEvidenceAt: string;
}

export interface SkillProfileCompetencyResponse {
  code: string;
  name: string;
  category: string;
  score: number;
  evidenceCount: number;
  latestEvidenceAt: string;
  sources: SkillProfileSourceResponse[];
}

export interface SkillProfileWeaknessSignalResponse {
  sourceType: string;
  label: string;
  latestEvidenceAt: string;
}

export interface SkillProfileResponse {
  competencies: SkillProfileCompetencyResponse[];
  weaknessSignals: SkillProfileWeaknessSignalResponse[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function normalizeSkillProfileSource(raw: unknown): SkillProfileSourceResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    sourceType: asString(record.sourceType),
    evidenceCount: asNumber(record.evidenceCount, 0),
    latestEvidenceAt: asString(record.latestEvidenceAt),
  };
}

export function normalizeSkillProfileCompetency(raw: unknown): SkillProfileCompetencyResponse {
  const record = isRecord(raw) ? raw : {};
  const rawSources = Array.isArray(record.sources) ? record.sources : [];
  return {
    code: asString(record.code),
    name: asString(record.name),
    category: asString(record.category),
    score: asNumber(record.score, 0),
    evidenceCount: asNumber(record.evidenceCount, 0),
    latestEvidenceAt: asString(record.latestEvidenceAt),
    sources: rawSources.map(normalizeSkillProfileSource),
  };
}

export function normalizeSkillProfileWeaknessSignal(raw: unknown): SkillProfileWeaknessSignalResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    sourceType: asString(record.sourceType),
    label: asString(record.label),
    latestEvidenceAt: asString(record.latestEvidenceAt),
  };
}

export function normalizeSkillProfileResponse(raw: unknown): SkillProfileResponse {
  const record = isRecord(raw) ? raw : {};
  const rawCompetencies = Array.isArray(record.competencies) ? record.competencies : [];
  const rawSignals = Array.isArray(record.weaknessSignals) ? record.weaknessSignals : [];

  return {
    competencies: rawCompetencies.map(normalizeSkillProfileCompetency),
    weaknessSignals: rawSignals.map(normalizeSkillProfileWeaknessSignal),
  };
}
