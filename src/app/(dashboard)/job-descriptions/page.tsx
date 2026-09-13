'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJobDescriptionsHistory } from '@/hooks/queries/useJobDescriptions';
import { ClientDate } from '@/components/ui/ClientDate';
import styles from '../interviews/Interviews.module.css'; // Reusing interviews layout

export default function JobDescriptionsIndexPage() {
  const router = useRouter();
  const { data, isLoading: loading, hasNextPage, isFetchingNextPage, fetchNextPage } = useJobDescriptionsHistory(20);
  const jds = data?.pages.flatMap(page => page.items) || [];

  return (
    <div className={styles.container}>
      <div className={styles.listContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Lịch sử Job Descriptions</h2>
          <button 
            onClick={() => router.push('/job-descriptions/new')}
            style={{ 
              background: '#1f2937', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
              borderRadius: '999px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            + Thêm JD mới
          </button>
        </div>
        
        <div className={styles.panel}>
          {loading ? (
            <div className={styles.loadingState}>Đang tải...</div>
          ) : jds.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
              Bạn chưa lưu Job Description nào.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {jds.map(jd => (
                  <div key={jd.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '12px', alignItems: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#111827' }}>
                        {jd.title || 'Job Description không tên'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Đã tạo: <ClientDate date={jd.createdAt} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Link href={`/job-descriptions/${jd.id}`} style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                        Xem chi tiết →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {hasNextPage && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    style={{
                      padding: '0.5rem 1.5rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: isFetchingNextPage ? 'not-allowed' : 'pointer',
                      opacity: isFetchingNextPage ? 0.7 : 1,
                    }}
                  >
                    {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
