import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Modal } from '@/components/ui/Modal';
import { AdminTextField } from './AdminTextField';
import { AdminScenarioCategoryView } from '@/services/adminApi';
import { useCreateScenarioCategory, useUpdateScenarioCategory } from '@/hooks/queries/useAdminScenarios';

const categorySchema = z.object({
  slug: z.string().min(1, 'Nhập mã danh mục.'),
  name: z.string().min(1, 'Nhập tên danh mục.'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const emptyCategory: CategoryFormValues = {
  slug: '',
  name: '',
  description: '',
  isActive: true,
};

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: AdminScenarioCategoryView | null;
}

export function CategoryModal({ isOpen, onClose, editingCategory }: CategoryModalProps) {
  const createMutation = useCreateScenarioCategory();
  const updateMutation = useUpdateScenarioCategory();
  const resetCreateMutation = createMutation.reset;
  const resetUpdateMutation = updateMutation.reset;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyCategory,
  });

  useEffect(() => {
    if (!isOpen) return;
    resetCreateMutation();
    resetUpdateMutation();
    reset(
      editingCategory
        ? {
            slug: editingCategory.slug,
            name: editingCategory.name,
            description: editingCategory.description || '',
            isActive: editingCategory.isActive,
          }
        : emptyCategory,
    );
  }, [isOpen, editingCategory, reset, resetCreateMutation, resetUpdateMutation]);

  const closeIfIdle = () => {
    if (!isPending) onClose();
  };

  const onSubmit = (data: CategoryFormValues) => {
    if (isPending) return;

    if (editingCategory) {
      updateMutation.mutate(
        {
          id: editingCategory.id,
          data: {
            name: data.name,
            description: data.description,
            isActive: data.isActive,
          },
        },
        { onSuccess: onClose },
      );
      return;
    }

    createMutation.mutate(
      {
        slug: data.slug,
        name: data.name,
        description: data.description,
      },
      { onSuccess: onClose },
    );
  };

  const mutationFailed = editingCategory ? updateMutation.isError : createMutation.isError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeIfIdle}
      title={editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
      description="Quản lý các nhóm kịch bản đang có trong hệ thống."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {mutationFailed && (
          <Alert variant="error" title="Chưa lưu được danh mục">
            Thông tin đã nhập vẫn được giữ lại. Hãy kiểm tra rồi thử lưu lại.
          </Alert>
        )}

        <AdminTextField
          label="Mã danh mục (slug)"
          placeholder="Ví dụ: frontend-interview"
          disabled={isPending || Boolean(editingCategory)}
          error={errors.slug?.message}
          {...register('slug')}
        />
        <AdminTextField
          label="Tên danh mục"
          disabled={isPending}
          error={errors.name?.message}
          {...register('name')}
        />
        <AdminTextField
          label="Mô tả"
          disabled={isPending}
          error={errors.description?.message}
          {...register('description')}
        />

        {editingCategory && (
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 text-sm text-on-surface">
            <input
              type="checkbox"
              {...register('isActive')}
              disabled={isPending}
              className="h-4 w-4 rounded border-outline accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            Danh mục đang hoạt động
          </label>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant/50 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeIfIdle} disabled={isPending}>
            Hủy
          </Button>
          <Button type="submit" loading={isPending} disabled={isPending}>
            Lưu danh mục
          </Button>
        </div>
      </form>
    </Modal>
  );
}
