import { apiClient } from './apiClient';
import {
  buildStartInterviewRequest,
  buildSubmitAnswerRequest,
  buildContinueInterviewRequest,
  buildCompleteInterviewRequest,
  buildRetryReportRequest,
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
    const req = buildStartInterviewRequest(data, idempotencyKey);
    const response = (await apiClient.post(req.url, req.data, {
      headers: req.headers,
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
    const req = buildSubmitAnswerRequest(id, data, idempotencyKey);
    const response = (await apiClient.post(req.url, req.data, {
      headers: req.headers,
    })) as { data: AnswerResult };
    return response.data;
  },

  continue: async (id: string, idempotencyKey?: string): Promise<InterviewView> => {
    const req = buildContinueInterviewRequest(id, idempotencyKey);
    const response = (await apiClient.post(req.url, req.data, {
      headers: req.headers,
    })) as { data: InterviewView };
    return response.data;
  },

  complete: async (id: string, idempotencyKey?: string): Promise<InterviewView> => {
    const req = buildCompleteInterviewRequest(id, idempotencyKey);
    const response = (await apiClient.post(req.url, req.data, {
      headers: req.headers,
    })) as { data: InterviewView };
    return response.data;
  },

  retryReport: async (id: string, idempotencyKey?: string): Promise<InterviewView> => {
    const req = buildRetryReportRequest(id, idempotencyKey);
    const response = (await apiClient.post(req.url, req.data, {
      headers: req.headers,
    })) as { data: InterviewView };
    return response.data;
  },

  getReport: async (id: string): Promise<ReportView> => {
    const response = (await apiClient.get(`/interviews/${id}/report`)) as { data: ReportView };
    return response.data;
  },
};
