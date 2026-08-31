'use client';

import React, { useEffect, useState } from 'react';
import styles from './AccountSettings.module.css';
import { userApi, UserResponse } from '../../../services/userApi';
import { authApi } from '../../../services/authApi';
import { useRouter } from 'next/navigation';
import { Input } from '../../ui/Input/Input';
import { Button } from '../../ui/Button/Button';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(120, 'Tên hiển thị quá dài')
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const AccountSettings = () => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useHookForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const data = await userApi.getCurrentUser();
        if (isMounted) {
          setUser(data);
          reset({ displayName: data.displayName || '' });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải thông tin người dùng');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [reset]);

  const onUpdateProfile = async (data: ProfileFormValues) => {
    try {
      setError(null);
      setSuccess(null);
      const updatedUser = await userApi.updateProfile(data);
      setUser(updatedUser);
      setSuccess('Cập nhật profile thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật profile');
    }
  };

  const onExportData = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setSuccess(null);
      const data = await userApi.exportData();
      
      // Tạo file JSON để download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexora-export-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Trích xuất dữ liệu thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi trích xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  const onRequestDeletion = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn yêu cầu xóa tài khoản không? Hành động này không thể hoàn tác.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);
      await userApi.requestDeletion();
      setSuccess('Yêu cầu xóa tài khoản thành công. Đang đăng xuất...');
      setTimeout(() => {
        authApi.logout().then(() => router.push('/auth')).catch(() => router.push('/auth'));
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi yêu cầu xóa tài khoản');
    } finally {
      setIsDeleting(false);
    }
  };

  const onLogout = async () => {
    try {
      await authApi.logout();
      router.push('/auth');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đăng xuất');
    }
  };

  const onLogoutAll = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi TẤT CẢ các thiết bị không?')) return;
    try {
      await authApi.logoutAll();
      router.push('/auth');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đăng xuất tất cả thiết bị');
    }
  };

  if (loading) return <div>Đang tải thông tin...</div>;
  if (!user) return <div className={styles.errorMessage}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Quản lý tài khoản</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Thông tin chung</h3>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.infoLabel}>Email</div>
            <div className={styles.infoValue}>{user.email}</div>
          </div>
          <div>
            <div className={styles.infoLabel}>Vai trò</div>
            <div className={styles.infoValue}>{user.roles.join(', ') || 'N/A'}</div>
          </div>
          {user.billing?.entitlement && (
            <div>
              <div className={styles.infoLabel}>Gói cước hiện tại</div>
              <div className={styles.infoValue}>{user.billing.entitlement.planCode}</div>
            </div>
          )}
        </div>
      </div>

      {user.billing?.entitlement && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Chi tiết Gói cước & Sử dụng</h3>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.infoLabel}>Ngày bắt đầu</div>
              <div className={styles.infoValue}>{new Date(user.billing.entitlement.startsAt).toLocaleDateString('vi-VN')}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Ngày hết hạn</div>
              <div className={styles.infoValue}>{new Date(user.billing.entitlement.endsAt).toLocaleDateString('vi-VN')}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Đã sử dụng</div>
              <div className={styles.infoValue}>{user.billing.entitlement.consumed.toLocaleString('vi-VN')} / {user.billing.entitlement.limit.toLocaleString('vi-VN')} AI Credits</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Còn lại</div>
              <div className={styles.infoValue}>{user.billing.entitlement.available.toLocaleString('vi-VN')} AI Credits</div>
            </div>
          </div>
        </div>
      )}

      {user.billing?.orders && user.billing.orders.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Lịch sử thanh toán</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Gói cước</th>
                  <th>Số tiền</th>
                  <th>Ngày giao dịch</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {user.billing.orders.map(order => {
                  const isSuccess = order.status.toLowerCase() === 'success' || order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'paid';
                  const isPending = order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'processing';
                  return (
                    <tr key={order.id}>
                      <td>#{order.id.slice(-6).toUpperCase()}</td>
                      <td>{order.planCode}</td>
                      <td>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: order.currency || 'VND' }).format(order.amountMinor)}
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`${styles.badge} ${isSuccess ? styles.badgeSuccess : isPending ? styles.badgePending : styles.badgeFailed}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cập nhật Profile</h3>
        <form onSubmit={handleSubmit(onUpdateProfile)}>
          <div className={styles.formGroup}>
            <Input 
              label="Tên hiển thị" 
              {...register('displayName')} 
              error={errors.displayName?.message}
            />
          </div>
          <Button type="submit" isLoading={isSubmitting}>Lưu thay đổi</Button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Dữ liệu & Quyền riêng tư</h3>
        <p className={styles.infoLabel} style={{marginBottom: '1rem'}}>
          Bạn có thể tải xuống bản sao dữ liệu của mình hoặc gửi yêu cầu xóa hoàn toàn tài khoản khỏi hệ thống.
        </p>
        <div className={styles.buttonGroup}>
          <button 
            type="button" 
            className={styles.exportButton} 
            onClick={onExportData}
            disabled={isExporting}
          >
            {isExporting ? 'Đang xử lý...' : 'Trích xuất dữ liệu'}
          </button>
          <button 
            type="button" 
            className={styles.deleteButton} 
            onClick={onRequestDeletion}
            disabled={isDeleting}
          >
            {isDeleting ? 'Đang gửi...' : 'Yêu cầu xóa tài khoản'}
          </button>
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Bảo mật</h3>
        <p className={styles.infoLabel} style={{marginBottom: '1rem'}}>
          Đăng xuất phiên làm việc hiện tại hoặc đăng xuất khỏi tất cả các thiết bị đang đăng nhập.
        </p>
        <div className={styles.buttonGroup}>
          <Button type="button" onClick={onLogout} style={{ backgroundColor: '#6b7280', color: 'white' }}>
            Đăng xuất
          </Button>
          <Button type="button" onClick={onLogoutAll} style={{ backgroundColor: '#ef4444', color: 'white' }}>
            Đăng xuất tất cả thiết bị
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
