export type InterviewLifecycleStatus =
  | 'draft'
  | 'starting'
  | 'active'
  | 'completing'
  | 'completed'
  | 'failed'
  | 'abandoned';

export type InterviewReportState = 'none' | 'processing' | 'ready' | 'failed';
export type InterviewResultState = 'collecting' | 'processing' | 'ready' | 'failed';
export type InterviewQuestionPreparationState = 'ready' | 'processing' | 'failed';
export type InterviewAnswerEvaluationState = 'queued' | 'processing' | 'ready' | 'failed';

export interface InterviewEvaluationProgress {
  total: number;
  queued: number;
  processing: number;
  ready: number;
  failed: number;
}

export function shouldUseLegacyReportCompatibility(
  reportState: InterviewReportState | undefined,
  interviewStatus: string | undefined
): boolean {
  return reportState === undefined && interviewStatus === 'completing';
}

export function shouldFetchInterviewReport(
  reportState: InterviewReportState | undefined,
  interviewStatus: string | undefined
): boolean {
  return reportState === 'ready' ||
    shouldUseLegacyReportCompatibility(reportState, interviewStatus) ||
    (reportState === undefined && interviewStatus === 'completed');
}

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

export type InterviewType =
  | 'technical'
  | 'behavioral'
  | 'scenario'
  | 'cv_targeted'
  | 'jd_targeted'
  | 'motivation_role_fit'
  | 'self_introduction';

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

export type SampleAnswerFramework = 'star' | 'self_intro' | 'technical' | 'direct';

export interface SampleInterviewAnswer {
  framework: SampleAnswerFramework;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  fullAnswer: string;
}

export interface AnswerEvaluation {
  scores?: RubricScore[];
  feedback?: string;
  scoreScale?: string;
  star?: StarEvaluation | null;
  strengths?: string[];
  improvements?: string[];
  improvedAnswer?: string | null;
  sampleAnswer?: SampleInterviewAnswer | null;
}

export interface AnswerView {
  id: string;
  questionId: string;
  content: string;
  durationSeconds?: number | null;
  evaluation?: AnswerEvaluation | null;
  evaluationState?: InterviewAnswerEvaluationState | string;
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
  reportState?: InterviewReportState;
  resultState?: InterviewResultState;
  evaluationProgress?: InterviewEvaluationProgress | null;
  questionPreparationState?: InterviewQuestionPreparationState;
  createdAt: string;
  updatedAt: string;
}

export function getAnswerEvaluationErrorMessage(error: unknown): string {
  const candidate = error as { code?: string; status?: number } | null;
  if (candidate?.code === 'AI_OUTPUT_INVALID') {
    return 'AI chưa thể tạo kết quả đánh giá hợp lệ. Câu trả lời của bạn vẫn được giữ lại; hãy thử lại.';
  }
  if (candidate?.code === 'AI_PROVIDER_UNAVAILABLE') {
    return 'Dịch vụ AI đang tạm thời bận. Câu trả lời của bạn chưa bị mất.';
  }
  if (candidate?.code === 'AI_RATE_LIMITED') {
    return 'AI đang xử lý nhiều yêu cầu. Vui lòng thử lại sau.';
  }
  if (candidate?.status !== undefined && candidate.status >= 500) {
    return 'Chưa thể đánh giá câu trả lời. Câu trả lời của bạn vẫn được giữ lại.';
  }
  return 'Lỗi khi gửi câu trả lời. Câu trả lời của bạn vẫn được giữ lại.';
}

export type AnswerSubmissionPhase = 'idle' | 'submitting' | 'evaluating' | 'accepted';

export function getAnswerSubmissionStatus(params: {
  phase: AnswerSubmissionPhase;
  listening: boolean;
  mode: 'voice' | 'chatbox';
  timerLabel: string;
}): string {
  if (params.phase === 'submitting' || params.phase === 'evaluating') {
    return 'Đang lưu câu trả lời...';
  }
  if (params.phase === 'accepted') {
    return 'Đã lưu câu trả lời thành công';
  }
  if (params.listening) {
    return `Đang nghe bạn · ${params.timerLabel}`;
  }
  return params.mode === 'chatbox'
    ? 'Nhập câu trả lời, xem lại rồi nộp'
    : 'Nhấn microphone để bắt đầu trả lời · không tự động nộp';
}

