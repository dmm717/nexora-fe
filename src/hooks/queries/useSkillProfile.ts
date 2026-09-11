import { useQuery } from '@tanstack/react-query';
import { skillProfileApi } from '@/services/skillProfileApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const SKILL_PROFILE_QUERY_KEY = ['skillProfile'] as const;

export type { SkillProfileResponse } from '@/services/skillProfileApi';

export const useSkillProfile = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: SKILL_PROFILE_QUERY_KEY,
    queryFn: () => skillProfileApi.getProfile(),
    staleTime: 30 * 1000,
    enabled: authReady && isAuthenticated,
  });
};
