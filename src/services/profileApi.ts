import { apiClient } from './apiClient';
import type { ResumeView } from './cvAnalysisApi';

export interface CareerProfileResponse {
  profile: {
    userId: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
  };
  primaryResume?: {
    id: string;
    fileName: string;
    status: string;
    createdAt: string;
    latestAnalysis?: {
      id: string;
      mode: string;
      status: string;
      createdAt: string;
    };
  };
  activeCareerGoal?: {
    id: string;
    targetRole: string;
    seniority: string;
    industry?: string;
    targetCompany?: string;
    targetDate?: string;
    active: boolean;
  };
  skillProfileSummary: {
    topCompetencies: Array<{
      code: string;
      name: string;
      category: string;
      score: number;
      evidenceCount: number;
    }>;
    topWeaknessSignals: Array<{
      sourceType: string;
      label: string;
      latestEvidenceAt: string;
    }>;
  };
  learningPath?: {
    id: string;
    status: string;
    pendingActivityCount: number;
    completedActivityCount: number;
  };
  onboarding: {
    hasPrimaryResume: boolean;
    hasActiveCareerGoal: boolean;
    isComplete: boolean;
  };
}

export const profileApi = {
  getCareerProfile: async () => {
    const response = await apiClient.get('/me/career-profile') as { data: CareerProfileResponse };
    return response.data;
  },
  getResumes: async () => {
    const response = await apiClient.get('/resumes') as { data: ResumeView[] };
    return response.data;
  },
  setPrimaryResume: async (resumeId: string | null) => {
    const response = await apiClient.put('/me/primary-resume', { resumeId }) as { data: unknown };
    return response.data;
  }
};
