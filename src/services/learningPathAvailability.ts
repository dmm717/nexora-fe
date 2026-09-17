export interface LearningPathLike {
  careerGoalId?: string;
  milestones?: Array<{
    activities?: unknown[];
  }>;
}

export interface CareerProfileLike {
  activeCareerGoal?: {
    id?: string;
  } | null;
}

export interface ProgressDashboardLike {
  readiness?: {
    evidenceCount?: number;
  };
}

// Evidence alone does not generate a roadmap: an actual path for this goal must exist.
export function hasAvailableLearningPath(
  path: LearningPathLike | null | undefined,
  profile: CareerProfileLike | null | undefined,
  progress: ProgressDashboardLike | null | undefined,
): boolean {
  return (
    !!path &&
    !!profile?.activeCareerGoal?.id &&
    (!path.careerGoalId || path.careerGoalId === profile.activeCareerGoal.id) &&
    (progress?.readiness?.evidenceCount === undefined || progress.readiness.evidenceCount > 0) &&
    Array.isArray(path.milestones) &&
    path.milestones.some((milestone) => Array.isArray(milestone.activities) && milestone.activities.length > 0)
  );
}
