export type InterviewLifecycleStatus =
  | 'draft'
  | 'starting'
  | 'active'
  | 'completing'
  | 'completed'
  | 'failed'
  | 'abandoned';

export type InterviewContinuationState =
  | 'in_progress'
  | 'upgrade_required'
  | 'max_questions_reached';

export type QuestionKind = 'primary' | 'followup';

export type QuestionTopic =
  | 'self_introduction'
  | 'behavioral_star'
  | 'motivation_role_fit'
  | 'technical'
  | 'behavioral'
  | 'cv_targeted'
  | 'jd_targeted'
  | 'scenario';

export const SCORE_SCALE = '0-100';
export const MINIMUM_REPORT_ANSWERS = 2;
export const FREE_QUESTION_LIMIT = 3;

export const DETERMINISTIC_ERROR_CODES = [
  'FEATURE_QUOTA_EXCEEDED',
  'FEATURE_NOT_AVAILABLE',
  'ANSWER_ALREADY_EXISTS',
  'CONCURRENT_SUBMISSION',
  'INTERVIEW_REPORT_FAILED',
  'INTERVIEW_REPORT_UNAVAILABLE',
  'INVALID_STATE',
  'VALIDATION_ERROR',
] as const;

export interface QuestionView {
  id: string;
  sequence: number;
  kind?: string;
  topic?: string;
  parentQuestionId?: string | null;
  content: string;
  createdAt: string;
}

export interface RubricScore {
  criterion: string;
  score: number;
  evidence: string;
}

export interface StarEvaluationComponent {
  score: number;
  detected?: boolean;
  evidence?: string;
  feedback: string;
}

export interface StarEvaluation {
  applicable: boolean;
  overallScore?: number | null;
  situation?: StarEvaluationComponent | null;
  task?: StarEvaluationComponent | null;
  action?: StarEvaluationComponent | null;
  result?: StarEvaluationComponent | null;
  missingElements?: string[];
  strengths?: string[];
  coachingTips?: string[];
  scoreScale?: string;
}

export interface AnswerEvaluation {
  scores?: RubricScore[];
  feedback?: string;
  scoreScale?: string;
  star?: StarEvaluation | null;
  strengths?: string[];
  improvements?: string[];
  improvedAnswer?: string | null;
}

export interface AnswerView {
  id: string;
  questionId: string;
  content: string;
  durationSeconds?: number | null;
  evaluation?: AnswerEvaluation | null;
  createdAt: string;
}

export interface InterviewContinuationView {
  state: InterviewContinuationState;
  canFinishNow: boolean;
  canUpgradeAndContinue: boolean;
}

