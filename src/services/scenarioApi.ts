import { apiClient } from './apiClient';

export interface ScenarioView {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  competency: string;
  estimatedMinutes: number;
  content?: string; // Only returned when fetching details
}

export interface ScenarioAttemptCreateRequest {
  scenarioId: string;
}

export interface ScenarioAttemptSubmitRequest {
  answer: string;
}

export interface ScenarioDimensionEvaluation {
  criterion: string;
  score: number;
  evidence: string;
  feedback: string;
}

export interface ScenarioEvaluationResult {
  overallScore: number;
  dimensions: ScenarioDimensionEvaluation[];
  strengths: string[];
  gaps: string[];
  recommendedApproach: string[];
  feedback: string;
}

export interface ScenarioAttemptResponse {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  status: 'active' | 'completed' | 'failed';
  answer?: string;
  evaluation?: ScenarioEvaluationResult;
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
}

export const scenarioApi = {
  getScenarios: async () => {
    const response = await apiClient.get('/scenarios') as { data: { items?: ScenarioView[] } | ScenarioView[] };
    return Array.isArray(response.data) ? response.data : (response.data?.items || []);
  },
  
  getScenarioDetails: async (idOrSlug: string) => {
    const response = await apiClient.get(`/scenarios/${idOrSlug}`) as { data: ScenarioView };
    return response.data;
  },
  
  createAttempt: async (data: ScenarioAttemptCreateRequest) => {
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
    const response = await apiClient.post('/scenario-attempts', data, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    }) as { data: ScenarioAttemptResponse };
    return response.data;
  },

  submitAttempt: async (id: string, data: ScenarioAttemptSubmitRequest) => {
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
    const response = await apiClient.post(`/scenario-attempts/${id}/submit`, data, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    }) as { data: ScenarioAttemptResponse };
    return response.data;
  },

  getAttempts: async () => {
    const response = await apiClient.get('/scenario-attempts') as { data: ScenarioAttemptResponse[] };
    return response.data;
  },

  getAttempt: async (id: string) => {
    const response = await apiClient.get(`/scenario-attempts/${id}`) as { data: ScenarioAttemptResponse };
    return response.data;
  }
};
