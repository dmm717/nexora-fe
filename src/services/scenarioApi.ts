import { apiClient } from './apiClient';
import type {
  ScenarioCategory,
  ScenarioCard,
  ScenarioDetail,
  ScenarioAttempt,
  ScenarioAttemptHistory,
  ScenarioProgress,
  ScenarioFilterParams,
  ScenarioPageResponse,
  ScenarioEvaluation,
  ScenarioDimensionEvaluation,
} from '@/types/scenario';
import { generateIdempotencyKey } from '@/utils/scenarioHelpers';

// Re-export types for backward compatibility
export type {
  ScenarioCategory,
  ScenarioCard,
  ScenarioDetail,
  ScenarioAttempt,
  ScenarioAttemptHistory,
  ScenarioProgress,
  ScenarioFilterParams,
  ScenarioPageResponse,
  ScenarioEvaluation,
  ScenarioDimensionEvaluation,
};

// Backward compatibility aliases
export type ScenarioView = ScenarioDetail;
export type ScenarioAttemptResponse = ScenarioAttempt;
export type ScenarioEvaluationResult = ScenarioEvaluation;

export interface ScenarioAttemptCreateRequest {
  scenarioId: string;
}

export interface ScenarioAttemptSubmitRequest {
  answer: string;
}

export {
  generateIdempotencyKey,
  getOrCreateScenarioCreateIntent,
  getOrCreateScenarioSubmitIntent,
  type CanonicalScenarioCreatePayload,
  type ScenarioCreateIntent,
  type CanonicalScenarioSubmitPayload,
  type ScenarioSubmitIntent,
} from '@/utils/scenarioHelpers';

export const scenarioApi = {
  getCategories: async (): Promise<ScenarioCategory[]> => {
    const response = (await apiClient.get('/scenarios/categories')) as {
      data: ScenarioCategory[];
    };
    return response.data || [];
  },

  getScenarios: async (params?: ScenarioFilterParams): Promise<ScenarioPageResponse> => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.competency) query.set('competency', params.competency);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());

    const qs = query.toString();
    const endpoint = qs ? `/scenarios?${qs}` : '/scenarios';
    const response = (await apiClient.get(endpoint)) as {
      data: ScenarioPageResponse | ScenarioCard[];
    };

    if (Array.isArray(response.data)) {
      return { total: response.data.length, items: response.data };
    }
    return response.data || { total: 0, items: [] };
  },

  getScenarioDetails: async (idOrSlug: string): Promise<ScenarioDetail> => {
    const response = (await apiClient.get(`/scenarios/${idOrSlug}`)) as {
      data: ScenarioDetail;
    };
    return response.data;
  },

  createAttempt: async (
    scenarioIdOrRequest: string | ScenarioAttemptCreateRequest,
    idempotencyKey?: string
  ): Promise<ScenarioAttempt> => {
    const scenarioId =
      typeof scenarioIdOrRequest === 'string'
        ? scenarioIdOrRequest
        : scenarioIdOrRequest.scenarioId;
    const key = idempotencyKey || generateIdempotencyKey();
    const response = (await apiClient.post(
      '/scenario-attempts',
      { scenarioId },
      { headers: { 'Idempotency-Key': key } }
    )) as { data: ScenarioAttempt };
    return response.data;
  },

  submitAttempt: async (
    attemptId: string,
    answerOrRequest: string | ScenarioAttemptSubmitRequest,
    idempotencyKey?: string
  ): Promise<ScenarioAttempt> => {
    const rawAnswer =
      typeof answerOrRequest === 'string'
        ? answerOrRequest
        : answerOrRequest.answer;
    const answer = (rawAnswer || '').trim();
    const key = idempotencyKey || generateIdempotencyKey();
    const response = (await apiClient.post(
      `/scenario-attempts/${attemptId}/submit`,
      { answer },
      { headers: { 'Idempotency-Key': key } }
    )) as { data: ScenarioAttempt };
    return response.data;
  },

  getAttempt: async (id: string): Promise<ScenarioAttempt> => {
    const response = (await apiClient.get(`/scenario-attempts/${id}`)) as {
      data: ScenarioAttempt;
    };
    return response.data;
  },

  getAttemptHistory: async (idOrSlug: string): Promise<ScenarioAttemptHistory> => {
    const response = (await apiClient.get(`/scenarios/${idOrSlug}/attempts`)) as {
      data: ScenarioAttemptHistory;
    };
    return response.data;
  },

  retryScenario: async (scenarioId: string, idempotencyKey?: string): Promise<ScenarioAttempt> => {
    const key = idempotencyKey || generateIdempotencyKey();
    const response = (await apiClient.post(
      `/scenarios/${scenarioId}/retry`,
      {},
      { headers: { 'Idempotency-Key': key } }
    )) as { data: ScenarioAttempt };
    return response.data;
  },

  getProgress: async (): Promise<ScenarioProgress> => {
    const response = (await apiClient.get('/scenarios/progress')) as {
      data: ScenarioProgress;
    };
    return response.data;
  },

  listAttempts: async (): Promise<ScenarioAttempt[]> => {
    const response = (await apiClient.get('/scenario-attempts')) as {
      data: ScenarioAttempt[];
    };
    return response.data;
  },
};