export interface InterviewView {
  id: string;
  status: InterviewLifecycleStatus | string;
  role: string;
  seniority: string;
  interviewType: string;
  difficulty: string;
  version: number;
  questions: QuestionView[];
  answers: AnswerView[];
  continuation?: InterviewContinuationView | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerResult {
  answer: AnswerView;
  nextQuestion?: QuestionView | null;
  isComplete: boolean;
  continuation?: InterviewContinuationView | null;
}

export interface StarReportSummary {
  applicableAnswers: number;
  averageScore: number;
  componentAverages?: {
    situation?: number;
    task?: number;
    action?: number;
    result?: number;
    [key: string]: number | undefined;
  };
  strongestComponent: string;
  weakestComponent: string;
  recurringIssues: string[];
  coachingPriorities?: string[];
}

export interface InterviewQuestionReviewView {
  questionId: string;
  sequence: number;
  kind: string;
  topic: string;
  parentQuestionId?: string | null;
  question: string;
  answer: string;
  rubric: RubricScore[];
  feedback: string;
  star?: StarEvaluation | null;
  strengths: string[];
  improvements: string[];
  suggestedImprovedAnswer?: string | null;
}

export interface SuggestedImprovedAnswerView {
  questionId: string;
  sequence: number;
  answer: string;
}

export interface ReportSampleView {
  answeredQuestions: number;
  issuedQuestions: number;
  isPartial: boolean;
}

export interface ReportView {
  id: string;
  interviewId: string;
  overallScore: number;
  rubric: RubricScore[] | Record<string, unknown>;
  strengths: string[] | Record<string, unknown>;
  gaps: string[] | Record<string, unknown>;
  actionPlan: string[] | Record<string, unknown>;
  disclaimer: string;
  createdAt: string;
  starSummary?: StarReportSummary | null;
  questionReviews?: InterviewQuestionReviewView[] | null;
  suggestedImprovedAnswers?: SuggestedImprovedAnswerView[] | null;
  sample?: ReportSampleView | null;
}

export interface ContractErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

/**
 * Determines whether the user can finish the interview session now.
 * Minimum report answers is backend-owned (>= 2).
 */
export function canFinishInterview(
  continuation?: InterviewContinuationView | null,
  answeredCount?: number
): boolean {
  if (continuation?.canFinishNow !== undefined) {
    return continuation.canFinishNow;
  }
  return (answeredCount ?? 0) >= MINIMUM_REPORT_ANSWERS;
}

/**
 * Determines whether the user is eligible to upgrade their plan and continue
 * within the same interview session.
 */
export function canUpgradeAndContinue(
  continuation?: InterviewContinuationView | null
): boolean {
  return Boolean(continuation?.canUpgradeAndContinue);
}

/**
 * Checks whether the continuation state requires an upgrade to receive more questions.
 */
export function isUpgradeRequired(
  continuation?: InterviewContinuationView | null
): boolean {
  return continuation?.state === 'upgrade_required';
}

/**
 * Checks whether maximum questions have been reached for the interview session.
 */
export function isMaxQuestionsReached(
  continuation?: InterviewContinuationView | null
): boolean {
  return continuation?.state === 'max_questions_reached';
}

/**
 * Evaluates whether the interview should automatically trigger complete().
 * CRITICAL: nextQuestion = null + upgrade_required MUST NOT auto-complete.
 */
export function shouldAutoComplete(
  isComplete: boolean,
  continuation?: InterviewContinuationView | null,
  nextQuestion?: QuestionView | null
): boolean {
  if (isUpgradeRequired(continuation)) {
    return false;
  }
  if (nextQuestion) {
    return false;
  }
  return Boolean(isComplete);
}

/**
 * Derives the active, unanswered question from server questions and answers.
 * Questions are evaluated in sequence order.
 */
export function getCurrentQuestion(
  questions?: QuestionView[] | null,
  answers?: AnswerView[] | null
): QuestionView | null {
  if (!questions || questions.length === 0) return null;

  const answeredIds = new Set<string>();
  if (answers) {
    for (const a of answers) {
      if (a && a.questionId && typeof a.content === 'string' && a.content.trim().length > 0) {
        answeredIds.add(a.questionId);
      }
    }
  }

  const sortedQuestions = [...questions].sort((a, b) => a.sequence - b.sequence);
  return sortedQuestions.find((q) => !answeredIds.has(q.id)) || null;
}

/**
 * Pairs answered questions with their corresponding answer in question sequence order.
 */
export function getAnsweredQuestions(
  questions?: QuestionView[] | null,
  answers?: AnswerView[] | null
): Array<{ question: QuestionView; answer: AnswerView }> {
  if (!questions || !answers) return [];

  const answersByQuestionId = new Map<string, AnswerView>();
  for (const a of answers) {
    if (a && a.questionId && typeof a.content === 'string' && a.content.trim().length > 0) {
      answersByQuestionId.set(a.questionId, a);
    }
  }

  const sortedQuestions = [...questions].sort((a, b) => a.sequence - b.sequence);
  const result: Array<{ question: QuestionView; answer: AnswerView }> = [];

  for (const q of sortedQuestions) {
    const matchingAnswer = answersByQuestionId.get(q.id);
    if (matchingAnswer) {
      result.push({ question: q, answer: matchingAnswer });
    }
  }

  return result;
}

/**
 * Checks whether STAR evaluation is applicable to an answer.
 */
export function isStarApplicable(star?: StarEvaluation | null): boolean {
  return Boolean(star && star.applicable === true);
}

/**
 * Defensively normalizes a STAR component evaluation to guarantee non-crashing UI.
 */
export function normalizeStarComponent(comp?: StarEvaluationComponent | null): {
  score: number;
  detected: boolean;
  evidence: string;
  feedback: string;
} {
  return {
    score: typeof comp?.score === 'number' ? comp.score : 0,
    detected: Boolean(comp?.detected ?? (comp && typeof comp.score === 'number' && comp.score > 0)),
    evidence: comp?.evidence || '',
    feedback: comp?.feedback || '',
  };
}

/**
 * Defensively extracts and normalizes answer evaluation fields.
 */
export function safeAnswerEvaluation(evaluation?: AnswerEvaluation | null): {
  scores: RubricScore[];
  feedback: string;
  scoreScale: string;
  star: StarEvaluation | null;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string | null;
} {
  return {
    scores: Array.isArray(evaluation?.scores) ? evaluation.scores : [],
    feedback: evaluation?.feedback || '',
    scoreScale: evaluation?.scoreScale || SCORE_SCALE,
    star: evaluation?.star || null,
    strengths: Array.isArray(evaluation?.strengths) ? evaluation.strengths : [],
    improvements: Array.isArray(evaluation?.improvements) ? evaluation.improvements : [],
    improvedAnswer: evaluation?.improvedAnswer || null,
  };
}

/**
 * Identifies if an error represents an in-progress report generation (409 INTERVIEW_REPORT_PROCESSING).
 */
export function isReportProcessingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as ContractErrorLike;
  if (err.code === 'INTERVIEW_REPORT_PROCESSING') return true;
  if (err.status === 409 && typeof err.message === 'string' && err.message.toLowerCase().includes('xử lý')) {
    return true;
  }
  return false;
}

