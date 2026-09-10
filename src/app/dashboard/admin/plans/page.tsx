'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, AdminPlanView } from '@/services/adminApi';
import Link from 'next/link';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlanView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const data = await adminApi.getPlans();
        if (isMounted) {
          setPlans(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setError('Không thể tải danh sách gói cước. Vui lòng kiểm tra quyền truy cập.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPlans();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>Quản trị hệ thống</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/dashboard/admin/users" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Người dùng</Link>
        <Link href="/dashboard/admin/scenarios" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Kịch bản</Link>
        <Link href="/dashboard/admin/plans" style={{ fontWeight: '600', color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.5rem' }}>Gói cước</Link>
      </div>

      {loading && <div>Đang tải danh sách gói cước...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {!loading && !error && plans.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          Chưa có dữ liệu gói cước.
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Mã gói (Code)</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Tên gói</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Badge</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Mức giá</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#111827', fontWeight: '600' }}>{plan.code.toUpperCase()}</td>
                  <td style={{ padding: '1rem', color: '#4b5563' }}>
                    {plan.name}
                    {plan.isHighlighted && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#0ea5e9' }}>(Nổi bật)</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: '#4b5563' }}>{plan.badge || '-'}</td>
                  <td style={{ padding: '1rem', color: '#4b5563' }}>
                    {(plan.prices || []).length > 0 ? (
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {plan.prices.map(price => (
                          <li key={price.id} style={{ fontSize: '0.875rem' }}>
                            {price.amountMinor.toLocaleString('vi-VN')} {price.currency} 
                            {price.durationDays ? ` / ${price.durationDays} ngày` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Chưa thiết lập giá</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: plan.isActive ? '#dcfce7' : '#f3f4f6', 
                      color: plan.isActive ? '#166534' : '#4b5563', 
                      padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' 
                    }}>
                      {plan.isActive ? 'Đang bán' : 'Đã ẩn'}
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
