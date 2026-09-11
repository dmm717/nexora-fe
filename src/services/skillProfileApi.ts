import { apiClient } from './apiClient';
import {
  normalizeSkillProfileResponse,
  type SkillProfileResponse,
  type SkillProfileCompetencyResponse,
  type SkillProfileSourceResponse,
  type SkillProfileWeaknessSignalResponse,
} from './skillProfileContract';

export type {
  SkillProfileResponse,
  SkillProfileCompetencyResponse,
  SkillProfileSourceResponse,
  SkillProfileWeaknessSignalResponse,
};

export { normalizeSkillProfileResponse } from './skillProfileContract';

export const skillProfileApi = {
  getProfile: async (): Promise<SkillProfileResponse> => {
    const response = (await apiClient.get('/skill-profile')) as { data: unknown };
    return normalizeSkillProfileResponse(response.data);
  },
};