/**
 * Lightweight summary returned by `GET /interviews` (history list).
 * Matches BE's `InterviewHistoryItemResponse` exactly.
 */
export interface InterviewHistoryItem {
  id: string;
  status: InterviewLifecycleStatus | string;
  role: string;
  seniority: string;
  interviewType: string;
  difficulty: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  answeredQuestionCount: number;
  issuedQuestionCount: number;
  reportAvailable: boolean;
  careerGoalId?: string | null;
  sourceInterviewId?: string | null;
  sourceQuestionId?: string | null;
  practiceReason?: string | null;
  focusTopic?: string | null;
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
  sampleAnswer?: SampleInterviewAnswer | null;
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
  overallScore: number | null;
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

const isSampleAnswerFramework = (value: unknown): value is SampleAnswerFramework =>
  value === 'star' || value === 'self_intro' || value === 'technical' || value === 'direct';

const normalizeSampleAnswerText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

/**
 * Normalizes the optional illustrative answer without allowing malformed sample data
 * to invalidate the rest of an interview evaluation or report.
 */
export function normalizeSampleInterviewAnswer(value: unknown): SampleInterviewAnswer | null {
  const record = asRecord(value);
  if (!record || !isSampleAnswerFramework(record.framework)) return null;

  const fullAnswer = normalizeSampleAnswerText(record.fullAnswer);
  if (!fullAnswer) return null;

  if (record.framework === 'star') {
    const situation = normalizeSampleAnswerText(record.situation);
    const task = normalizeSampleAnswerText(record.task);
    const action = normalizeSampleAnswerText(record.action);
    const result = normalizeSampleAnswerText(record.result);
    if (!situation || !task || !action || !result) return null;

    return {
      framework: 'star',
      situation,
      task,
      action,
      result,
      fullAnswer,
    };
  }

  return {
    framework: record.framework,
    situation: null,
    task: null,
    action: null,
    result: null,
    fullAnswer,
  };
}

const normalizeAnswerForComparison = (value: string): string => {
  let normalized = value.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu, ' ');
  const wrappingQuotes: ReadonlyArray<readonly [string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
    ['«', '»'],
    ['「', '」'],
    ['『', '』'],
  ];

  for (const [opening, closing] of wrappingQuotes) {
    if (normalized.startsWith(opening) && normalized.endsWith(closing)) {
      normalized = normalized.slice(opening.length, normalized.length - closing.length).trim();
      break;
    }
  }

  return normalized.replace(/[.!?…]+$/u, '').trim();
};

/**
 * Hides a grounded rewrite only when it is blank or conservatively equivalent
 * to the actual submitted answer. No fuzzy similarity is used.
 */
export function shouldShowGroundedRewrite(params: {
  candidateAnswer?: string | null;
  improvedAnswer?: string | null;
}): boolean {
  const improvedAnswer = typeof params.improvedAnswer === 'string'
    ? normalizeAnswerForComparison(params.improvedAnswer)
    : '';
  if (!improvedAnswer) return false;

  const candidateAnswer = typeof params.candidateAnswer === 'string'
    ? normalizeAnswerForComparison(params.candidateAnswer)
    : '';

  return !candidateAnswer || candidateAnswer !== improvedAnswer;
}

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
      sampleAnswer: normalizeSampleInterviewAnswer(record.sampleAnswer),
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
    overallScore:
      typeof record.overallScore === 'number' && Number.isFinite(record.overallScore)
        ? record.overallScore
        : null,
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

export type InterviewContinuationAction =
  | 'continue_same_session'
  | 'upgrade'
  | 'complete'
  | 'none';

/**
 * Maps the canonical server continuation state to the only action the client may take.
 * `canUpgradeAndContinue` describes upgrade eligibility; it never authorizes /continue.
 */
