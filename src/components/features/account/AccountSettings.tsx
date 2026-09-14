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
import { formatCurrency } from '../../../utils/formatters';
import { useResumes, useSetPrimaryResume, useCareerProfile } from '../../../hooks/queries/useCareerProfile';
import { ClientDate } from '../../ui/ClientDate';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(120, 'Tên hiển thị quá dài').trim(),
  yearsOfExperience: z.any().transform(v => {
    if (v === '' || v === null || v === undefined) return '';
    const num = Number(v);
    return isNaN(num) ? v : num;
  }).pipe(
    z.union([
      z.number().int('Phải là số nguyên').min(0, 'Ít nhất 0 năm').max(60, 'Tối đa 60 năm'),
      z.literal('')
    ])
  ).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"]
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const PasswordForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useHookForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      setError(null);
      setSuccess(null);
      await userApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setSuccess('Đổi mật khẩu thành công!');
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      <div className={styles.formGroup}>
        <Input type="password" label="Mật khẩu hiện tại (nếu có)" {...register('currentPassword')} error={errors.currentPassword?.message} />
      </div>
      <div className={styles.formGroup}>
        <Input type="password" label="Mật khẩu mới" {...register('newPassword')} error={errors.newPassword?.message} />
      </div>
      <div className={styles.formGroup}>
        <Input type="password" label="Xác nhận mật khẩu mới" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
      </div>
      <Button type="submit" isLoading={isSubmitting}>Đổi mật khẩu</Button>
    </form>
  );
};

const ResumeManagementSection = () => {
  const { data: resumes, isLoading, isError } = useResumes();
  const { data: careerProfile } = useCareerProfile();
  const { mutate: setPrimaryResume, isPending } = useSetPrimaryResume();
  const primaryResumeId = careerProfile?.primaryResume?.id;

  if (isLoading) return <div>Đang tải danh sách CV...</div>;
  if (isError) return <div style={{ color: '#ef4444' }}>Đã xảy ra lỗi khi tải danh sách CV.</div>;
  if (!resumes || resumes.length === 0) {
    return <div className={styles.infoLabel}>Bạn chưa tải lên CV nào.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {resumes.map(resume => {
        const isPrimary = resume.id === primaryResumeId;
        return (
          <div
            key={resume.id}
            style={{
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9fafb'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: '#111827' }} title={resume.fileName}>
                  {resume.fileName}
                </div>
                {isPrimary && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <svg fill="currentColor" viewBox="0 0 20 20" width="12" height="12" style={{ marginRight: '4px' }}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    CV Chính
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.25rem' }}>
                {(resume.size / 1024 / 1024).toFixed(2)} MB • <ClientDate date={resume.createdAt} />
              </div>
            </div>
            <div>
              {isPrimary ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setPrimaryResume(null)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    color: '#ef4444'
                  }}
                >
                  Bỏ chọn CV chính
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending || resume.status !== 'ready'}
                  onClick={() => setPrimaryResume(resume.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: resume.status === 'ready' ? '#EFF6FF' : '#F3F4F6',
                    border: '1px solid',
                    borderColor: resume.status === 'ready' ? '#BFDBFE' : '#E5E7EB',
                    borderRadius: '4px',
                    cursor: (isPending || resume.status !== 'ready') ? 'not-allowed' : 'pointer',
                    opacity: (isPending || resume.status !== 'ready') ? 0.7 : 1,
                    color: resume.status === 'ready' ? '#2563EB' : '#9CA3AF'
                  }}
                >
                  {resume.status === 'ready' ? 'Đặt làm CV chính' : 'Đang xử lý...'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
          reset({ 
            displayName: data.displayName || '',
            yearsOfExperience: data.yearsOfExperience ?? ''
          });
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
      
      const requestData = {
        displayName: data.displayName,
        yearsOfExperience: data.yearsOfExperience === '' ? null : data.yearsOfExperience
      };

      const updatedUser = await userApi.updateProfile(requestData);
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
              <div className={styles.infoValue}>{user.billing.entitlement.endsAt ? new Date(user.billing.entitlement.endsAt).toLocaleDateString('vi-VN') : 'Không thời hạn'}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Đã sử dụng</div>
              <div className={styles.infoValue}>{user.billing.entitlement.consumed.toLocaleString('vi-VN')} / {user.billing.entitlement.limit != null ? user.billing.entitlement.limit.toLocaleString('vi-VN') : '∞'} AI Credits</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Còn lại</div>
              <div className={styles.infoValue}>{user.billing.entitlement.available != null ? user.billing.entitlement.available.toLocaleString('vi-VN') : 'Không giới hạn'}</div>
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
                        {formatCurrency(order.amountMinor, order.currency || 'VND')}
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
          <div className={styles.formGroup}>
            <Input 
              type="number"
              label="Số năm kinh nghiệm" 
              min={0}
              max={60}
              {...register('yearsOfExperience')} 
              error={errors.yearsOfExperience?.message} 
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
        <h3 className={styles.sectionTitle}>Đổi mật khẩu</h3>
        <p className={styles.infoLabel} style={{marginBottom: '1rem'}}>
          Nếu bạn đăng nhập bằng Google, hãy để trống ô Mật khẩu hiện tại để thiết lập mật khẩu mới.
        </p>
        <PasswordForm />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quản lý CV (Resumes)</h3>
        <p className={styles.infoLabel} style={{marginBottom: '1rem'}}>
          Danh sách các CV bạn đã tải lên. Hãy đặt một CV làm mặc định để hệ thống tự động sử dụng trong các buổi phỏng vấn (Career Goal) tiếp theo.
        </p>
        <ResumeManagementSection />
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
