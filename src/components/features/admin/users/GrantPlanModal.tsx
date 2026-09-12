import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminUserView } from '@/services/adminApi';
import { useGrantPlan } from '@/hooks/queries/useAdminUsers';
import { useAdminPlans } from '@/hooks/queries/useAdminPlans';

const grantSchema = z.object({
  planPriceId: z.string().min(1, 'Vui lòng chọn một Gói cước (Price)'),
  replaceCurrent: z.boolean(),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự)'),
});

type GrantFormValues = z.infer<typeof grantSchema>;

interface GrantPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function GrantPlanModal({ isOpen, onClose, user }: GrantPlanModalProps) {
  const grantMutation = useGrantPlan();
  const { data: plans = [] } = useAdminPlans();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { planPriceId: '', replaceCurrent: true, reason: '' }
  });

  useEffect(() => {
    if (isOpen) {
      reset({ planPriceId: '', replaceCurrent: true, reason: '' });
    }
  }, [isOpen, reset]);

  // Flatten plans to extract active prices
  const activePrices = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    plans.filter(p => p.isActive).forEach(p => {
      p.prices?.filter(pr => pr.isActive).forEach(pr => {
        list.push({
          id: pr.id,
          label: `[${p.name}] - ${pr.durationDays ? pr.durationDays + ' ngày' : 'Vĩnh viễn'} - ${pr.amountMinor.toLocaleString('vi-VN')} ${pr.currency}`
        });
      });
    });
    return list;
  }, [plans]);

  if (!isOpen || !user) return null;

  const onSubmit = (data: GrantFormValues) => {
    grantMutation.mutate({
      userId: user.id,
      data: {
        planPriceId: data.planPriceId,
        replaceCurrent: data.replaceCurrent,
        reason: data.reason,
      }
    }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = grantMutation.isPending;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1100
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Cấp phát Gói cước (Manual Grant)</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
          <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.875rem' }}>
            Bạn đang cấp gói cước trực tiếp cho người dùng <strong>{user.email}</strong>. 
            Hành động này sẽ tạo ngay lập tức một <strong>Entitlement</strong> dựa trên cấu hình (snapshot) của gói được chọn.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Chọn gói cước khả dụng</label>
            <select 
              {...register('planPriceId')} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
            >
              <option value="">-- Chọn Gói --</option>
              {activePrices.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {errors.planPriceId && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.planPriceId.message}</span>}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" {...register('replaceCurrent')} style={{ width: '1rem', height: '1rem' }} />
            Thay thế gói cước hiện tại (Nếu bỏ chọn, gói sẽ tự cộng dồn ngày - Stackable)
          </label>

          <Input 
            label="Lý do cấp (Bắt buộc)" 
            {...register('reason')} 
            error={errors.reason?.message} 
            placeholder="VD: Khách hàng mua qua chuyển khoản tay, Đền bù sự cố..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
            <Button type="submit" disabled={isPending} style={{ backgroundColor: '#2563eb' }}>
              {isPending ? 'Đang cấp phát...' : 'Cấp phát gói cước'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
