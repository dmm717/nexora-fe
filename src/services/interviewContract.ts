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

export const DETERMINISTIC_ERROR_CODES = [
  'ANSWER_ALREADY_EXISTS',
  'CONCURRENT_SUBMISSION',
  'INTERVIEW_REPORT_FAILED',
  'INTERVIEW_REPORT_UNAVAILABLE',
  'VALIDATION_ERROR',
  'INVALID_INTERVIEW_STATE',
  'INTERVIEW_UPGRADE_REQUIRED',
  'INTERVIEW_MAX_QUESTIONS_REACHED',
  'IDEMPOTENCY_CONFLICT',
  'IDEMPOTENCY_KEY_REQUIRED',
  'QUOTA_EXCEEDED',
  'NOT_FOUND',
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
  rubric: RubricScore[];
  strengths: string[];
  gaps: string[];
  actionPlan: string[];
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

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeStringCollection = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const normalizeRubricCollection = (value: unknown): RubricScore[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const record = asRecord(item);
    if (
      !record ||
      typeof record.criterion !== 'string' ||
      typeof record.score !== 'number' ||
      !Number.isFinite(record.score) ||
      typeof record.evidence !== 'string'
    ) {
      return [];
    }

    return [{
      criterion: record.criterion,
      score: record.score,
      evidence: record.evidence,
    }];
  });
};

const normalizeStarEvaluationComponent = (
  value: unknown
): StarEvaluationComponent | null => {
  const record = asRecord(value);
  if (!record) return null;

  return {
    score: asNumber(record.score),
    ...(typeof record.detected === 'boolean' ? { detected: record.detected } : {}),
    ...(typeof record.evidence === 'string' ? { evidence: record.evidence } : {}),
    feedback: asString(record.feedback),
  };
};

const normalizeStarEvaluation = (value: unknown): StarEvaluation | null => {
  const record = asRecord(value);
  if (!record || typeof record.applicable !== 'boolean') return null;

  return {
    applicable: record.applicable,
    overallScore: typeof record.overallScore === 'number' ? record.overallScore : null,
    situation: normalizeStarEvaluationComponent(record.situation),
    task: normalizeStarEvaluationComponent(record.task),
    action: normalizeStarEvaluationComponent(record.action),
    result: normalizeStarEvaluationComponent(record.result),
    missingElements: normalizeStringCollection(record.missingElements),
    strengths: normalizeStringCollection(record.strengths),
    coachingTips: normalizeStringCollection(record.coachingTips),
    ...(typeof record.scoreScale === 'string' ? { scoreScale: record.scoreScale } : {}),
  };
};

const normalizeStarSummary = (value: unknown): StarReportSummary | null => {
  const record = asRecord(value);
  if (!record) return null;

  const rawComponentAverages = asRecord(record.componentAverages);
  const componentAverages = rawComponentAverages
    ? Object.fromEntries(
        Object.entries(rawComponentAverages).flatMap(([key, item]) =>
          typeof item === 'number' && Number.isFinite(item) ? [[key, item]] : []
        )
      ) as StarReportSummary['componentAverages']
    : undefined;

  return {
    applicableAnswers: asNumber(record.applicableAnswers),
    averageScore: asNumber(record.averageScore),
    ...(componentAverages ? { componentAverages } : {}),
    strongestComponent: asString(record.strongestComponent),
    weakestComponent: asString(record.weakestComponent),
    recurringIssues: normalizeStringCollection(record.recurringIssues),
    coachingPriorities: normalizeStringCollection(record.coachingPriorities),
  };
};

const normalizeQuestionReviews = (value: unknown): InterviewQuestionReviewView[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const record = asRecord(item);
    if (
      !record ||
      typeof record.questionId !== 'string' ||
      typeof record.sequence !== 'number' ||
      !Number.isFinite(record.sequence) ||
      typeof record.kind !== 'string' ||
      typeof record.topic !== 'string' ||
      typeof record.question !== 'string' ||
      typeof record.answer !== 'string' ||
      typeof record.feedback !== 'string'
    ) {
      return [];
    }

    return [{
      questionId: record.questionId,
      sequence: record.sequence,
      kind: record.kind,
      topic: record.topic,
      parentQuestionId: typeof record.parentQuestionId === 'string' ? record.parentQuestionId : null,
      question: record.question,
      answer: record.answer,
      rubric: normalizeRubricCollection(record.rubric),
      feedback: record.feedback,
      star: normalizeStarEvaluation(record.star),
      strengths: normalizeStringCollection(record.strengths),
      improvements: normalizeStringCollection(record.improvements),
      suggestedImprovedAnswer:
        typeof record.suggestedImprovedAnswer === 'string' ? record.suggestedImprovedAnswer : null,
    }];
  });
};

