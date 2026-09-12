'use client';

import React, { useState } from 'react';
import { AdminUserView } from '@/services/adminApi';
import Link from 'next/link';
import { useAdminUsers } from '@/hooks/queries/useAdminUsers';
import { Button } from '@/components/ui/Button/Button';
import { UserRolesModal } from '@/components/features/admin/users/UserRolesModal';
import { UserStatusModal } from '@/components/features/admin/users/UserStatusModal';
import { UserDetailModal } from '@/components/features/admin/users/UserDetailModal';

export default function AdminUsersPage() {
  // Cursor Stack Pagination
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const currentCursor = cursorStack.length > 0 ? cursorStack[cursorStack.length - 1] : undefined;

  const { data, isLoading, error, isFetching } = useAdminUsers(currentCursor);
  const users = data?.users || [];
  const hasNextPage = !!data?.lastId;

  // Modals state
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<AdminUserView | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUserView | null>(null);
  const [selectedUserIdForDetails, setSelectedUserIdForDetails] = useState<string | null>(null);

  const handleNext = () => {
    if (data?.lastId) {
      setCursorStack(prev => [...prev, data.lastId!]);
    }
  };

  const handlePrevious = () => {
    setCursorStack(prev => prev.slice(0, -1));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>Quản trị hệ thống</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin/users" style={{ fontWeight: '600', color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.5rem' }}>Người dùng</Link>
        <Link href="/admin/scenarios" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Kịch bản</Link>
        <Link href="/admin/plans" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Gói cước</Link>
      </div>

      {isLoading && <div>Đang tải danh sách người dùng...</div>}
      {error && <div style={{ color: 'red' }}>Lỗi khi tải danh sách người dùng. Vui lòng kiểm tra quyền truy cập.</div>}
      
      {!isLoading && !error && users.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          Chưa có dữ liệu người dùng.
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
            {/* Loading Overlay when fetching next page */}
            {isFetching && !isLoading && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.5)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Đang tải...</span>
              </div>
            )}
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Email</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Tên</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Quyền</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Gói cước</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
                  <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', color: '#111827' }}>{user.email}</td>
                    <td style={{ padding: '1rem', color: '#4b5563' }}>{user.displayName || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      {(user.roles || []).map(r => (
                        <span key={r} style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', marginRight: '0.5rem', display: 'inline-block' }}>
                          {r}
                        </span>
                      ))}
                    </td>
                    <td style={{ padding: '1rem', color: '#4b5563' }}>
                      {user.currentPlanCode ? (
                        <span style={{ fontWeight: '500', color: '#0ea5e9' }}>{user.currentPlanCode.toUpperCase()}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        backgroundColor: user.active ? '#dcfce7' : '#fee2e2', 
                        color: user.active ? '#166534' : '#991b1b', 
                        padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' 
                      }}>
                        {user.active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setSelectedUserForRoles(user)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db' }}>
                          Sửa quyền
                        </Button>
                        <Button onClick={() => setSelectedUserForStatus(user)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'white', color: user.active ? '#ef4444' : '#10b981', border: `1px solid ${user.active ? '#fca5a5' : '#6ee7b7'}` }}>
                          {user.active ? 'Khóa' : 'Mở khóa'}
                        </Button>
                        <Button onClick={() => setSelectedUserIdForDetails(user.id)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>
              Trang {cursorStack.length + 1} {isFetching && <span style={{ marginLeft: '0.5rem', color: '#9ca3af' }}>(Đang làm mới...)</span>}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button 
                onClick={handlePrevious} 
                disabled={cursorStack.length === 0 || isFetching}
                style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', opacity: cursorStack.length === 0 ? 0.5 : 1 }}
              >
                &larr; Trang trước
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!hasNextPage || isFetching}
                style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', opacity: !hasNextPage ? 0.5 : 1 }}
              >
                Trang sau &rarr;
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <UserRolesModal 
        isOpen={!!selectedUserForRoles} 
        onClose={() => setSelectedUserForRoles(null)} 
        user={selectedUserForRoles} 
      />
      <UserStatusModal 
        isOpen={!!selectedUserForStatus} 
        onClose={() => setSelectedUserForStatus(null)} 
        user={selectedUserForStatus} 
      />
      <UserDetailModal 
        isOpen={!!selectedUserIdForDetails} 
        onClose={() => setSelectedUserIdForDetails(null)} 
        userId={selectedUserIdForDetails} 
      />

    </div>
  );
}
