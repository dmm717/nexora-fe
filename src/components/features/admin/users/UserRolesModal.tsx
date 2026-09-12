import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminUserView } from '@/services/adminApi';
import { useUpdateUserRoles, useAdminRoles } from '@/hooks/queries/useAdminUsers';

const roleSchema = z.object({
  roles: z.array(z.string()).min(1, 'Người dùng phải có ít nhất 1 quyền (User)'),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự) để lưu Audit Log'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface UserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function UserRolesModal({ isOpen, onClose, user }: UserRolesModalProps) {
  const { data: systemRoles = [] } = useAdminRoles();
  const updateRolesMutation = useUpdateUserRoles();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { roles: [], reason: '' }
  });

  useEffect(() => {
    if (isOpen && user) {
      setValue('roles', user.roles || []);
      setValue('reason', '');
    }
  }, [isOpen, user, setValue]);

  if (!isOpen || !user) return null;

  const onSubmit = (data: RoleFormValues) => {
    updateRolesMutation.mutate({
      userId: user.id,
      data: {
        roles: data.roles,
        reason: data.reason,
      }
    }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = updateRolesMutation.isPending;

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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Cập nhật Quyền</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
          Đang thao tác trên: <strong>{user.email}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Chọn quyền</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
              {systemRoles.map(role => (
                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    value={role.name}
                    {...register('roles')} 
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <span>{role.name}</span>
                </label>
              ))}
            </div>
            {errors.roles && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.roles.message}</span>}
          </div>

          <Input 
            label="Lý do thay đổi (Bắt buộc)" 
            {...register('reason')} 
            error={errors.reason?.message} 
            placeholder="VD: Chuyển công tác, thăng cấp..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Lưu quyền'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