const normalizeSuggestedImprovedAnswers = (value: unknown): SuggestedImprovedAnswerView[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const record = asRecord(item);
    if (
      !record ||
      typeof record.questionId !== 'string' ||
      typeof record.sequence !== 'number' ||
      !Number.isFinite(record.sequence) ||
      typeof record.answer !== 'string'
    ) {
      return [];
    }

    return [{
      questionId: record.questionId,
      sequence: record.sequence,
      answer: record.answer,
    }];
  });
};

const normalizeReportSample = (value: unknown): ReportSampleView | null => {
  const record = asRecord(value);
  if (!record) return null;

  return {
    answeredQuestions: asNumber(record.answeredQuestions),
    issuedQuestions: asNumber(record.issuedQuestions),
    isPartial: record.isPartial === true,
  };
};

/**
 * Normalizes the untrusted report wire response once at the API boundary.
 * Collection fields always become stable typed arrays; malformed values fail safely to [].
 */
export function normalizeReportView(raw: unknown): ReportView {
  const record = asRecord(raw) || {};

  return {
    id: asString(record.id),
    interviewId: asString(record.interviewId),
    overallScore: asNumber(record.overallScore),
    rubric: normalizeRubricCollection(record.rubric),
    strengths: normalizeStringCollection(record.strengths),
    gaps: normalizeStringCollection(record.gaps),
    actionPlan: normalizeStringCollection(record.actionPlan),
    disclaimer: asString(record.disclaimer),
    createdAt: asString(record.createdAt),
    starSummary: normalizeStarSummary(record.starSummary),
    questionReviews: normalizeQuestionReviews(record.questionReviews),
    suggestedImprovedAnswers: normalizeSuggestedImprovedAnswers(record.suggestedImprovedAnswers),
    sample: normalizeReportSample(record.sample),
  };
}

/**
 * Determines whether the user can finish the interview session now.
 * Server-authoritative: strictly respects continuation.canFinishNow.
 * If continuation is not present, fails closed (returns false) without local guesses.
 */
export function canFinishInterview(
  continuation?: InterviewContinuationView | null
): boolean {
  return continuation?.canFinishNow === true;
}

/**
 * Determines whether an official answer may be exposed or submitted.
 * Unknown and non-active lifecycle states fail closed.
 */
export function canSubmitInterviewAnswer(params: {
  status?: string;
  hasQuestion: boolean;
  upgradeRequired: boolean;
}): boolean {
  return (
    params.status === 'active' &&
    params.hasQuestion === true &&
    params.upgradeRequired === false
  );
}

/**
 * Keeps the answer timer running only while the current answer is genuinely answerable.
 * A failed submission sets submitting back to false, which deterministically resumes it.
 */
