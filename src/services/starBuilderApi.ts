import { apiClient } from './apiClient';

export interface StarAttemptRequest {
  question: string;
  answer: string;
}

export interface StarEvaluation {
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

export interface StarAttemptResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorCode?: string;
  evaluation?: StarEvaluation;
}

export const starBuilderApi = {
  submitAttempt: async (data: StarAttemptRequest) => {
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      question: data.question,
      answer: data.answer
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
