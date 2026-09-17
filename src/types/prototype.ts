// Core domain types matching nexora-backend main branch contracts

export type SeniorityLevel = 'Intern' | 'Fresher' | 'Junior' | 'Middle' | 'Senior' | 'Lead' | 'Principal';

export type InterviewType = 'technical' | 'behavioral' | 'scenario' | 'cv_targeted' | 'jd_targeted' | 'motivation_role_fit' | 'self_introduction';

export type InterviewDifficulty = 'Standard' | 'Challenging' | 'Expert';

export type InterviewStatus = 'draft' | 'starting' | 'active' | 'completing' | 'completed' | 'failed' | 'abandoned';

// -------------------------------------------------------------
// Career Profile & Goals
// -------------------------------------------------------------
export interface CareerProfileIdentity {
  userId: string;
  email: string;
  displayName: string | null;
  yearsOfExperience: number | null;
  avatarUrl?: string | null;
}

export interface CareerProfileGoal {
  id: string;
  targetRole: string;
  seniority: string;
  industry?: string | null;
  targetCompany?: string | null;
  targetDate?: string | null;
  active: boolean;
}

export interface CompetencyEvidence {
  code: string;
  name: string;
  category: string;
  score: number;
  evidenceCount: number;
  latestEvidenceAt?: string;
}

export interface WeaknessSignal {
  sourceType: string;
  label: string;
  latestEvidenceAt: string;
}

export interface CareerProfileSkillSummary {
  topCompetencies: CompetencyEvidence[];
  topWeaknessSignals: WeaknessSignal[];
}

export interface CareerProfileLearningPathSummary {
  id: string;
  status: string;
  pendingActivityCount: number;
  completedActivityCount: number;
}

export interface CareerProfileOnboarding {
  hasDisplayName: boolean;
  hasYearsOfExperience: boolean;
  hasPrimaryResume: boolean;
  hasActiveCareerGoal: boolean;
  isComplete: boolean;
}

export interface PrimaryResumeSummary {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  latestAnalysis?: {
    id: string;
    mode: 'job_targeted' | 'field_benchmark';
    status: string;
    createdAt: string;
  } | null;
}

export interface CareerProfile {
  profile: CareerProfileIdentity;
  primaryResume: PrimaryResumeSummary | null;
  activeCareerGoal: CareerProfileGoal | null;
  skillProfileSummary: CareerProfileSkillSummary;
  learningPath: CareerProfileLearningPathSummary | null;
  onboarding: CareerProfileOnboarding;
}

// -------------------------------------------------------------
// Resumes & Analyses
// -------------------------------------------------------------
export interface ResumeItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  status: string;
  createdAt: string;
  isPrimary?: boolean;
}

export type ResumeAnalysisMode = 'job_targeted' | 'field_benchmark';

export interface JobTargetedBreakdown {
  technicalSkillMatch: number | null;
  experienceRelevance: number | null;
  impactEvidence: number | null;
  clarity: number | null;
  structure: number | null;
}

export interface FieldBenchmarkBreakdown {
  technicalFoundation: number | null;
  projectEvidence: number | null;
  experiencePresentation: number | null;
  impactAchievements: number | null;
  clarity: number | null;
  roleAlignment: number | null;
}

