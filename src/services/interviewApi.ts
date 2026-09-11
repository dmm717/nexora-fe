import { apiClient } from './apiClient';
import {
  generateIdempotencyKey,
  type InterviewView,
  type AnswerResult,
  type ReportView,
} from './interviewContract';

export * from './interviewContract';

export interface StartInterviewCommand {
  role: string;
  seniority: string;
  interviewType: string;
  difficulty: string;
  resumeId?: string;
  jobDescriptionId?: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  content: string;
  durationSeconds?: number;
}

export const interviewApi = {
  start: async (data: StartInterviewCommand, idempotencyKey?: string): Promise<InterviewView> => {
    const response = (await apiClient.post('/interviews', data, {
      headers: {
        'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
      },
    })) as { data: InterviewView };
    return response.data;
  },

  getById: async (id: string): Promise<InterviewView> => {
    const response = (await apiClient.get(`/interviews/${id}`)) as { data: InterviewView };
    return response.data;
  },

  submitAnswer: async (
    id: string,
    data: SubmitAnswerRequest,
    idempotencyKey?: string
  ): Promise<AnswerResult> => {
    const response = (await apiClient.post(`/interviews/${id}/answers`, data, {
      headers: {
        'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
      },
    })) as { data: AnswerResult };
    return response.data;
  },

  continue: async (id: string, idempotencyKey?: string): Promise<InterviewView> => {
    const response = (await apiClient.post(
      `/interviews/${id}/continue`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
        },
      }
    )) as { data: InterviewView };
    return response.data;
  },

  complete: async (id: string, idempotencyKey?: string): Promise<InterviewView> => {
    const response = (await apiClient.post(
      `/interviews/${id}/complete`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
        },
      }
    )) as { data: InterviewView };
    return response.data;
  },

  retryReport: async (id: string, idempotencyKey?: string): Promise<InterviewView> => {
    const response = (await apiClient.post(
      `/interviews/${id}/report/retry`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
        },
      }
    )) as { data: InterviewView };
    return response.data;
  },

  getReport: async (id: string): Promise<ReportView> => {
    const response = (await apiClient.get(`/interviews/${id}/report`)) as { data: ReportView };
    return response.data;
  },
};