export function shouldRunAnswerTimer(params: {
  status?: string;
  hasQuestion: boolean;
  canSubmitAnswer: boolean;
  submitting: boolean;
}): boolean {
  return (
    params.status === 'active' &&
    params.hasQuestion === true &&
    params.canSubmitAnswer === true &&
    params.submitting === false
  );
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
 * Idempotently reconciles a successful submitAnswer result into an interview view.
 * The accepted answer is appended exactly once (keyed by answer id), the optional
 * next question exactly once (keyed by question id), continuation is replaced when
 * the result carries one and preserved otherwise, and unrelated interview fields
 * are left untouched. Deterministic: applying the same result again cannot duplicate.
 */
export function applyAnswerResultToInterview(
  current: InterviewView,
  result: AnswerResult
): InterviewView {
  const answers = current.answers.some((a) => a.id === result.answer.id)
    ? current.answers
    : [...current.answers, result.answer];

  let questions = current.questions;
  const nextQuestion = result.nextQuestion;
  if (nextQuestion && !current.questions.some((q) => q.id === nextQuestion.id)) {
    questions = [...current.questions, nextQuestion];
  }

  return {
    ...current,
    answers,
    questions,
    continuation: result.continuation ?? current.continuation,
    version: current.version + 1,
  };
}

/**
 * Holds the idempotency key for a single interview completion intent.
 * The key is generated once and reused across ALL attempts: a transport failure
 * must never rotate it because the server processes complete side effects keyed
 * by it. Only a confirmed successful completion mints a fresh key for a future intent.
 */
export interface CompleteIntentState {
  getKey(): string;
  confirmComplete(): void;
}

export function createCompleteIntentState(): CompleteIntentState {
  let key = generateIdempotencyKey();
  return {
    getKey() {
      return key;
    },
    confirmComplete() {
      key = generateIdempotencyKey();
    },
  };
}

/**
 * Checks whether STAR evaluation is applicable to an answer.
 */
export function isStarApplicable(star?: StarEvaluation | null): boolean {
  return Boolean(star && star.applicable === true);
}

/**
 * Defensively normalizes a STAR component evaluation to guarantee non-crashing UI.
 * Explicit detected === false means score is 0 and evidence is empty string.
 */
export function normalizeStarComponent(comp?: StarEvaluationComponent | null): {
  score: number;
  detected: boolean;
  evidence: string;
  feedback: string;
} {
  if (!comp) {
    return {
      score: 0,
      detected: false,
      evidence: '',
      feedback: '',
    };
  }

  // If detected is explicitly false, score is 0 and evidence is empty
  const detected = comp.detected !== undefined
    ? Boolean(comp.detected)
    : typeof comp.score === 'number' && comp.score > 0;

  const score = detected && typeof comp.score === 'number' ? comp.score : 0;
  const evidence = detected && typeof comp.evidence === 'string' ? comp.evidence : '';

  return {
    score,
    detected,
    evidence,
    feedback: comp.feedback || '',
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

export interface CanonicalStartPayload {
  role: string;
  seniority: string;
  interviewType: string;
  difficulty: string;
  resumeId?: string;
  jobDescriptionId?: string;
}

export interface StartIntent {
  key: string;
  payload: CanonicalStartPayload;
}

/**
 * Compares two start payloads for semantic equality (with trimmed role).
 */
export function isSameStartPayload(a: CanonicalStartPayload, b: CanonicalStartPayload): boolean {
  return (
    a.role.trim() === b.role.trim() &&
    a.seniority === b.seniority &&
    a.interviewType === b.interviewType &&
    a.difficulty === b.difficulty &&
    (a.resumeId || undefined) === (b.resumeId || undefined) &&
    (a.jobDescriptionId || undefined) === (b.jobDescriptionId || undefined)
  );
}

/**
 * Returns an existing start intent if candidate payload matches, or creates a new one.
 */
export function getOrCreateStartIntent(
  existingIntent: StartIntent | null | undefined,
  candidatePayload: CanonicalStartPayload
): StartIntent {
  const normalizedCandidate: CanonicalStartPayload = {
    role: candidatePayload.role.trim(),
    seniority: candidatePayload.seniority,
    interviewType: candidatePayload.interviewType,
    difficulty: candidatePayload.difficulty,
    ...(candidatePayload.resumeId ? { resumeId: candidatePayload.resumeId } : {}),
    ...(candidatePayload.jobDescriptionId ? { jobDescriptionId: candidatePayload.jobDescriptionId } : {}),
  };

  if (existingIntent && isSameStartPayload(existingIntent.payload, normalizedCandidate)) {
    return existingIntent;
  }

  return {
    key: generateIdempotencyKey(),
    payload: normalizedCandidate,
  };
}

export interface CanonicalAnswerPayload {
  questionId: string;
  content: string;
  durationSeconds?: number;
}

export interface AnswerIntent {
  key: string;
  payload: CanonicalAnswerPayload;
}

/**
 * Compares two answer payloads for semantic equality (matching questionId and trimmed content).
 */
export function isSameAnswerPayload(a: CanonicalAnswerPayload, b: CanonicalAnswerPayload): boolean {
  return a.questionId === b.questionId && a.content.trim() === b.content.trim();
}

/**
 * Returns an existing answer intent if candidate questionId and trimmed content match (reusing key and frozen duration),
 * or creates a new one with a fresh key and the provided durationSeconds.
 */
export function getOrCreateAnswerIntent(
  existingIntent: AnswerIntent | null | undefined,
  candidatePayload: { questionId: string; content: string; durationSeconds?: number }
): AnswerIntent {
  const trimmedContent = candidatePayload.content.trim();

  if (
    existingIntent &&
    existingIntent.payload.questionId === candidatePayload.questionId &&
    existingIntent.payload.content.trim() === trimmedContent
  ) {
    return existingIntent;
  }

  return {
    key: generateIdempotencyKey(),
    payload: {
      questionId: candidatePayload.questionId,
      content: trimmedContent,
      ...(candidatePayload.durationSeconds !== undefined
        ? { durationSeconds: candidatePayload.durationSeconds }
        : {}),
    },
  };
}

export const REPORT_POLL_INTERVAL_MS = 15_000;
export const REPORT_POLL_MAX_ATTEMPTS = 8; // 8 * 15s = 120s (2 minutes)

export interface ReportPollingAttemptTracker {
  ensureCycle(cycleKey: string): void;
  getAttemptCount(): number;
  scheduleFallbackPoll(): void;
  consumeScheduledPoll(): boolean;
  recordFallbackPoll(): number;
  reset(): void;
}

/**
 * Tracks real fallback poll executions independently from React Query internals.
 * Scheduling is idempotent so repeated refetchInterval evaluations do not inflate the count.
 */
export function createReportPollingAttemptTracker(): ReportPollingAttemptTracker {
  let cycleKey: string | null = null;
  let attemptCount = 0;
  let pollScheduled = false;

  const reset = () => {
    attemptCount = 0;
    pollScheduled = false;
  };

  return {
    ensureCycle(nextCycleKey: string) {
      if (cycleKey === nextCycleKey) return;
      cycleKey = nextCycleKey;
      reset();
    },
    getAttemptCount() {
      return attemptCount;
    },
    scheduleFallbackPoll() {
      pollScheduled = true;
    },
    consumeScheduledPoll() {
      if (!pollScheduled) return false;
      pollScheduled = false;
      return true;
    },
    recordFallbackPoll() {
      attemptCount += 1;
      return attemptCount;
    },
    reset,
  };
}

export interface ReportPollingDecisionParams {
  interviewStatus?: string;
  error?: unknown;
  fallbackAttemptCount?: number;
  maxAttempts?: number;
}

export interface ReportPollingDecision {
  shouldPoll: boolean;
  intervalMs?: number;
  reason:
    | 'failed'
    | 'unavailable'
    | 'bound_exhausted'
    | 'processing'
    | 'completing_404'
    | 'completed_404'
    | 'not_pending';
}

/**
 * Evaluates whether report polling should continue, strictly bounded and pending-only.
 * Never polls on report failure, unavailable, or once max attempts are reached.
 */
export function getReportPollingDecision(
  params: ReportPollingDecisionParams
): ReportPollingDecision {
  const {
    interviewStatus,
    error,
    fallbackAttemptCount = 0,
    maxAttempts = REPORT_POLL_MAX_ATTEMPTS,
  } = params;

  if (isReportFailedError(error)) {
    return { shouldPoll: false, reason: 'failed' };
  }

  if (isReportUnavailableError(error)) {
    return { shouldPoll: false, reason: 'unavailable' };
  }

  if (fallbackAttemptCount >= maxAttempts) {
    return { shouldPoll: false, reason: 'bound_exhausted' };
  }

  if (isReportProcessingError(error)) {
    return { shouldPoll: true, intervalMs: REPORT_POLL_INTERVAL_MS, reason: 'processing' };
  }

  if (error && typeof error === 'object') {
    const err = error as ContractErrorLike;
    if (err.code === 'NOT_FOUND' || err.status === 404) {
      if (interviewStatus === 'completing') {
        return { shouldPoll: true, intervalMs: REPORT_POLL_INTERVAL_MS, reason: 'completing_404' };
      }
      return { shouldPoll: false, reason: 'completed_404' };
    }
  }

  return { shouldPoll: false, reason: 'not_pending' };
}
