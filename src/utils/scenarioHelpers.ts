/**
 * Pure helper utilities for Scenario Academy v2
 */

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
