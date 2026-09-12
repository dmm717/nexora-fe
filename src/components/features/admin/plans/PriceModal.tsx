import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
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
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      amountMinor: 0, currency: 'VND', durationDays: null, interviewQuota: null, isActive: true
    }
  });

  const createMutation = useAddPlanPrice();
  const updateMutation = useUpdatePlanPrice();

  useEffect(() => {
    if (isOpen) {
      if (editingPrice) {
        setValue('amountMinor', editingPrice.amountMinor);
        setValue('currency', editingPrice.currency);
        setValue('durationDays', editingPrice.durationDays);
        setValue('interviewQuota', editingPrice.interviewQuota);
        setValue('isActive', editingPrice.isActive);
      } else {
        reset();
      }
    }
  }, [isOpen, editingPrice, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: PriceFormValues) => {
    // Convert nulls to undefined for API if needed, or pass directly
    const payload = {
      amountMinor: data.amountMinor,
      currency: data.currency,
      durationDays: data.durationDays || undefined,
      interviewQuota: data.interviewQuota || undefined,
      isActive: data.isActive
    };

    if (editingPrice) {
      updateMutation.mutate({
        priceId: editingPrice.id,
        data: payload
      }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate({
        planId,
        data: payload
      }, {
        onSuccess: () => onClose()
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {editingPrice ? 'Sửa Giá Gói Cước' : 'Thêm Giá Mới'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <Input 
            label="Số tiền (Amount)" 
            type="number" 
            {...register('amountMinor')} 
            error={errors.amountMinor?.message} 
            disabled={!!editingPrice} 
            placeholder="VD: 599000"
          />
          <Input 
            label="Tiền tệ (Currency)" 
            {...register('currency')} 
            error={errors.currency?.message} 
            disabled={!!editingPrice} 
          />
          <Input 
            label="Thời hạn (Số ngày - tùy chọn)" 
            type="number" 
            {...register('durationDays')} 
            error={errors.durationDays?.message} 
            disabled={!!editingPrice} 
            placeholder="VD: 30"
          />
          <Input 
            label="Hạn mức phỏng vấn (tùy chọn)" 
            type="number" 
            {...register('interviewQuota')} 
            error={errors.interviewQuota?.message} 
            disabled={!!editingPrice} 
            placeholder="VD: 10"
          />

          {editingPrice && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" {...register('isActive')} />
              Đang hoạt động (Kích hoạt)
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Lưu lại'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
