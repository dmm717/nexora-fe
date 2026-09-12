import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { AdminUserView, EntitlementFeatureResponse, OrderResponse } from '@/services/adminApi';
import { useAdminUserDetail } from '@/hooks/queries/useAdminUsers';
import { GrantPlanModal } from './GrantPlanModal';
import { AdjustQuotaModal } from './AdjustQuotaModal';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function UserDetailModal({ isOpen, onClose, userId }: UserDetailModalProps) {
  const { data: user, isLoading, error } = useAdminUserDetail(userId);

  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem',
        width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Chi tiết Người dùng</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {isLoading && <div>Đang tải thông tin...</div>}
        {error && <div style={{ color: 'red' }}>Lỗi khi tải dữ liệu chi tiết.</div>}

        {!isLoading && !error && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Thông tin cơ bản */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Thông tin cơ bản</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div><span style={{ color: '#6b7280' }}>ID:</span> <span style={{ fontWeight: '500' }}>{user.id}</span></div>
                <div><span style={{ color: '#6b7280' }}>Email:</span> <span style={{ fontWeight: '500' }}>{user.email}</span></div>
                <div><span style={{ color: '#6b7280' }}>Tên hiển thị:</span> <span style={{ fontWeight: '500' }}>{user.displayName || '-'}</span></div>
                <div><span style={{ color: '#6b7280' }}>Ngày tham gia:</span> <span style={{ fontWeight: '500' }}>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span></div>
                <div><span style={{ color: '#6b7280' }}>Trạng thái:</span> <span style={{ fontWeight: '500', color: user.active ? '#166534' : '#991b1b' }}>{user.active ? 'Hoạt động' : 'Đã khóa'}</span></div>
                <div>
                  <span style={{ color: '#6b7280' }}>Phân quyền: </span>
                  {(user.roles || []).map((r: string) => (
                    <span key={r} style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.4rem', borderRadius: '4px', marginRight: '0.5rem' }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Gói cước và Hạn mức */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Gói cước & Hạn mức</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button onClick={() => setIsAdjustOpen(true)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'white', color: '#f59e0b', border: '1px solid #fcd34d' }}>+ Chỉnh Quota</Button>
                  <Button onClick={() => setIsGrantOpen(true)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#2563eb' }}>Cấp gói cước</Button>
                </div>
              </div>

              {!user.currentEntitlement ? (
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Người dùng chưa có gói cước nào đang kích hoạt.
                </div>
              ) : (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#166534' }}>Gói hiện tại: {user.currentEntitlement.planCode.toUpperCase()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>
                        Hiệu lực: {new Date(user.currentEntitlement.startsAt).toLocaleDateString('vi-VN')} {user.currentEntitlement.endsAt ? `- ${new Date(user.currentEntitlement.endsAt).toLocaleDateString('vi-VN')}` : '- Vĩnh viễn'}
                      </div>
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4b5563' }}>Tính năng</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4b5563' }}>Giới hạn</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4b5563' }}>Đã dùng</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4b5563' }}>Điều chỉnh</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', color: '#111827', fontWeight: '600' }}>Còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.currentEntitlement.features.map((f: EntitlementFeatureResponse) => (
                        <tr key={f.code} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: '500' }}>{f.name}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{f.code} {f.enabled ? '(Bật)' : '(Tắt)'}</div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{f.unlimited ? '∞' : f.limit}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: '#ef4444' }}>{f.consumed}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', color: f.adjustment > 0 ? '#10b981' : f.adjustment < 0 ? '#ef4444' : '#6b7280' }}>
                            {f.adjustment > 0 ? `+${f.adjustment}` : f.adjustment}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#2563eb' }}>
                            {f.unlimited ? '∞' : f.available}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Lịch sử đơn hàng */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Lịch sử giao dịch gần đây</h4>
              {(!user.recentOrders || user.recentOrders.length === 0) ? (
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Chưa có giao dịch nào.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4b5563' }}>Mã ĐH</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4b5563' }}>Gói</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5563' }}>Số tiền</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4b5563' }}>Trạng thái</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5563' }}>Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.recentOrders.map((o: OrderResponse) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', color: '#6b7280' }}>{o.id.substring(0, 8)}...</td>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{o.planCode.toUpperCase()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{(o.amountMinor).toLocaleString()} {o.currency}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{ backgroundColor: o.status === 'paid' ? '#dcfce7' : '#f3f4f6', color: o.status === 'paid' ? '#166534' : '#4b5563', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Sub-modals */}
      <GrantPlanModal isOpen={isGrantOpen} onClose={() => setIsGrantOpen(false)} user={user as AdminUserView} />
      <AdjustQuotaModal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} user={user as AdminUserView} />
    </div>
  );
}
