/**
 * B13 Progress Dashboard Contract (pure, dependency-free).
 * Mirrors backend `Nexora.Api.Contracts.ProgressDashboardContracts` and
 * `Nexora.Business.Progress.ProgressDashboardContracts` exactly.
 */

import {
  normalizeNextPracticeRecommendationResponse,
  type NextPracticeRecommendationResponse,
} from './recommendationContract.ts';

export interface ProgressDashboardReadinessResponse {
  score: number | null;
  assessedCompetencies: number;
  evidenceCount: number;
  priorityGapCount: number;
  qualitativeWeaknessCount: number;
  latestEvidenceAt: string | null;
}

export interface ProgressDashboardCompetencyResponse {
  code: string;
  name: string;
  category: string;
  score: number;
  evidenceCount: number;
  latestEvidenceAt: string;
}

export interface ProgressDashboardImprovementResponse {
  kind: string;
  resourceId: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  at: string;
}

export interface ProgressDashboardWeeklyActivitiesResponse {
  windowStart: string;
  windowEnd: string;
  total: number;
  resumeAnalyses: number;
  interviews: number;
  scenarios: number;
  starAttempts: number;
  learningPathActivities: number;
}

export interface ProgressStarAveragesResponse {
  situation: number;
  task: number;
  action: number;
  result: number;
}

export interface RecentInterviewScoreResponse {
  interviewId: string;
  score: number;
  completedAt: string;
}

export interface RecentActivityResponse {
  kind: string;
  resourceId: string;
  at: string;
}

export interface ProgressHistoricalStatsResponse {
  completedInterviews: number;
  recentInterviewScores: RecentInterviewScoreResponse[];
  averageInterviewScore: number | null;
  starAverages: ProgressStarAveragesResponse | null;
  completedScenarios: number;
  averageScenarioScore: number | null;
  completedStarAttempts: number;
  recentActivity: RecentActivityResponse[];
}

export interface ProgressDashboardResponse {
  readiness: ProgressDashboardReadinessResponse;
  weakestCompetencies: ProgressDashboardCompetencyResponse[];
  recentImprovements: ProgressDashboardImprovementResponse[];
  weeklyCompletedActivities: ProgressDashboardWeeklyActivitiesResponse;
  nextRecommendedPractice: NextPracticeRecommendationResponse | null;
  historicalStats: ProgressHistoricalStatsResponse;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function normalizeProgressDashboardReadiness(
  raw: unknown
): ProgressDashboardReadinessResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    score: asNullableNumber(record.score),
    assessedCompetencies: asNumber(record.assessedCompetencies, 0),
    evidenceCount: asNumber(record.evidenceCount, 0),
    priorityGapCount: asNumber(record.priorityGapCount, 0),
    qualitativeWeaknessCount: asNumber(record.qualitativeWeaknessCount, 0),
    latestEvidenceAt: asNullableString(record.latestEvidenceAt),
  };
}

export function normalizeProgressDashboardCompetency(
  raw: unknown
): ProgressDashboardCompetencyResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    code: asString(record.code),
    name: asString(record.name),
    category: asString(record.category),
    score: asNumber(record.score, 0),
    evidenceCount: asNumber(record.evidenceCount, 0),
    latestEvidenceAt: asString(record.latestEvidenceAt),
  };
}

export function normalizeProgressDashboardImprovement(
  raw: unknown
): ProgressDashboardImprovementResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    kind: asString(record.kind, 'interview'),
    resourceId: asString(record.resourceId),
    previousScore: asNumber(record.previousScore, 0),
    currentScore: asNumber(record.currentScore, 0),
    delta: asNumber(record.delta, 0),
    at: asString(record.at),
  };
}

export function normalizeProgressDashboardWeeklyActivities(
  raw: unknown
): ProgressDashboardWeeklyActivitiesResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    windowStart: asString(record.windowStart),
    windowEnd: asString(record.windowEnd),
    total: asNumber(record.total, 0),
    resumeAnalyses: asNumber(record.resumeAnalyses, 0),
    interviews: asNumber(record.interviews, 0),
    scenarios: asNumber(record.scenarios, 0),
    starAttempts: asNumber(record.starAttempts, 0),
    learningPathActivities: asNumber(record.learningPathActivities, 0),
  };
}

export function normalizeProgressHistoricalStats(
  raw: unknown
): ProgressHistoricalStatsResponse {
  const record = isRecord(raw) ? raw : {};
  const rawScores = Array.isArray(record.recentInterviewScores)
    ? record.recentInterviewScores
    : [];
  const rawActivity = Array.isArray(record.recentActivity)
    ? record.recentActivity
    : [];

  const starRecord = isRecord(record.starAverages) ? record.starAverages : null;
  const starAverages: ProgressStarAveragesResponse | null = starRecord
    ? {
        situation: asNumber(starRecord.situation, 0),
        task: asNumber(starRecord.task, 0),
        action: asNumber(starRecord.action, 0),
        result: asNumber(starRecord.result, 0),
      }
    : null;

  return {
    completedInterviews: asNumber(record.completedInterviews, 0),
    recentInterviewScores: rawScores.map((s: unknown) => {
      const rec = isRecord(s) ? s : {};
      return {
        interviewId: asString(rec.interviewId),
        score: asNumber(rec.score, 0),
        completedAt: asString(rec.completedAt),
      };
    }),
    averageInterviewScore: asNullableNumber(record.averageInterviewScore),
    starAverages,
    completedScenarios: asNumber(record.completedScenarios, 0),
    averageScenarioScore: asNullableNumber(record.averageScenarioScore),
    completedStarAttempts: asNumber(record.completedStarAttempts, 0),
    recentActivity: rawActivity.map((a: unknown) => {
      const rec = isRecord(a) ? a : {};
      return {
        kind: asString(rec.kind),
        resourceId: asString(rec.resourceId),
        at: asString(rec.at),
      };
    }),
  };
}

export type { NextPracticeRecommendationResponse };
export { normalizeNextPracticeRecommendationResponse };

export function normalizeProgressDashboardResponse(
  raw: unknown
): ProgressDashboardResponse {
  const record = isRecord(raw) ? raw : {};

  const rawWeakest = Array.isArray(record.weakestCompetencies)
    ? record.weakestCompetencies
    : [];
  const rawImprovements = Array.isArray(record.recentImprovements)
    ? record.recentImprovements
    : [];

  return {
    readiness: normalizeProgressDashboardReadiness(record.readiness),
    weakestCompetencies: rawWeakest.map(normalizeProgressDashboardCompetency),
    recentImprovements: rawImprovements.map(normalizeProgressDashboardImprovement),
    weeklyCompletedActivities: normalizeProgressDashboardWeeklyActivities(
      record.weeklyCompletedActivities
    ),
    nextRecommendedPractice: normalizeNextPracticeRecommendationResponse(
      record.nextRecommendedPractice
    ),
    historicalStats: normalizeProgressHistoricalStats(record.historicalStats),
  };
}