export function getInterviewContinuationAction(params: {
  continuation?: InterviewContinuationView | null;
  answeredQuestionCount: number;
  hasActiveQuestion: boolean;
  questionPreparationState?: InterviewQuestionPreparationState;
}): InterviewContinuationAction {
  const { continuation, answeredQuestionCount, hasActiveQuestion, questionPreparationState } = params;

  // Never offer continuation while automatic question preparation is processing or failed
  if (questionPreparationState === 'processing' || questionPreparationState === 'failed') {
    return 'none';
  }

  if (!continuation || hasActiveQuestion || answeredQuestionCount < 3) return 'none';
  if (continuation.state === 'upgrade_required') return 'upgrade';
  if (continuation.state === 'max_questions_reached') return 'complete';
  if (continuation.state === 'in_progress') return 'continue_same_session';
  return 'none';
}

export type InterviewRouteState =
  | 'preparing'
  | 'active'
  | 'processing'
  | 'completed'
  | 'terminal'
  | 'unavailable';

/** Keeps draft and unknown lifecycle states out of the active interview room. */
export function getInterviewRouteState(status?: string | null): InterviewRouteState {
  if (status === 'starting') return 'preparing';
  if (status === 'active') return 'active';
  if (status === 'completing') return 'processing';
  if (status === 'completed') return 'completed';
  if (status === 'failed' || status === 'abandoned') return 'terminal';
  return 'unavailable';
}

/**
 * Only the server's final allocated-question boundary triggers complete().
 */
export function shouldAutoComplete(
  isComplete: boolean,
  continuation?: InterviewContinuationView | null,
  nextQuestion?: QuestionView | null
): boolean {
  return isComplete === true && !nextQuestion && isMaxQuestionsReached(continuation);
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

  const continuation = result.continuation ?? current.continuation;

  // Reconcile question preparation state at batch boundary:
  // When nextQuestion is null/absent but the session remains in progress and active,
  // the server has queued background question planning for the next batch.
  // Reconcile questionPreparationState to 'processing' immediately so the room
  // enters preparation UI and initiates fallback polling instead of staying stale 'ready'.
  let questionPreparationState = current.questionPreparationState;
  const isSessionInProgress =
    continuation?.state === 'in_progress' && current.status === 'active';
  if (!nextQuestion && isSessionInProgress) {
    questionPreparationState = 'processing';
  } else if (nextQuestion) {
    questionPreparationState = 'ready';
  }

  return {
    ...current,
    answers,
    questions,
    continuation,
    questionPreparationState,
    version: current.version + 1,
  };
}

export function reconcileInterviewSnapshot(
  current: InterviewView | undefined,
  incoming: InterviewView
): InterviewView {
  if (!current || incoming.version > current.version) return incoming;
  if (incoming.version < current.version) return current;
  if (current.answers.some(answer => !incoming.answers.some(item => item.id === answer.id)) ||
      current.questions.some(question => !incoming.questions.some(item => item.id === question.id))) {
    return current;
  }
  return incoming;
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
  sampleAnswer: SampleInterviewAnswer | null;
} {
  return {
    scores: Array.isArray(evaluation?.scores) ? evaluation.scores : [],
    feedback: evaluation?.feedback || '',
    scoreScale: evaluation?.scoreScale || SCORE_SCALE,
    star: evaluation?.star || null,
    strengths: Array.isArray(evaluation?.strengths) ? evaluation.strengths : [],
    improvements: Array.isArray(evaluation?.improvements) ? evaluation.improvements : [],
    improvedAnswer: evaluation?.improvedAnswer || null,
    sampleAnswer: normalizeSampleInterviewAnswer(evaluation?.sampleAnswer),
  };
}

// --- B8 STAR practice contract (Nexora.Business.Ai.StarEvaluation) ---

export interface NormalizedStarComponent {
  score: number;
  detected: boolean;
  evidence: string;
  feedback: string;
}

export interface NormalizedStarEvaluation {
  applicable: boolean;
  overallScore: number | null;
  situation: NormalizedStarComponent | null;
  task: NormalizedStarComponent | null;
  action: NormalizedStarComponent | null;
  result: NormalizedStarComponent | null;
  missingElements: string[];
  strengths: string[];
  coachingTips: string[];
  scoreScale: string;
}

export const STAR_COMPONENT_ORDER = ['situation', 'task', 'action', 'result'] as const;
export type StarComponentKey = (typeof STAR_COMPONENT_ORDER)[number];

export const STAR_COMPONENT_LABELS: Record<StarComponentKey, string> = {
  situation: 'Situation',
  task: 'Task',
  action: 'Action',
  result: 'Result',
};

