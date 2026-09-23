import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/services/billingApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const billingPlanKeys = {
  all: ['billingPlans'] as const,
};

export const useBillingPlans = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: billingPlanKeys.all,
    queryFn: () => billingApi.getPlans(),
    staleTime: 5 * 60 * 1000,
    enabled: authReady && isAuthenticated,
    refetchOnWindowFocus: false,
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: billingPlanKeys.all,
    queryFn: () => billingApi.getPlans(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useOrderStatus = (orderId: string, refetchInterval?: number | false) => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['orderStatus', orderId],
    queryFn: () => billingApi.getOrderStatus(orderId),
    staleTime: 0,
    enabled: authReady && isAuthenticated && !!orderId,
    refetchInterval,
  });
}
