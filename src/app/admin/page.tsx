'use client';

import React from 'react';
import styles from './Admin.module.css';
import { useAdminDashboard } from '@/hooks/queries/useAdmin';
import { formatCurrency } from '@/utils/formatters';

export default function AdminPage() {
  const { data: stats, isLoading: loading, error: queryError } = useAdminDashboard();
  const error = queryError ? (queryError as Error).message || 'Lỗi khi tải dữ liệu' : null;

  if (loading) return <div style={{ padding: '20px' }}>Đang tải dữ liệu tổng quan...</div>;
  if (error || !stats) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1f2937' }}>
        Tổng quan Quản trị viên
      </h2>
      <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
        Chào mừng đến với khu vực dành riêng cho Admin.
        Tại đây, bạn có thể quản lý hệ thống, kiểm soát người dùng và thiết lập gói cước.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>Tổng Người dùng</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalUsers.toLocaleString('vi-VN')}</p>
        </div>
        <div style={{ flex: '1 1 200px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#10b981', marginBottom: '10px' }}>Người dùng hoạt động (30 ngày)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeUsers.toLocaleString('vi-VN')}</p>
        </div>
        <div style={{ flex: '1 1 200px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '10px' }}>Tổng Phỏng vấn</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalInterviews.toLocaleString('vi-VN')}</p>
        </div>
        <div style={{ flex: '1 1 200px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Doanh thu tháng này</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {formatCurrency(stats.revenue)}
          </p>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
        <h3 style={{ marginBottom: '15px', color: '#374151' }}>Sử dụng Quota theo Gói cước</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.entries(stats.quotaUsage || {}).map(([plan, usage]) => (
            <li key={plan} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 500, color: '#4b5563', textTransform: 'capitalize' }}>{plan}</span>
              <span style={{ fontWeight: 'bold' }}>{usage.toLocaleString('vi-VN')} lượt</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
