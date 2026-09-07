import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/services/healthApi';

export const useHealthLiveness = () => {
  return useQuery({
    queryKey: ['healthLiveness'],
    queryFn: () => healthApi.getLiveness(),
    refetchInterval: 30000,
  });
};

export const useHealthReadiness = () => {
  return useQuery({
    queryKey: ['healthReadiness'],
    queryFn: () => healthApi.getReadiness(),
    refetchInterval: 30000,
  });
};

export const useHealthOperations = () => {
  return useQuery({
    queryKey: ['healthOperations'],
    queryFn: () => healthApi.getOperations(),
    refetchInterval: 30000,
  });
};
