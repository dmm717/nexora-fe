import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '@/services/adminApi';

export const adminScenarioKeys = {
  all: ['adminScenarios'] as const,
  lists: () => [...adminScenarioKeys.all, 'list'] as const,
  categories: ['adminScenarioCategories'] as const,
};

export const adminScenarioMutationKeys = {
  publish: [...adminScenarioKeys.all, 'publish'] as const,
  archive: [...adminScenarioKeys.all, 'archive'] as const,
};

// Categories
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
      toast.success('Đã tạo danh mục mới thành công.');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.categories });
    },
    onError: () => toast.error('Không thể tạo danh mục. Vui lòng thử lại.'),
  });
}

export function useUpdateScenarioCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateScenarioCategory(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật danh mục thành công.');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.categories });
    },
    onError: () => toast.error('Không thể cập nhật danh mục. Vui lòng thử lại.'),
  });
}

// Scenarios
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
      toast.success('Đã tạo kịch bản mới thành công.');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Không thể tạo kịch bản. Vui lòng thử lại.'),
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateScenario(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật kịch bản thành công.');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Không thể cập nhật kịch bản. Vui lòng thử lại.'),
  });
}

export function usePublishScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: adminScenarioMutationKeys.publish,
    mutationFn: (id: string) => adminApi.publishScenario(id),
    onSuccess: () => {
      toast.success('Đã đăng tải kịch bản thành công.');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Không thể đăng kịch bản. Vui lòng thử lại.'),
  });
}

export function useArchiveScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: adminScenarioMutationKeys.archive,
    mutationFn: (id: string) => adminApi.archiveScenario(id),
    onSuccess: () => {
      toast.success('Đã lưu trữ kịch bản thành công.');
      queryClient.invalidateQueries({ queryKey: adminScenarioKeys.lists() });
    },
    onError: () => toast.error('Không thể lưu trữ kịch bản. Vui lòng thử lại.'),
  });
}
