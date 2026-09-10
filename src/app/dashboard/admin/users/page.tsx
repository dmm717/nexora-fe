'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, AdminUserView } from '@/services/adminApi';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const data = await adminApi.getUsers();
        if (isMounted) {
          setUsers(data.users || []);
        }
      } catch {
        if (isMounted) {
          setError('Không thể tải danh sách người dùng. Vui lòng kiểm tra quyền truy cập.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>Quản trị hệ thống</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/dashboard/admin/users" style={{ fontWeight: '600', color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.5rem' }}>Người dùng</Link>
        <Link href="/dashboard/admin/scenarios" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Kịch bản</Link>
        <Link href="/dashboard/admin/plans" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Gói cước</Link>
      </div>

      {loading && <div>Đang tải danh sách người dùng...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {!loading && !error && users.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          Chưa có dữ liệu người dùng.
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Email</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Tên</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Quyền</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Gói cước</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#111827' }}>{user.email}</td>
                  <td style={{ padding: '1rem', color: '#4b5563' }}>{user.displayName || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    {(user.roles || []).map(r => (
                      <span key={r} style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', marginRight: '0.5rem' }}>
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
                      backgroundColor: user.active ? '#dcfce7' : '#f3f4f6', 
                      color: user.active ? '#166534' : '#4b5563', 
                      padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' 
                    }}>
                      {user.active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
