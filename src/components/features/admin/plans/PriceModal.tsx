import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Modal } from '@/components/ui/Modal';
import { AdminPlanPriceView } from '@/services/adminApi';
import { useAddPlanPrice, useUpdatePlanPrice } from '@/hooks/queries/useAdminPlans';

const priceSchema = z.object({
  amountMinor: z.coerce.number().min(0, 'Giá không được âm'),
  currency: z.string().min(1, 'Vui lòng nhập tiền tệ (VD: VND)'),
  durationDays: z.coerce.number().optional().nullable(),
  interviewQuota: z.coerce.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type PriceFormValues = z.infer<typeof priceSchema>;

interface PriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  editingPrice?: AdminPlanPriceView | null;
}

export function PriceModal({ isOpen, onClose, planId, editingPrice }: PriceModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.input<typeof priceSchema>, unknown, PriceFormValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      amountMinor: 0, currency: 'VND', durationDays: null, interviewQuota: null, isActive: true,
    },
  });

  const {
    mutate: addPrice,
    isPending: isAdding,
    isError: addError,
    reset: resetAddMutation,
  } = useAddPlanPrice();
  const {
    mutate: updatePrice,
    isPending: isUpdating,
    isError: updateError,
    reset: resetUpdateMutation,
  } = useUpdatePlanPrice();
  const isPending = isAdding || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    resetAddMutation();
    resetUpdateMutation();
    if (editingPrice) {
      reset({
        amountMinor: editingPrice.amountMinor,
        currency: editingPrice.currency,
        durationDays: editingPrice.durationDays,
        interviewQuota: editingPrice.interviewQuota,
        isActive: editingPrice.isActive,
      });
    } else {
      reset();
    }
  }, [isOpen, editingPrice, reset, resetAddMutation, resetUpdateMutation]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  if (!isOpen) return null;

  const onSubmit = (data: PriceFormValues) => {
    if (isPending) return;
    const payload = {
      amountMinor: data.amountMinor,
      currency: data.currency,
      durationDays: data.durationDays || undefined,
      interviewQuota: data.interviewQuota || undefined,
      isActive: data.isActive,
    };

    if (editingPrice) {
      updatePrice({ priceId: editingPrice.id, data: payload }, { onSuccess: onClose });
    } else {
      addPrice({ planId, data: payload }, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingPrice ? 'Sửa giá gói cước' : 'Thêm mức giá'}
      description="Thiết lập mức giá và giới hạn đi kèm cho gói."
      size="md"
    >
      <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isPending}>
          {(addError || updateError) && (
            <Alert variant="error" title="Chưa lưu được mức giá">
              Các giá trị đã nhập vẫn được giữ lại. Bạn có thể thử lưu lại.
            </Alert>
          )}

          <Input
            label="Số tiền (Amount)"
            type="number"
            {...register('amountMinor')}
            error={errors.amountMinor?.message}
            disabled={!!editingPrice || isPending}
            placeholder="Ví dụ: 599000"
          />
          <Input
            label="Tiền tệ (Currency)"
            {...register('currency')}
            error={errors.currency?.message}
            disabled={!!editingPrice || isPending}
          />
          <Input
            label="Thời hạn (số ngày, tùy chọn)"
            type="number"
            {...register('durationDays')}
            error={errors.durationDays?.message}
            disabled={!!editingPrice || isPending}
            placeholder="Ví dụ: 30"
          />
          <Input
            label="Hạn mức phỏng vấn (tùy chọn)"
            type="number"
            {...register('interviewQuota')}
            error={errors.interviewQuota?.message}
            disabled={!!editingPrice || isPending}
            placeholder="Ví dụ: 10"
          />

          {editingPrice && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
              <input type="checkbox" {...register('isActive')} disabled={isPending} className="h-4 w-4 accent-primary" />
              Đang hoạt động
            </label>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/50 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>Hủy</Button>
            <Button type="submit" loading={isPending}>{isPending ? 'Đang xử lý…' : 'Lưu mức giá'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
