import { apiClient } from './apiClient';

export interface StartInterviewCommand {
  role: string;
  seniority: string;
  interviewType: string;
  difficulty: string;
  resumeId?: string;
  jobDescriptionId?: string;
}

export interface QuestionView {
  id: string;
  sequence: number;
  content: string;
  createdAt: string;
}

export interface AnswerView {
  id: string;
  questionId: string;
  content: string;
  durationSeconds?: number;
  evaluation?: Record<string, unknown>;
  createdAt: string;
}

export interface InterviewView {
  id: string;
  status: string;
  role: string;
  seniority: string;
  interviewType: string;
  difficulty: string;
  version: number;
  questions: QuestionView[];
  answers: AnswerView[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  content: string;
  durationSeconds?: number;
}

export interface AnswerResult {
  answer: AnswerView;
  nextQuestion?: QuestionView;
  isComplete: boolean;
}

export interface ReportView {
  id: string;
  interviewId: string;
  overallScore: number;
  rubric: Record<string, unknown>;
  strengths: Record<string, unknown>;
  gaps: Record<string, unknown>;
  actionPlan: Record<string, unknown>;
  disclaimer: string;
  createdAt: string;
}

// Helper to generate Idempotency-Key
const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback if randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const interviewApi = {
  start: async (data: StartInterviewCommand) => {
    const response = await apiClient.post('/interviews', data, {
      headers: {
        'Idempotency-Key': generateIdempotencyKey()
      }
    }) as { data: InterviewView };
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/interviews/${id}`) as { data: InterviewView };
    return response.data;
  },

  submitAnswer: async (id: string, data: SubmitAnswerRequest) => {
    const response = await apiClient.post(`/interviews/${id}/answers`, data, {
      headers: {
        'Idempotency-Key': generateIdempotencyKey()
      }
    }) as { data: AnswerResult };
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.post(`/interviews/${id}/complete`, {}, {
      headers: {
        'Idempotency-Key': generateIdempotencyKey()
      }
    }) as { data: InterviewView };
    return response.data;
  },

  getReport: async (id: string) => {
    const response = await apiClient.get(`/interviews/${id}/report`) as { data: ReportView };
    return response.data;
  },

};
