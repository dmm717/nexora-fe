import { apiClient } from './apiClient';
import {
  generateIdempotencyKey,
  getOrCreateStarAttemptIntent,
  type CanonicalStarPayload,
  type StarAttemptIntent,
} from '@/utils/scenarioHelpers';

export {
  generateIdempotencyKey,
  getOrCreateStarAttemptIntent,
  type CanonicalStarPayload,
  type StarAttemptIntent,
};
import {
  normalizeStarPracticeEvaluation,
  type NormalizedStarEvaluation,
} from './interviewContract';

export type { NormalizedStarEvaluation } from './interviewContract';

/**
 * Backend lifecycle statuses emitted by `Nexora.Business.Practice`.
 * STAR attempts are created as `queued`, then move to `processing`, then
 * `completed` or `failed`. `draft` is included for fail-safety.
 */
export type StarAttemptStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export interface StarAttemptRequest {
  question: string;
  answer: string;
}

/** Mirrors the backend `StarAttemptResponse` DTO exactly. */
export interface StarAttemptResponse {
  id: string;
  question: string;
  answer: string;
  status: StarAttemptStatus | string;
  evaluation: NormalizedStarEvaluation | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Normalizes an untrusted STAR attempt wire payload. Evaluation is normalized
 * through the shared B8 contract so `detected=false` renders as score 0 with
 * blank evidence and no component is ever fabricated.
 */
export function normalizeStarAttemptResponse(raw: unknown): StarAttemptResponse {
  const record = isRecord(raw) ? raw : {};
  return {
    id: typeof record.id === 'string' ? record.id : '',
    question: typeof record.question === 'string' ? record.question : '',
    answer: typeof record.answer === 'string' ? record.answer : '',
    status: typeof record.status === 'string' ? record.status : 'failed',
    evaluation: normalizeStarPracticeEvaluation(record.evaluation),
    errorCode: typeof record.errorCode === 'string' ? record.errorCode : null,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    completedAt: typeof record.completedAt === 'string' ? record.completedAt : null,
  };
}

export const starBuilderApi = {
  submitAttempt: async (
    data: StarAttemptRequest,
    idempotencyKey?: string
  ): Promise<StarAttemptResponse> => {
    const response = (await apiClient.post(
      '/star-attempts',
      {
        question: data.question.trim(),
        answer: data.answer.trim(),
      },
      { headers: { 'Idempotency-Key': idempotencyKey || generateIdempotencyKey() } }
    )) as { data: unknown };
    return normalizeStarAttemptResponse(response.data);
  },

  getAttempt: async (attemptId: string): Promise<StarAttemptResponse> => {
    const response = (await apiClient.get(`/star-attempts/${attemptId}`)) as { data: unknown };
    return normalizeStarAttemptResponse(response.data);
  },

  listRecentAttempts: async (): Promise<StarAttemptResponse[]> => {
    const response = (await apiClient.get('/star-attempts')) as { data: unknown };
    return Array.isArray(response.data)
      ? response.data.map(normalizeStarAttemptResponse)
      : [];
  },
};
