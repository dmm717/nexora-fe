'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Interviews.module.css';
import { dashboardApi, InterviewSummary } from '@/services/dashboardApi';

export default function InterviewsIndexPage() {
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    dashboardApi.getDashboardSummary()
      .then(res => {
        setInterviews(res.interviews);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch sử Phỏng vấn</h1>
        <button 
          className={styles.btnPrimary} 
          onClick={() => router.push('/dashboard/interviews/new')}
        >
          + Bắt đầu phỏng vấn
        </button>
      </div>

      <div className={styles.panel}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải...</div>
        ) : interviews.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            Bạn chưa có bài phỏng vấn nào. Hãy bắt đầu ngay!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {interviews.map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{inv.role}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{new Date(inv.updatedAt).toLocaleString('vi-VN')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f3f4f6' }}>
                    {inv.status}
                  </span>
                  <Link href={`/dashboard/interviews/${inv.id}`} style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
