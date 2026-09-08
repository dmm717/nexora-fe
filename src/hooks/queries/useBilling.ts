import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/services/billingApi';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';

export const useBillingPlans = () => {
  const { authReady, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['billingPlans'],
    queryFn: () => billingApi.getPlans(),
    staleTime: Infinity,
    enabled: authReady && isAuthenticated,
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => billingApi.getPlans(),
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