export interface CvEditSuggestion {
  section: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface JobTargetedResult {
  mode: 'job_targeted';
  matchScore: number | null;
  summary: string;
  matchedKeywordsOrSkills: string[];
  missingKeywordsOrSkills: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  sectionFeedback: string[];
  cvEditSuggestions?: CvEditSuggestion[];
  breakdown: JobTargetedBreakdown;
}

export interface FieldBenchmarkResult {
  mode: 'field_benchmark';
  readinessScore: number | null;
  summary: string;
  matchedKeywordsOrSkills?: string[];
  missingKeywordsOrSkills?: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  sectionFeedback: string[];
  cvEditSuggestions?: CvEditSuggestion[];
  breakdown: FieldBenchmarkBreakdown;
}

export interface ResumeAnalysisItem {
  id: string;
  resumeId: string;
  mode: ResumeAnalysisMode;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string | null;
  result?: JobTargetedResult | FieldBenchmarkResult | null;
  context?: {
    mode: string;
    industry?: string | null;
    targetRole?: string | null;
    seniority?: string | null;
    jobDescriptionTitle?: string | null;
    resumeFileName?: string | null;
    rubricVersion?: string | null;
  };
}

// -------------------------------------------------------------
// Interview & Realtime Coaching
// -------------------------------------------------------------
export interface RubricScore {
  criterion: 'correctness' | 'structure' | 'completeness' | 'clarity';
  score: number;
  evidence: string;
}

export interface StarComponent {
  score: number;
  detected: boolean;
  evidence: string;
  feedback: string;
}

export interface StarEvaluation {
  applicable: boolean;
  overallScore: number;
  situation: StarComponent;
  task: StarComponent;
  action: StarComponent;
  result: StarComponent;
  missingElements: string[];
  strengths: string[];
  coachingTips: string[];
  scoreScale?: string;
}

export interface PerAnswerCoaching {
  rubric: RubricScore[];
  strengths: string[];
  improvements: string[];
  improvedAnswer: string | null;
  feedback?: string | null;
  star?: StarEvaluation | null;
}

export interface InterviewQuestion {
  id: string;
  sequence: number;
  kind: 'primary' | 'followup';
  topic: string;
  content: string;
  createdAt: string;
}

export interface InterviewAnswer {
  id: string;
  questionId: string;
  content: string;
  durationSeconds?: number | null;
  evaluation?: PerAnswerCoaching | null;
  createdAt: string;
}

export interface InterviewContinuation {
  state: 'in_progress' | 'upgrade_required' | 'max_questions_reached';
  canFinishNow: boolean;
  canUpgradeAndContinue: boolean;
}

export interface InterviewSession {
  id: string;
  status: InterviewStatus;
  role: string;
  seniority: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  version: number;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  continuation?: InterviewContinuation | null;
  activeQuestionIndex?: number;
  sourceInterviewId?: string;
  sourceQuestionId?: string;
  reason?: string;
  focusTopic?: string;
  // Session-specific snapshot context overrides (do not mutate profile)
  resumeFileName?: string | null;
  resumeId?: string | null;
  jobDescription?: string | null;
  questionLimit?: number | null; // null for unlimited
  isExpanded?: boolean; // flag indicating expanded session
  answeredQuestionCount?: number;
  issuedQuestionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const DIFFICULTY_LABELS: Record<InterviewDifficulty, { labelVi: string; machineValue: string }> = {
  Standard: { labelVi: 'Dễ', machineValue: 'easy' },
  Challenging: { labelVi: 'Trung bình', machineValue: 'medium' },
  Expert: { labelVi: 'Khó', machineValue: 'hard' },
};


// -------------------------------------------------------------
// Interview Report
// -------------------------------------------------------------
export interface InterviewQuestionReview {
  questionId: string;
  sequence: number;
  kind: string;
  topic: string;
  question: string;
  answer: string;
  rubric: RubricScore[];
  feedback: string;
  star?: StarEvaluation | null;
  strengths: string[];
  improvements: string[];
  suggestedImprovedAnswer?: string | null;
}

export interface InterviewReport {
  id: string;
  interviewId: string;
  overallScore: number | null;
  rubric: RubricScore[];
  strengths: string[];
  gaps: string[];
  actionPlan: string[];
  disclaimer: string;
  createdAt: string;
  isPartial?: boolean;
  sample?: {
    answeredQuestions: number;
    issuedQuestions: number;
    isPartial: boolean;
  } | null;
  questionReviews: InterviewQuestionReview[];
}

// -------------------------------------------------------------
// Progress Dashboard
// -------------------------------------------------------------
export interface ProgressDashboardReadiness {
  score: number | null; // Nullable if insufficient evidence
  assessedCompetencies: number;
  evidenceCount: number;
  priorityGapCount: number;
  qualitativeWeaknessCount: number;
  latestEvidenceAt?: string | null;
}

export interface ProgressCompetency {
  code: string;
  name: string;
  category: string;
  score: number;
  evidenceCount: number;
  latestEvidenceAt: string;
}

export interface ProgressImprovement {
  kind: string;
  resourceId: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  at: string;
}

export interface ProgressWeeklyActivities {
  windowStart: string;
  windowEnd: string;
  total: number;
  resumeAnalyses: number;
  interviews: number;
  scenarios: number;
  starAttempts: number;
  learningPathActivities: number;
}

export interface NextPracticeRecommendation {
  reason: string;
  activityType: 'interview' | 'scenario' | 'star' | 'reading';
  resourceId?: string | null;
  estimatedMinutes: number;
  priority: number;
  action?: {
    type: string;
    reason: string;
    sourceInterviewId?: string | null;
    sourceQuestionId?: string | null;
    focusTopic?: string | null;
    suggestedInterviewType?: string | null;
  } | null;
}

export interface ProgressDashboard {
  readiness: ProgressDashboardReadiness;
  weakestCompetencies: ProgressCompetency[];
  recentImprovements: ProgressImprovement[];
  weeklyCompletedActivities: ProgressWeeklyActivities;
  nextRecommendedPractice: NextPracticeRecommendation | null;
}

// -------------------------------------------------------------
// Learning Path
// -------------------------------------------------------------
export interface LearningPathActivity {
  id: string;
  type: 'interview' | 'scenario' | 'star' | 'course' | 'reading';
  title: string;
  description: string;
  competencyCode: string;
  resourceId?: string | null;
  priority: number;
  status: 'pending' | 'completed' | 'in_progress';
  sortOrder: number;
  completedAt?: string | null;
}

export interface LearningPathMilestone {
  id: string;
  code: string;
  title: string;
  sortOrder: number;
  status: 'pending' | 'in_progress' | 'completed';
  activities: LearningPathActivity[];
}

export interface LearningPath {
  id: string;
  careerGoalId: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  progress: {
    completedActivityCount: number;
    totalActivityCount: number;
    percentage: number;
  };
  milestones: LearningPathMilestone[];
}

// -------------------------------------------------------------
// Scenarios & STAR
// -------------------------------------------------------------
export type ScenarioDifficulty = 'easy' | 'medium' | 'hard';

export interface ScenarioItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  difficulty: ScenarioDifficulty | string; // supports easy, medium, hard or legacy display
  competency: string;
  estimatedMinutes: number;
  tags?: string[];
  content: {
    context: string;
    systemDiagram?: string;
    incidentSymptoms: string[];
    constraints: string[];
    deliverable: string;
  };
}

export interface ScenarioEvaluationDimension {
  criterion: string;
  score: number;
  evidence: string;
  feedback: string;
}

export interface ScenarioEvaluation {
  overallScore: number;
  dimensions: ScenarioEvaluationDimension[];
  strengths: string[];
  gaps: string[];
  recommendedApproach: string[];
  feedback: string;
  scoreScale: string;
}

export interface ScenarioAttempt {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  status: 'draft' | 'submitted' | 'evaluating' | 'completed';
  answer: string;
  evaluation?: ScenarioEvaluation | null;
  createdAt: string;
  completedAt?: string | null;
  attemptNumber?: number;
  previousScore?: number | null;
  deltaScore?: number | null;
}

export interface StarAttempt {
  id: string;
  questionId?: string;
  question: string;
  answer: string;
  status: 'submitted' | 'completed';
  evaluation?: StarEvaluation | null;
  createdAt: string;
  completedAt?: string | null;
}

// -------------------------------------------------------------
// Contextual Recent Activity Feed
// -------------------------------------------------------------
export type ActivityKind = 'cv_analysis' | 'interview' | 'scenario' | 'star';

export interface RecentActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  context?: string;
  summary: string;
  statusText?: string;
  score?: number | null;
  scoreScale?: string;
  scoreLabel?: string;
  createdAt: string;
  destinationUrl: string;
  date?: string;
  href?: string;
  targetRole?: string | null;
  seniority?: string | null;
  industry?: string | null;
  entityId?: string;
  isPracticeAgain?: boolean;
  sourceEntityId?: string;
}

