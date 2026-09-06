import { apiClient } from './apiClient';

export interface StarAttemptRequest {
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface StarAttemptResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  applicable: boolean;
  overallScore: number;
  situation?: { score: number; feedback: string };
  task?: { score: number; feedback: string };
  action?: { score: number; feedback: string };
  result?: { score: number; feedback: string };
  missingElements?: string[];
  strengths?: string[];
  coachingTips?: string[];
}

export const starBuilderApi = {
  submitAttempt: async (data: StarAttemptRequest) => {
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      question: data.question,
      answer: `Tình huống (Situation):\n${data.situation}\n\nNhiệm vụ (Task):\n${data.task}\n\nHành động (Action):\n${data.action}\n\nKết quả (Result):\n${data.result}`
    };
    const response = await apiClient.post('/star-attempts', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    }) as { data: StarAttemptResponse };
    return response.data;
  },

  getAttempt: async (attemptId: string) => {
    const response = await apiClient.get(`/star-attempts/${attemptId}`) as { data: StarAttemptResponse };
    return response.data;
  },

  listRecentAttempts: async () => {
    const response = await apiClient.get('/star-attempts') as { data: StarAttemptResponse[] };
    return response.data;
  }
};
