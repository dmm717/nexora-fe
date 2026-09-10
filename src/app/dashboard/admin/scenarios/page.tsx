'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, AdminScenarioView } from '@/services/adminApi';
import Link from 'next/link';

export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<AdminScenarioView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchScenarios = async () => {
      try {
        const data = await adminApi.getScenarios();
        if (isMounted) {
          // If wrapped in an object or array, handle accordingly
          setScenarios(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setError('Không thể tải danh sách kịch bản. Vui lòng kiểm tra quyền truy cập.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchScenarios();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>Quản trị hệ thống</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/dashboard/admin/users" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Người dùng</Link>
        <Link href="/dashboard/admin/scenarios" style={{ fontWeight: '600', color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.5rem' }}>Kịch bản</Link>
        <Link href="/dashboard/admin/plans" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Gói cước</Link>
      </div>

      {loading && <div>Đang tải danh sách kịch bản...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {!loading && !error && scenarios.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          Chưa có dữ liệu kịch bản.
        </div>
      )}

      {!loading && !error && scenarios.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Mã (Slug)</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Tiêu đề</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Độ khó</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(scenario => (
                <tr key={scenario.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#4b5563', fontSize: '0.875rem' }}>{scenario.slug}</td>
                  <td style={{ padding: '1rem', color: '#111827', fontWeight: '500' }}>{scenario.title}</td>
                  <td style={{ padding: '1rem', color: '#4b5563' }}>
                    <span style={{ 
                      backgroundColor: '#f3f4f6', 
                      color: '#4b5563', 
                      padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' 
                    }}>
                      {scenario.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: scenario.status === 'published' ? '#dcfce7' : scenario.status === 'archived' ? '#fee2e2' : '#fef3c7', 
                      color: scenario.status === 'published' ? '#166534' : scenario.status === 'archived' ? '#991b1b' : '#92400e', 
                      padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', textTransform: 'capitalize'
                    }}>
                      {scenario.status}
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