const normalizeStarPracticeComponent = (value: unknown): NormalizedStarComponent | null => {
  const record = asRecord(value);
  if (!record) return null;
  const normalized = normalizeStarComponent({
    score: asNumber(record.score),
    ...(typeof record.detected === 'boolean' ? { detected: record.detected } : {}),
    ...(typeof record.evidence === 'string' ? { evidence: record.evidence } : {}),
    feedback: asString(record.feedback),
  });
  return {
    score: normalized.score,
    detected: normalized.detected,
    evidence: normalized.evidence,
    feedback: normalized.feedback,
  };
};

/**
 * Null-safe normalization for the backend STAR-practice evaluation
 * (`Nexora.Business.Ai.StarEvaluation`). Returns null when the payload is absent
 * or lacks the `applicable` discriminator so the UI renders a neutral state
 * rather than crashing. Backend scores are preserved verbatim; the "0-100" scale
 * is never transformed and components are never reweighted client-side.
 */
export function normalizeStarPracticeEvaluation(raw: unknown): NormalizedStarEvaluation | null {
  const record = asRecord(raw);
  if (!record || typeof record.applicable !== 'boolean') return null;

  return {
    applicable: record.applicable,
    overallScore: typeof record.overallScore === 'number' && Number.isFinite(record.overallScore)
      ? record.overallScore
      : null,
    situation: normalizeStarPracticeComponent(record.situation),
    task: normalizeStarPracticeComponent(record.task),
    action: normalizeStarPracticeComponent(record.action),
    result: normalizeStarPracticeComponent(record.result),
    missingElements: normalizeStringCollection(record.missingElements),
    strengths: normalizeStringCollection(record.strengths),
    coachingTips: normalizeStringCollection(record.coachingTips),
    scoreScale: typeof record.scoreScale === 'string' && record.scoreScale
      ? record.scoreScale
      : SCORE_SCALE,
  };
}

/**
 * Ordered, null-safe list of the STAR components the backend actually returned.
 * Never fabricates a component the backend omitted.
 */
