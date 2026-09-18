import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Modal } from '@/components/ui/Modal';
import { AdminPlanView } from '@/services/adminApi';
import { useCreatePlan, useUpdatePlan } from '@/hooks/queries/useAdminPlans';

const planSchema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã gói (code)'),
  name: z.string().min(1, 'Vui lòng nhập tên gói'),
  description: z.string().optional(),
  badge: z.string().optional(),
  isHighlighted: z.boolean(),
  isActive: z.boolean().optional(),
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan?: AdminPlanView | null;
}

export function PlanModal({ isOpen, onClose, editingPlan }: PlanModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      code: '', name: '', description: '', badge: '', isHighlighted: false, isActive: true,
    },
  });

  const {
    mutate: createPlan,
    isPending: isCreating,
    isError: createError,
    reset: resetCreateMutation,
  } = useCreatePlan();
  const {
    mutate: updatePlan,
    isPending: isUpdating,
    isError: updateError,
    reset: resetUpdateMutation,
  } = useUpdatePlan();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    resetCreateMutation();
    resetUpdateMutation();
    if (editingPlan) {
      reset({
        code: editingPlan.code,
        name: editingPlan.name,
        description: editingPlan.description || '',
        badge: editingPlan.badge || '',
        isHighlighted: editingPlan.isHighlighted,
        isActive: editingPlan.isActive,
      });
    } else {
      reset();
    }
  }, [isOpen, editingPlan, reset, resetCreateMutation, resetUpdateMutation]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  if (!isOpen) return null;

  const onSubmit = (data: PlanFormValues) => {
    if (isPending) return;
    if (editingPlan) {
      updatePlan({
        id: editingPlan.id,
        data: {
          name: data.name,
          description: data.description,
          badge: data.badge,
          isHighlighted: data.isHighlighted,
          isActive: data.isActive,
        },
      }, { onSuccess: onClose });
    } else {
      createPlan({
        code: data.code,
        name: data.name,
        description: data.description,
        badge: data.badge,
        isHighlighted: data.isHighlighted,
      }, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingPlan ? 'Sửa gói cước' : 'Tạo gói cước mới'}
      description="Cập nhật thông tin hiển thị và trạng thái của gói."
      size="md"
    >
      <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isPending}>
          {(createError || updateError) && (
            <Alert variant="error" title="Chưa lưu được gói cước">
              Thông tin vẫn được giữ lại. Bạn có thể thử lưu lại.
            </Alert>
          )}

          <Input label="Mã gói (Code)" {...register('code')} error={errors.code?.message} disabled={!!editingPlan || isPending} />
          <Input label="Tên gói" {...register('name')} error={errors.name?.message} disabled={isPending} />
          <Input label="Mô tả" {...register('description')} error={errors.description?.message} disabled={isPending} />
          <Input label="Badge (ví dụ: Phổ biến)" {...register('badge')} error={errors.badge?.message} disabled={isPending} />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
            <input type="checkbox" {...register('isHighlighted')} disabled={isPending} className="h-4 w-4 accent-primary" />
            Gói nổi bật
          </label>

          {editingPlan && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
              <input type="checkbox" {...register('isActive')} disabled={isPending} className="h-4 w-4 accent-primary" />
              Đang hoạt động
            </label>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/50 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>Hủy</Button>
            <Button type="submit" loading={isPending}>{isPending ? 'Đang xử lý…' : 'Lưu gói'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
