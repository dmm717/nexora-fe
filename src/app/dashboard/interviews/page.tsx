'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Interviews.module.css';
import { useDashboardSummary } from '@/hooks/queries/useDashboard';
import { ClientDate } from '@/components/ui/ClientDate';

export default function InterviewsIndexPage() {
  const router = useRouter();
  const { data, isLoading: loading } = useDashboardSummary();
  const interviews = data?.interviews || [];

  return (
    <div className={styles.container}>
      <div className={styles.listContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Toàn bộ Lịch sử Phỏng vấn</h2>
          <button 
            onClick={() => router.push('/dashboard/interviews/new')}
            style={{ 
              background: '#1f2937', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
              borderRadius: '999px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
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
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', alignItems: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#111827' }}>{inv.role}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}><ClientDate date={inv.updatedAt} /></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#374151' }}>
                      {inv.status}
                    </span>
                    <Link href={`/dashboard/interviews/${inv.id}`} style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      Xem chi tiết &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
