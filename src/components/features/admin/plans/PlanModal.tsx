import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminPlanView } from '@/services/adminApi';
import { useCreatePlan, useUpdatePlan } from '@/hooks/queries/useAdminPlans';

const planSchema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã gói (code)'),
  name: z.string().min(1, 'Vui lòng nhập tên gói'),
  description: z.string().optional(),
  badge: z.string().optional(),
  isHighlighted: z.boolean(),
  isActive: z.boolean().optional(), // only for update
});

export type PlanFormValues = z.infer<typeof planSchema>;

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan?: AdminPlanView | null;
}

export function PlanModal({ isOpen, onClose, editingPlan }: PlanModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      code: '', name: '', description: '', badge: '', isHighlighted: false, isActive: true
    }
  });

  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();

  useEffect(() => {
    if (isOpen) {
      if (editingPlan) {
        setValue('code', editingPlan.code);
        setValue('name', editingPlan.name);
        setValue('description', editingPlan.description || '');
        setValue('badge', editingPlan.badge || '');
        setValue('isHighlighted', editingPlan.isHighlighted);
        setValue('isActive', editingPlan.isActive);
      } else {
        reset();
      }
    }
  }, [isOpen, editingPlan, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: PlanFormValues) => {
    if (editingPlan) {
      updateMutation.mutate({
        id: editingPlan.id,
        data: {
          name: data.name,
          description: data.description,
          badge: data.badge,
          isHighlighted: data.isHighlighted,
          isActive: data.isActive
        }
      }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate({
        code: data.code,
        name: data.name,
        description: data.description,
        badge: data.badge,
        isHighlighted: data.isHighlighted
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
            {editingPlan ? 'Sửa Gói Cước' : 'Tạo Gói Cước Mới'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <Input label="Mã gói (Code)" {...register('code')} error={errors.code?.message} disabled={!!editingPlan} />
          <Input label="Tên gói" {...register('name')} error={errors.name?.message} />
          <Input label="Mô tả" {...register('description')} error={errors.description?.message} />
          <Input label="Badge (VD: Phổ biến)" {...register('badge')} error={errors.badge?.message} />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" {...register('isHighlighted')} />
            Gói nổi bật (Highlighted)
          </label>

          {editingPlan && (
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
