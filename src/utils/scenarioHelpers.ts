/**
 * Pure helper utilities for Scenario Academy v2
 */

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ---------------------------------------------------------------------------
// Stable Idempotency Intents (B7 / B8 retry resilience)
// ---------------------------------------------------------------------------

export interface CanonicalStarPayload {
  question: string;
  answer: string;
}

export interface StarAttemptIntent {
  key: string;
  payload: CanonicalStarPayload;
}

export function getOrCreateStarAttemptIntent(
  previous: StarAttemptIntent | null | undefined,
  candidate: { question: string; answer: string }
): StarAttemptIntent {
  const question = candidate.question.trim();
  const answer = candidate.answer.trim();
  if (
    previous &&
    previous.payload.question === question &&
    previous.payload.answer === answer
  ) {
    return previous;
  }
  return {
    key: generateIdempotencyKey(),
    payload: { question, answer },
  };
}

export interface CanonicalScenarioCreatePayload {
  scenarioId: string;
}

export interface ScenarioCreateIntent {
  key: string;
  payload: CanonicalScenarioCreatePayload;
}

export function getOrCreateScenarioCreateIntent(
  previous: ScenarioCreateIntent | null | undefined,
  scenarioId: string
): ScenarioCreateIntent {
  if (previous && previous.payload.scenarioId === scenarioId) {
    return previous;
  }
  return {
    key: generateIdempotencyKey(),
    payload: { scenarioId },
  };
}

export interface CanonicalScenarioSubmitPayload {
  attemptId: string;
  answer: string;
}

export interface ScenarioSubmitIntent {
  key: string;
  payload: CanonicalScenarioSubmitPayload;
}

export function getOrCreateScenarioSubmitIntent(
  previous: ScenarioSubmitIntent | null | undefined,
  candidate: { attemptId: string; answer: string }
): ScenarioSubmitIntent {
  const answer = candidate.answer.trim();
  if (
    previous &&
    previous.payload.attemptId === candidate.attemptId &&
    previous.payload.answer === answer
  ) {
    return previous;
  }
  return {
    key: generateIdempotencyKey(),
    payload: { attemptId: candidate.attemptId, answer },
  };
}

// ---------------------------------------------------------------------------
// Pure State-Transition Helpers for Attempt Workflows
// ---------------------------------------------------------------------------

export interface ScenarioAttemptFlowState {
  scenarioId: string;
  createIntent: ScenarioCreateIntent | null;
  attemptId: string | null;
  submitIntent: ScenarioSubmitIntent | null;
}

export function initScenarioFlowState(scenarioId: string): ScenarioAttemptFlowState {
  return {
    scenarioId,
    createIntent: null,
    attemptId: null,
    submitIntent: null,
  };
}

export function prepareScenarioCreateStep(
  state: ScenarioAttemptFlowState
): { state: ScenarioAttemptFlowState; intent: ScenarioCreateIntent } {
  const intent = getOrCreateScenarioCreateIntent(state.createIntent, state.scenarioId);
  return {
    state: { ...state, createIntent: intent },
    intent,
  };
}

export function recordScenarioCreateSuccess(
  state: ScenarioAttemptFlowState,
  attemptId: string
): ScenarioAttemptFlowState {
  return {
    ...state,
    createIntent: null,
    attemptId,
  };
}

export function prepareScenarioSubmitStep(
  state: ScenarioAttemptFlowState,
  rawAnswer: string
): { state: ScenarioAttemptFlowState; intent: ScenarioSubmitIntent } {
  if (!state.attemptId) {
    throw new Error('Cannot submit scenario without an attempt ID');
  }
  const intent = getOrCreateScenarioSubmitIntent(state.submitIntent, {
    attemptId: state.attemptId,
    answer: rawAnswer,
  });
  return {
    state: { ...state, submitIntent: intent },
    intent,
  };
}

export function recordScenarioSubmitSuccess(
  state: ScenarioAttemptFlowState
): ScenarioAttemptFlowState {
  return {
    ...state,
    submitIntent: null,
  };
}

