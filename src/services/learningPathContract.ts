/**
 * B11 Learning Path Contract (pure, dependency-free).
 * Mirrors backend `Nexora.Api.Contracts.LearningPathContracts` and
 * `Nexora.Business.Learning.LearningPathValues` exactly.
 */

export const LearningPathValues = {
  Active: 'active',
  Pending: 'pending',
  Completed: 'completed',
  Obsolete: 'obsolete',

  Scenario: 'scenario',
  StarDrill: 'star_drill',
  Interview: 'interview',
  ResumeImprovement: 'resume_improvement',
  ExternalLearning: 'external_learning',

  CriticalMilestone: 'critical_gaps',
  DevelopingMilestone: 'developing_skills',
  SupportingMilestone: 'supporting_improvements',
} as const;

export type LearningPathStatus = typeof LearningPathValues.Active | string;
export type LearningPathMilestoneStatus = 'pending' | 'completed' | string;
export type LearningPathActivityStatus = 'pending' | 'completed' | 'obsolete' | string;
export type LearningPathActivityType =
  | 'scenario'
  | 'star_drill'
  | 'interview'
  | 'resume_improvement'
  | 'external_learning'
  | string;

export interface UpdateLearningPathActivityRequest {
  status: 'completed';
}

export interface LearningPathProgressResponse {
  completedActivityCount: number;
  totalActivityCount: number;
  percentage: number;
}

export interface LearningPathActivityResponse {
  id: string;
  type: LearningPathActivityType;
  title: string;
  description: string;
  competencyCode: string | null;
  resourceId: string | null;
  externalUrl: string | null;
  priority: number;
  status: LearningPathActivityStatus;
  order: number;
  completedAt: string | null;
}

export interface LearningPathMilestoneResponse {
  id: string;
  code: string;
  title: string;
  order: number;
  status: LearningPathMilestoneStatus;
  activities: LearningPathActivityResponse[];
}

export interface LearningPathResponse {
  id: string;
  careerGoalId: string;
  status: LearningPathStatus;
  createdAt: string;
  updatedAt: string;
  progress: LearningPathProgressResponse;
  milestones: LearningPathMilestoneResponse[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function normalizeLearningPathProgress(raw: unknown): LearningPathProgressResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    completedActivityCount: asNumber(record.completedActivityCount, 0),
    totalActivityCount: asNumber(record.totalActivityCount, 0),
    percentage: Math.min(100, Math.max(0, asNumber(record.percentage, 0))),
  };
}

export function normalizeLearningPathActivity(raw: unknown): LearningPathActivityResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    id: asString(record.id),
    type: asString(record.type, LearningPathValues.ExternalLearning),
    title: asString(record.title),
    description: asString(record.description),
    competencyCode: asNullableString(record.competencyCode),
    resourceId: asNullableString(record.resourceId),
    externalUrl: asNullableString(record.externalUrl),
    priority: asNumber(record.priority, 1),
    status: asString(record.status, LearningPathValues.Pending),
    order: asNumber(record.order, 0),
    completedAt: asNullableString(record.completedAt),
  };
}

export function normalizeLearningPathMilestone(raw: unknown): LearningPathMilestoneResponse {
  const record = isRecord(raw) ? raw : {};
  const rawActivities = Array.isArray(record.activities) ? record.activities : [];
  const activities = rawActivities
    .map(normalizeLearningPathActivity)
    .sort((a, b) => a.order - b.order);

  return {
    id: asString(record.id),
    code: asString(record.code),
    title: asString(record.title),
    order: asNumber(record.order, 0),
    status: asString(record.status, LearningPathValues.Pending),
    activities,
  };
}

export function normalizeLearningPathResponse(raw: unknown): LearningPathResponse {
  const record = isRecord(raw) ? raw : {};
  const rawMilestones = Array.isArray(record.milestones) ? record.milestones : [];
  const milestones = rawMilestones
    .map(normalizeLearningPathMilestone)
    .sort((a, b) => a.order - b.order);

  return {
    id: asString(record.id),
    careerGoalId: asString(record.careerGoalId),
    status: asString(record.status, LearningPathValues.Active),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
    progress: normalizeLearningPathProgress(record.progress),
    milestones,
  };
}

/**
 * Resolves the destination route for an activity based on its type and resources.
 */
export function getActivityDeepLink(activity: LearningPathActivityResponse): string | null {
  switch (activity.type) {
    case LearningPathValues.Scenario:
      return activity.resourceId
        ? `/scenarios/${activity.resourceId}`
        : '/scenarios';
    case LearningPathValues.StarDrill:
      return '/star-builder';
    case LearningPathValues.Interview:
      return '/interviews/new';
    case LearningPathValues.ResumeImprovement:
      return '/resumes';
    case LearningPathValues.ExternalLearning:
      return activity.externalUrl || null;
    default:
      return null;
  }
}
