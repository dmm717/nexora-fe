import { apiClient } from './apiClient';

export interface SkillProfileSourceResponse {
  sourceType: string;
  evidenceCount: number;
  latestEvidenceAt: string;
}

export interface SkillProfileCompetencyResponse {
  code: string;
  name: string;
  category: string;
  score: number;
  evidenceCount: number;
  latestEvidenceAt: string;
  sources: SkillProfileSourceResponse[];
}

export interface SkillProfileWeaknessSignalResponse {
  sourceType: string;
  label: string;
  latestEvidenceAt: string;
}

export interface SkillProfileResponse {
  competencies: SkillProfileCompetencyResponse[];
  weaknessSignals: SkillProfileWeaknessSignalResponse[];
}

export const skillProfileApi = {
  getProfile: async (): Promise<SkillProfileResponse> => {
    const response = (await apiClient.get('/skill-profile')) as { data: SkillProfileResponse };
    return response.data;
  }
};
