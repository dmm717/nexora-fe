import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { toast } from 'sonner';

export const adminScenarioKeys = {
  all: ['adminScenarios'] as const,
  lists: () => [...adminScenarioKeys.all, 'list'] as const,
  categories: ['adminScenarioCategories'] as const,
};

// --- Categories ---
export function useAdminScenarioCategories() {
  return useQuery({
    queryKey: adminScenarioKeys.categories,
    queryFn: adminApi.getScenarioCategories,
  });
}

export function useCreateScenarioCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createScenarioCategory(data),
    onSuccess: () => {
      toast.success('Đã tạo danh mục mới thành công!');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.categories });
    },
    onError: () => toast.error('Lỗi khi tạo danh mục.'),
  });
}

export function useUpdateScenarioCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.updateScenarioCategory(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật danh mục thành công!');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.categories });
    },
    onError: () => toast.error('Lỗi khi cập nhật danh mục.'),
  });
}

// --- Scenarios ---
export function useAdminScenarios() {
  return useQuery({
    queryKey: adminScenarioKeys.lists(),
    queryFn: adminApi.getScenarios,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createScenario(data),
    onSuccess: () => {
      toast.success('Đã tạo kịch bản mới thành công!');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi tạo kịch bản.'),
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.updateScenario(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật kịch bản thành công!');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi cập nhật kịch bản.'),
  });
}

export function usePublishScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.publishScenario(id),
    onSuccess: () => {
      toast.success('Đã đăng tải kịch bản thành công!');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi đăng kịch bản.'),
  });
}

export function useArchiveScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.archiveScenario(id),
    onSuccess: () => {
      toast.success('Đã lưu trữ kịch bản thành công!');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Lỗi khi lưu trữ kịch bản.'),
  });
}
