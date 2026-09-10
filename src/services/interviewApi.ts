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
  kind?: string;
  topic?: string;
  parentQuestionId?: string;
  content: string;
  createdAt: string;
}

export interface StarEvaluationComponent {
  score: number;
  detected?: boolean;
  evidence?: string;
  feedback: string;
}

export interface StarEvaluation {
  applicable: boolean;
  overallScore?: number;
  situation?: StarEvaluationComponent;
  task?: StarEvaluationComponent;
  action?: StarEvaluationComponent;
  result?: StarEvaluationComponent;
  missingElements?: string[];
  strengths?: string[];
  coachingTips?: string[];
}

export interface AnswerView {
  id: string;
  questionId: string;
  content: string;
  durationSeconds?: number;
  evaluation?: {
    scores?: Array<{
      criterion: string;
      score: number;
      evidence?: string;
    }>;
    feedback?: string;
    scoreScale?: string;
    star?: StarEvaluation;
    strengths?: string[];
    improvements?: string[];
    improvedAnswer?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface InterviewContinuationView {
  state: 'in_progress' | 'upgrade_required' | 'max_questions_reached';
  canFinishNow: boolean;
  canUpgradeAndContinue: boolean;
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
  continuation?: InterviewContinuationView;
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
  continuation?: InterviewContinuationView;
}

export interface StarSummary {
  applicableAnswers?: number;
  averageScore: number;
  componentAverages?: Record<string, number>;
  strongestComponent: string;
  weakestComponent: string;
  recurringIssues: string[];
  coachingPriorities?: string[];
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
  starSummary?: StarSummary;
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

  continue: async (id: string) => {
    const response = await apiClient.post(`/interviews/${id}/continue`, {}, {
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
