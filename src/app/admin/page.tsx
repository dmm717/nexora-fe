'use client';
import React from 'react';

export default function AdminPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1f2937' }}>
        Tổng quan Quản trị viên
      </h2>
      <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
        Chào mừng đến với khu vực dành riêng cho Admin.
        Tại đây, bạn có thể quản lý hệ thống, kiểm soát người dùng và thiết lập gói cước.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Người dùng hệ thống</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>1,245</p>
        </div>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Doanh thu tháng</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>$12,450</p>
        </div>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Gói cước hoạt động</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>3 Gói</p>
        </div>
      </div>
    </div>
  );
}
