import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/services/billingApi';

export const useBillingPlans = () => {
  return useQuery({
    queryKey: ['billingPlans'],
    queryFn: () => billingApi.getPlans(),
    staleTime: Infinity,
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => billingApi.getPlans(),
  });
};

export const useOrderStatus = (orderId: string, refetchInterval?: number | false) => {
  return useQuery({
    queryKey: ['orderStatus', orderId],
    queryFn: () => billingApi.getOrderStatus(orderId),
    staleTime: 0,
    enabled: !!orderId,
    refetchInterval,
  });
}
