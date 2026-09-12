import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { toast } from 'sonner';

export const adminPlanKeys = {
  all: ['adminPlans'] as const,
  lists: () => [...adminPlanKeys.all, 'list'] as const,
  details: () => [...adminPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminPlanKeys.details(), id] as const,
  features: ['adminFeatureDefinitions'] as const,
};

export function useAdminPlans() {
  return useQuery({
    queryKey: adminPlanKeys.lists(),
    queryFn: adminApi.getPlans,
  });
}

export function useAdminFeatureDefinitions() {
  return useQuery({
    queryKey: adminPlanKeys.features,
    queryFn: adminApi.getFeatureDefinitions as () => Promise<{ id: string; code: string; name: string; description: string; isActive: boolean; sortOrder: number }[]>,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createPlan(data),
    onSuccess: () => {
      toast.success('Đã tạo gói cước mới thành công!');
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi tạo gói cước.'),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.updatePlan(id, data),
    onSuccess: (_, variables) => {
      toast.success('Đã cập nhật gói cước thành công!');
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.detail(variables.id) });
    },
    onError: () => toast.error('Lỗi khi cập nhật gói cước.'),
  });
}

export function useAddPlanPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Record<string, unknown> }) => adminApi.createPlanPrice(planId, data),
    onSuccess: () => {
      toast.success('Đã thêm mức giá mới thành công!');
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi thêm mức giá.'),
  });
}

export function useUpdatePlanPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ priceId, data }: { priceId: string; data: Record<string, unknown> }) => adminApi.updatePlanPrice(priceId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật giá thành công!');
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi cập nhật giá.'),
  });
}

export function useUpdatePlanPriceFeatures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ priceId, data }: { priceId: string; data: Record<string, unknown> }) => adminApi.updatePlanFeatures(priceId, data),
    onSuccess: () => {
      toast.success('Đã cấu hình quyền lợi thành công!');
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi cấu hình quyền lợi.'),
  });
}