/**
 * Identifies if an error represents a failed report generation (409 INTERVIEW_REPORT_FAILED).
 */
export function isReportFailedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as ContractErrorLike;
  if (err.code === 'INTERVIEW_REPORT_FAILED') return true;
  if (err.status === 409 && typeof err.message === 'string' && err.message.toLowerCase().includes('chưa tạo được')) {
    return true;
  }
  return false;
}

/**
 * Identifies if an error represents an unavailable report (409 INTERVIEW_REPORT_UNAVAILABLE).
 */
export function isReportUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as ContractErrorLike;
  return err.code === 'INTERVIEW_REPORT_UNAVAILABLE';
}

/**
 * Checks whether a report is still pending generation.
 * Requirement: report 404 is ONLY treated as pending while interview is known to still be completing.
 */
export function isReportNotReady(interviewStatus: string | undefined, error: unknown): boolean {
  if (isReportProcessingError(error)) {
    return true;
  }
  if (!error || typeof error !== 'object') return false;
  const err = error as ContractErrorLike;
  if ((err.code === 'NOT_FOUND' || err.status === 404) && interviewStatus === 'completing') {
    return true;
  }
  return false;
}

/**
 * Classifies whether an error is a deterministic client or business error that must NOT
 * be transport-retried.
 */
export function isDeterministicError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as ContractErrorLike;
  if (err.code && DETERMINISTIC_ERROR_CODES.includes(err.code as (typeof DETERMINISTIC_ERROR_CODES)[number])) {
    return true;
  }
  // 4xx status codes are client-side / deterministic (exclude 408 timeout and 429 rate limit)
  if (
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500 &&
    err.status !== 408 &&
    err.status !== 429
  ) {
    return true;
  }
  return false;
}

/**
 * Generates an RFC-4122 v4 UUID for request idempotency.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Builds canonical start interview request specification.
 */
export function buildStartInterviewRequest(
  data: {
    role: string;
    seniority: string;
    interviewType: string;
    difficulty: string;
    resumeId?: string;
    jobDescriptionId?: string;
  },
  idempotencyKey?: string
) {
  return {
    url: '/interviews',
    method: 'POST' as const,
    data: {
      role: data.role.trim(),
      seniority: data.seniority,
      interviewType: data.interviewType,
      difficulty: data.difficulty,
      ...(data.resumeId ? { resumeId: data.resumeId } : {}),
      ...(data.jobDescriptionId ? { jobDescriptionId: data.jobDescriptionId } : {}),
    },
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}

/**
 * Builds canonical submit answer request specification.
 */
export function buildSubmitAnswerRequest(
  interviewId: string,
  data: { questionId: string; content: string; durationSeconds?: number },
  idempotencyKey?: string
) {
  return {
    url: `/interviews/${interviewId}/answers`,
    method: 'POST' as const,
    data: {
      questionId: data.questionId,
      content: data.content.trim(),
      ...(data.durationSeconds !== undefined ? { durationSeconds: data.durationSeconds } : {}),
    },
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}

/**
 * Builds canonical continue interview request specification.
 */
export function buildContinueInterviewRequest(interviewId: string, idempotencyKey?: string) {
  return {
    url: `/interviews/${interviewId}/continue`,
    method: 'POST' as const,
    data: {},
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}

/**
 * Builds canonical complete interview request specification.
 */
export function buildCompleteInterviewRequest(interviewId: string, idempotencyKey?: string) {
  return {
    url: `/interviews/${interviewId}/complete`,
    method: 'POST' as const,
    data: {},
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}

/**
 * Builds canonical report retry request specification.
 */
export function buildRetryReportRequest(interviewId: string, idempotencyKey?: string) {
  return {
    url: `/interviews/${interviewId}/report/retry`,
    method: 'POST' as const,
    data: {},
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}