export function listStarComponents(
  evaluation: NormalizedStarEvaluation
): Array<{ key: StarComponentKey; component: NormalizedStarComponent }> {
  const result: Array<{ key: StarComponentKey; component: NormalizedStarComponent }> = [];
  for (const key of STAR_COMPONENT_ORDER) {
    const component = evaluation[key];
    if (component) result.push({ key, component });
  }
  return result;
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
    role?: string;
    seniority?: string;
    interviewType: string;
    difficulty: string;
    resumeId?: string;
    jobDescriptionId?: string;
    careerGoalId?: string;
  },
  idempotencyKey?: string
) {
  return {
    url: '/interviews',
    method: 'POST' as const,
    data: {
      ...(data.role ? { role: data.role.trim() } : {}),
      ...(data.seniority ? { seniority: data.seniority } : {}),
      interviewType: data.interviewType,
      difficulty: data.difficulty,
      ...(data.resumeId ? { resumeId: data.resumeId } : {}),
      ...(data.jobDescriptionId ? { jobDescriptionId: data.jobDescriptionId } : {}),
      ...(data.careerGoalId ? { careerGoalId: data.careerGoalId } : {}),
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
 * Builds canonical practice again request specification.
 */
export function buildPracticeAgainRequest(
  interviewId: string,
  data: {
    questionId?: string;
    focus: string;
    reason: 'repeat_question' | 'rubric_weakness' | 'recommendation' | 'manual';
  },
  idempotencyKey?: string
) {
  return {
    url: `/interviews/${interviewId}/practice-again`,
    method: 'POST' as const,
    data: {
      ...(data.questionId ? { questionId: data.questionId } : {}),
      focus: data.focus,
      reason: data.reason,
    },
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

/**
 * Builds canonical question preparation retry request specification.
 */
export function buildRetryQuestionPreparationRequest(interviewId: string, idempotencyKey?: string) {
  return {
    url: `/interviews/${interviewId}/questions/retry`,
    method: 'POST' as const,
    data: {},
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}

/**
 * Builds canonical results retry request specification.
 */
export function buildRetryResultsRequest(interviewId: string, idempotencyKey?: string) {
  return {
    url: `/interviews/${interviewId}/results/retry`,
    method: 'POST' as const,
    data: {},
    headers: {
      'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
    },
  };
}

export interface CanonicalStartPayload {
  role?: string;
  seniority?: string;
  interviewType: InterviewType;
  difficulty: string;
  resumeId?: string;
  jobDescriptionId?: string;
  careerGoalId?: string;
}

export type InterviewPreflightMode = 'career_goal' | 'manual';

export function resolveCvTargetedResumeId(params: {
  selectedResumeId?: string;
  primaryResumeId?: string;
  readyResumeIds: string[];
}): string {
  const { selectedResumeId, primaryResumeId, readyResumeIds } = params;

  // Preserve an explicit selection so a resume that later becomes stale fails validation.
  if (selectedResumeId) return selectedResumeId;
  if (primaryResumeId && readyResumeIds.includes(primaryResumeId)) return primaryResumeId;
  return readyResumeIds[0] || '';
}

export function isReadyResumeSelection(
  resumeId: string | undefined,
  readyResumeIds: string[]
): boolean {
  return Boolean(resumeId && readyResumeIds.includes(resumeId));
}

/**
 * Builds the preflight command without duplicating backend Career Goal/Profile fallbacks.
 * Role/seniority are explicit only in manual mode; resume is explicit only for CV-targeted.
 */
export function buildInterviewPreflightPayload(params: {
  mode: InterviewPreflightMode;
  careerGoalId?: string;
  manualRole?: string;
  manualSeniority?: string;
  interviewType: InterviewType;
  difficulty: string;
  cvTargetedResumeId?: string;
  jobDescriptionId?: string;
}): CanonicalStartPayload {
  const shared = {
    interviewType: params.interviewType,
    difficulty: params.difficulty,
    ...(params.interviewType === 'cv_targeted' && params.cvTargetedResumeId
      ? { resumeId: params.cvTargetedResumeId }
      : {}),
    ...(params.interviewType === 'jd_targeted' && params.jobDescriptionId
      ? { jobDescriptionId: params.jobDescriptionId }
      : {}),
  };

  if (params.mode === 'career_goal') {
    return {
      ...shared,
      ...(params.careerGoalId ? { careerGoalId: params.careerGoalId } : {}),
    };
  }

  return {
    ...shared,
    ...(params.manualRole ? { role: params.manualRole.trim() } : {}),
    ...(params.manualSeniority ? { seniority: params.manualSeniority } : {}),
  };
}

export type InterviewReportRenderState =
  | 'loading'
  | 'failed'
  | 'unavailable'
  | 'polling_exhausted'
  | 'processing'
  | 'ready';

/** A missing report never implies readiness while the interview is transitioning. */
export function getInterviewReportRenderState(params: {
  loading: boolean;
  failed: boolean;
  unavailable: boolean;
  hasReport: boolean;
  pollingBoundExhausted: boolean;
  processing: boolean;
}): InterviewReportRenderState {
  if (params.loading) return 'loading';
  if (params.failed) return 'failed';
  if (params.hasReport) return 'ready';
  if (params.unavailable) return 'unavailable';
  if (params.pollingBoundExhausted) return 'polling_exhausted';
  if (params.processing) return 'processing';
  return 'loading';
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
    (a.role || '').trim() === (b.role || '').trim() &&
    (a.seniority || '') === (b.seniority || '') &&
    a.interviewType === b.interviewType &&
    a.difficulty === b.difficulty &&
    (a.resumeId || undefined) === (b.resumeId || undefined) &&
    (a.jobDescriptionId || undefined) === (b.jobDescriptionId || undefined) &&
    (a.careerGoalId || undefined) === (b.careerGoalId || undefined)
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
    ...(candidatePayload.role ? { role: candidatePayload.role.trim() } : {}),
    ...(candidatePayload.seniority ? { seniority: candidatePayload.seniority } : {}),
    interviewType: candidatePayload.interviewType,
    difficulty: candidatePayload.difficulty,
    ...(candidatePayload.resumeId ? { resumeId: candidatePayload.resumeId } : {}),
    ...(candidatePayload.jobDescriptionId ? { jobDescriptionId: candidatePayload.jobDescriptionId } : {}),
    ...(candidatePayload.careerGoalId ? { careerGoalId: candidatePayload.careerGoalId } : {}),
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