export interface StarFlowState {
  intent: StarAttemptIntent | null;
  attemptId: string | null;
}

export function initStarFlowState(): StarFlowState {
  return {
    intent: null,
    attemptId: null,
  };
}

export function prepareStarSubmitStep(
  state: StarFlowState,
  payload: { question: string; answer: string }
): { state: StarFlowState; intent: StarAttemptIntent } {
  const intent = getOrCreateStarAttemptIntent(state.intent, payload);
  return {
    state: { ...state, intent },
    intent,
  };
}

export function recordStarSubmitSuccess(
  state: StarFlowState,
  attemptId: string
): StarFlowState {
  return {
    intent: null,
    attemptId,
  };
}


export const SCENARIO_PAGE_SIZE = 20;
export const SCENARIO_MAX_PAGE_SIZE = 50;

export interface PaginationResult {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  shouldShowPagination: boolean;
}

export function calculatePagination(
  total: number,
  page: number = 1,
  pageSize: number = SCENARIO_PAGE_SIZE
): PaginationResult {
  const safeTotal = Math.max(0, total);
  const safePageSize = Math.min(SCENARIO_MAX_PAGE_SIZE, Math.max(1, pageSize));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  return {
    currentPage,
    totalPages,
    pageSize: safePageSize,
    total: safeTotal,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    shouldShowPagination: safeTotal > safePageSize,
  };
}

export type ScoreDeltaType = 'positive' | 'negative' | 'neutral' | 'baseline' | 'none';

export interface ScoreDeltaDisplay {
  type: ScoreDeltaType;
  text: string;
}

export function getHistoryScoreDelta(
  scoreDelta: number | null | undefined,
  overallScore: number | null | undefined,
  isFirstScoredAttempt: boolean = false
): ScoreDeltaDisplay {
  if (scoreDelta !== null && scoreDelta !== undefined) {
    if (scoreDelta > 0) return { type: 'positive', text: `+${scoreDelta}` };
    if (scoreDelta < 0) return { type: 'negative', text: `${scoreDelta}` };
    return { type: 'neutral', text: '±0' };
  }

  if (isFirstScoredAttempt && overallScore !== null && overallScore !== undefined) {
    return { type: 'baseline', text: 'Khởi điểm' };
  }

  return { type: 'none', text: '--' };
}

export function getRealtimeInvalidationKeys(
  resourceType: string,
  resourceId: string
): Array<string[]> {
  switch (resourceType.toLowerCase()) {
    case 'scenarioattempt':
      return [
        ['scenarioAttempt', resourceId],
        ['scenarioHistory'],
        ['scenarioProgress'],
      ];
    case 'starattempt':
      return [['starAttempt', resourceId]];
    default:
      return [];
  }
}

export function isTerminalAttemptStatus(status: string | null | undefined): boolean {
  const normalized = status?.toLowerCase();
  return normalized === 'completed' || normalized === 'failed';
}

/**
 * Keeps catalogue/progress errors user-facing without leaking arbitrary
 * transport or provider exception text into the Scenario UI.
 */
export function getScenarioErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (!error || typeof error !== 'object') return fallback;

  const value = error as { name?: unknown; message?: unknown };
  return value.name === 'ApiError' && typeof value.message === 'string' && value.message.trim()
    ? value.message
    : fallback;
}

export type ContentBlock =
  | { type: 'h3'; content: string }
  | { type: 'h4'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'p'; content: string };

/**
 * Parses simple markdown lines into structured blocks, grouping bullet items into a single list
 */
export function parseMarkdownBlocks(text: string): ContentBlock[] {
  if (!text) return [];

  const lines = text.split('\n');
  const blocks: ContentBlock[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('- ')) {
      currentList.push(trimmed.replace(/^- \s*/, ''));
      continue;
    }

    flushList();

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h3', content: trimmed.replace(/^# \s*/, '') });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h4', content: trimmed.replace(/^## \s*/, '') });
    } else {
      blocks.push({ type: 'p', content: trimmed });
    }
  }

  flushList();
  return blocks;
}
