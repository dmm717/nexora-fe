import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminUserView } from '@/services/adminApi';
import { useUpdateUserStatus } from '@/hooks/queries/useAdminUsers';

const statusSchema = z.object({
  active: z.boolean(),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự)'),
});

type StatusFormValues = z.infer<typeof statusSchema>;

interface UserStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function UserStatusModal({ isOpen, onClose, user }: UserStatusModalProps) {
  const updateStatusMutation = useUpdateUserStatus();

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { active: true, reason: '' }
  });

  const isActive = useWatch({ control, name: 'active' });

  useEffect(() => {
    if (isOpen && user) {
      setValue('active', user.active);
      setValue('reason', '');
    }
  }, [isOpen, user, setValue]);

  if (!isOpen || !user) return null;

  const onSubmit = (data: StatusFormValues) => {
    updateStatusMutation.mutate({
      userId: user.id,
      data: {
        active: data.active,
        reason: data.reason,
      }
    }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = updateStatusMutation.isPending;

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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Thay đổi Trạng thái</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
          Người dùng: <strong>{user.email}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: isActive ? '#dcfce7' : '#fee2e2', borderRadius: '0.375rem', border: `1px solid ${isActive ? '#86efac' : '#fca5a5'}` }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500', color: isActive ? '#166534' : '#991b1b' }}>
              <input 
                type="checkbox" 
                {...register('active')} 
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
              {isActive ? 'Tài khoản đang Hoạt động (Bỏ chọn để khóa)' : 'Tài khoản đang bị Khóa (Chọn để mở lại)'}
            </label>
          </div>

          <Input 
            label="Lý do thay đổi (Bắt buộc)" 
            {...register('reason')} 
            error={errors.reason?.message} 
            placeholder="VD: Vi phạm chính sách, Mở lại theo yêu cầu..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
            <Button type="submit" disabled={isPending} style={{ backgroundColor: isActive ? '#10b981' : '#ef4444', color: 'white' }}>
              {isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
