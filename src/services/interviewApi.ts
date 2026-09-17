import { apiClient, PaginatedResponse } from './apiClient';
import {
  buildStartInterviewRequest,
  buildSubmitAnswerRequest,
  buildContinueInterviewRequest,
  buildCompleteInterviewRequest,
  buildRetryReportRequest,
  buildPracticeAgainRequest,
  normalizeReportView,
  type InterviewView,
  type InterviewHistoryItem,
  type AnswerResult,
  type ReportView,
  type InterviewType,
} from './interviewContract';

export * from './interviewContract';

export interface StartInterviewCommand {
  role?: string;
  seniority?: string;
  interviewType: InterviewType;
  difficulty: string;
  resumeId?: string;
  jobDescriptionId?: string;
  careerGoalId?: string;
}

export interface PracticeAgainCommand {
  questionId?: string;
  focus: string;
  reason: 'repeat_question' | 'rubric_weakness' | 'recommendation' | 'manual';
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

  getInterviews: async (page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<InterviewHistoryItem>> => {
    const response = (await apiClient.get(`/interviews?page=${page}&pageSize=${pageSize}`)) as { data: PaginatedResponse<InterviewHistoryItem> };
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

  practiceAgain: async (id: string, data: PracticeAgainCommand, idempotencyKey?: string): Promise<InterviewView> => {
    const req = buildPracticeAgainRequest(id, data, idempotencyKey);
    const response = (await apiClient.post(req.url, req.data, {
      headers: req.headers,
    })) as { data: InterviewView };
    return response.data;
  },

  getReport: async (id: string): Promise<ReportView> => {
    const response = (await apiClient.get(`/interviews/${id}/report`)) as { data: unknown };
    return normalizeReportView(response.data);
  },
};
