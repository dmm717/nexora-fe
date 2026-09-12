import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminUserView } from '@/services/adminApi';
import { useAdjustFeature } from '@/hooks/queries/useAdminUsers';
import { useAdminFeatureDefinitions } from '@/hooks/queries/useAdminPlans';

const adjustSchema = z.object({
  featureCode: z.string().min(1, 'Vui lòng chọn một tính năng'),
  quantity: z.coerce.number().refine(val => val !== 0, 'Số lượng không được bằng 0'),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự)'),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

interface AdjustQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function AdjustQuotaModal({ isOpen, onClose, user }: AdjustQuotaModalProps) {
  const adjustMutation = useAdjustFeature();
  const { data: features = [] } = useAdminFeatureDefinitions() as { data: { code: string; name: string }[] };

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(adjustSchema),
    defaultValues: { featureCode: '', quantity: 1, reason: '' }
  });

  useEffect(() => {
    if (isOpen) {
      reset({ featureCode: '', quantity: 1, reason: '' });
    }
  }, [isOpen, reset]);

  if (!isOpen || !user) return null;

  const onSubmit = (data: AdjustFormValues) => {
    adjustMutation.mutate({
      userId: user.id,
      data: {
        featureCode: data.featureCode,
        quantity: data.quantity,
        reason: data.reason,
      }
    }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = adjustMutation.isPending;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1100
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Điều chỉnh Hạn mức (Quota)</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
            Điều chỉnh số dư của <strong>{user.email}</strong>. Bạn có thể nhập <strong>số âm</strong> để thu hồi. Lưu ý: Không thể thu hồi khiến số dư nhỏ hơn 0.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Chọn tính năng</label>
            <select 
              {...register('featureCode')} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
            >
              <option value="">-- Chọn tính năng --</option>
              {features.map((f: { code: string; name: string }) => (
                <option key={f.code} value={f.code}>{f.name} ({f.code})</option>
              ))}
            </select>
            {errors.featureCode && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.featureCode.message}</span>}
          </div>

          <Input 
            label="Số lượng (Nhập số âm để thu hồi)" 
            type="number"
            {...register('quantity')} 
            error={errors.quantity?.message} 
          />

          <Input 
            label="Lý do điều chỉnh (Bắt buộc)" 
            {...register('reason')} 
            error={errors.reason?.message} 
            placeholder="VD: Khuyến mãi sự kiện, Thu hồi do lỗi hệ thống..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
            <Button type="submit" disabled={isPending} style={{ backgroundColor: '#f59e0b' }}>
              {isPending ? 'Đang điều chỉnh...' : 'Xác nhận điều chỉnh'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
