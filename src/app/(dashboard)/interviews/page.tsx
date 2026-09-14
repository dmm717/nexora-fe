'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Interviews.module.css';
import { useInterviewsHistory } from '@/hooks/queries/useInterviews';
import { ClientDate } from '@/components/ui/ClientDate';

function renderStatusBadge(status: string) {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'starting':
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
          }}
        >
          Đang khởi tạo
        </span>
      );
    case 'active':
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#ecfdf5',
            color: '#047857',
          }}
        >
          Đang diễn ra
        </span>
      );
    case 'completing':
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#f5f3ff',
            color: '#6d28d9',
          }}
        >
          Đang chấm điểm
        </span>
      );
    case 'completed':
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#f3f4f6',
            color: '#374151',
          }}
        >
          Đã hoàn thành
        </span>
      );
    case 'failed':
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          Thất bại
        </span>
      );
    case 'abandoned':
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
          }}
        >
          Đã hủy
        </span>
      );
    default:
      return (
        <span
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: '#f3f4f6',
            color: '#374151',
          }}
        >
          {status}
        </span>
      );
  }
}

export default function InterviewsIndexPage() {
  const router = useRouter();
  const { data, isLoading: loading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInterviewsHistory(20);
  const interviews = data?.pages.flatMap(page => page.items) || [];

  return (
    <div className={styles.container}>
      <div className={styles.listContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Toàn bộ Lịch sử Phỏng vấn</h2>
          <button 
            onClick={() => router.push('/interviews/new')}
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
            <>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {interviews.map(inv => {
                  const targetUrl = inv.reportAvailable
                    ? `/interviews/${inv.id}/report`
                    : `/interviews/${inv.id}`;

                  const interviewTypeLabel: Record<string, string> = {
                    technical: 'Kỹ thuật',
                    behavioral: 'Hành vi',
                    mixed: 'Tổng hợp',
                  };
                  const typeText = interviewTypeLabel[inv.interviewType] || inv.interviewType;

                  const practiceReasonLabel: Record<string, string> = {
                    repeat_question: 'Ôn lại câu hỏi',
                    rubric_weakness: 'Cải thiện điểm yếu',
                    recommendation: 'Theo đề xuất',
                    manual: 'Luyện tập lại',
                  };

                  return (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '12px', alignItems: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#111827' }}>{inv.role || 'Phỏng vấn'}</span>
                          {inv.seniority && (
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>· {inv.seniority}</span>
                          )}
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                            {typeText}
                          </span>
                          {inv.practiceReason && (
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#92400e' }}>
                              🔁 {practiceReasonLabel[inv.practiceReason] || inv.practiceReason}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.825rem', color: '#6b7280' }}>
                          <ClientDate date={inv.updatedAt || inv.createdAt} />
                          <span style={{ color: '#d1d5db' }}>|</span>
                          <span>
                            {inv.answeredQuestionCount}/{inv.issuedQuestionCount} câu
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, marginLeft: '1rem' }}>
                        {renderStatusBadge(inv.status)}
                        <Link href={targetUrl} style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          {inv.reportAvailable ? 'Xem báo cáo →' : 'Xem chi tiết →'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
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
                    {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm lịch sử'}
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
