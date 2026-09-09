export type ScenarioDifficulty = 'easy' | 'medium' | 'hard';

export type ScenarioAttemptStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export interface ScenarioCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface ScenarioCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  difficulty: ScenarioDifficulty;
  competency: string;
  estimatedMinutes: number;
}

export interface ScenarioDetail extends ScenarioCard {
  content: string;
}

export interface ScenarioDimensionEvaluation {
  criterion: string;
  score: number;
  evidence: string;
  feedback: string;
}

export interface ScenarioEvaluation {
  overallScore: number;
  dimensions: ScenarioDimensionEvaluation[];
  strengths: string[];
  gaps: string[];
  recommendedApproach: string[];
  feedback: string;
  scoreScale?: string;
}

export interface ScenarioAttempt {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  status: ScenarioAttemptStatus;
  answer: string | null;
  evaluation: ScenarioEvaluation | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ScenarioAttemptHistoryItem {
  id: string;
  attemptNumber: number;
  status: ScenarioAttemptStatus;
  answer: string | null;
  overallScore: number | null;
  previousScore: number | null;
  scoreDelta: number | null;
  improved: boolean | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ScenarioAttemptComparison {
  currentScore: number | null;
  previousScore: number | null;
  delta: number | null;
  improved: boolean | null;
}

export interface ScenarioAttemptHistory {
  scenarioId: string;
  scenarioSlug: string;
  scenarioTitle: string;
  categorySlug: string;
  categoryName: string;
  difficulty: ScenarioDifficulty;
  competency: string;
  attempts: ScenarioAttemptHistoryItem[];
  comparison: ScenarioAttemptComparison;
  latestScore: number | null;
  bestScore: number | null;
}

export interface ScenarioTrackProgress {
  categorySlug: string;
  categoryName: string;
  attemptCount: number;
  completedAttempts: number;
  averageScore: number | null;
  latestScore: number | null;
}

export interface ScenarioCompetencyProgress {
  competency: string;
  attemptCount: number;
  completedAttempts: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
}

export interface ScenarioDifficultyProgress {
  difficulty: string;
  attemptCount: number;
  completedAttempts: number;
  averageScore: number | null;
}

export interface ScenarioProgress {
  recommendedDifficulty: ScenarioDifficulty;
  attemptCount: number;
  completedAttempts: number;
  averageScore: number | null;
  latestScore: number | null;
  bestScore: number | null;
  tracks: ScenarioTrackProgress[];
  competencies: ScenarioCompetencyProgress[];
  difficulties: ScenarioDifficultyProgress[];
}

export interface ScenarioFilterParams {
  category?: string;
  difficulty?: string;
  competency?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ScenarioPageResponse {
  total: number;
  items: ScenarioCard[];
}