// -------------------------------------------------------------
// Plans, Billing & Entitlements (Matching backend contracts)
// -------------------------------------------------------------
export interface PlanFeatureResponse {
  code: string;
  name: string;
  enabled: boolean;
  limit: number | null;
  unlimited: boolean;
}

export interface PlanPriceResponseV2 {
  id: string;
  amountMinor: number;
  currency: string;
  durationDays: number | null;
  interviewQuota: number | null;
  features: PlanFeatureResponse[];
}

export interface PlanResponseV2 {
  id: string;
  code: string; // 'free' | 'basic' | 'weekly' | 'pro'
  name: string;
  description: string;
  badge: string | null;
  isHighlighted: boolean;
  prices: PlanPriceResponseV2[];
}

export interface BillingEntitlement {
  planCode: string;
  planName: string;
  expiresAt: string | null;
  interviewQuotaRemaining: number | null; // null = unlimited
  features: {
    cvAnalysis: { enabled: boolean; limitRemaining: number | null };
    interview: { enabled: boolean; limitRemaining: number | null; maxQuestionsPerSession: number | null };
    scenario: { enabled: boolean; unlimited: boolean };
    starBuilder: { enabled: boolean; limitRemaining: number | null; unlimited: boolean };
    advancedReport: boolean;
    progressAnalytics: boolean;
  };
}

export interface MockOrder {
  id: string;
  orderCode: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  createdAt: string;
}

// -------------------------------------------------------------
// Authentication & User Intent
// -------------------------------------------------------------
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface PendingIntent {
  action: 'cv_analysis' | 'interview_preflight' | 'star' | 'scenario' | 'progress' | 'checkout' | 'navigation';
  targetUrl: string;
  returnTo?: string;
  planPriceId?: string;
  metadata?: Record<string, any>;
}

