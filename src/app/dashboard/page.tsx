'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './DashboardPage.module.css';
import { dashboardApi, DashboardResponse } from '@/services/dashboardApi';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getDashboardSummary()
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Không thể tải dữ liệu Dashboard');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className={styles.container}>Đang tải dữ liệu...</div>;
  }

  if (error || !data) {
    return <div className={styles.container}>
      <div className={styles.emptyState}>{error || 'Có lỗi xảy ra'}</div>
    </div>;
  }

  // Calculate some quick stats
  const totalInterviews = data.interviews.length;
  const completedInterviews = data.interviews.filter(i => i.status.toLowerCase() === 'completed').length;
  const totalReports = data.reports.length;
  const avgScore = totalReports > 0 
    ? Math.round(data.reports.reduce((acc, r) => acc + r.overallScore, 0) / totalReports)
    : 0;

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'ready') return styles.badgeSuccess;
    if (s === 'failed') return styles.badgeError;
    if (s === 'queued' || s === 'processing') return styles.badgeWarning;
    return styles.badgeInfo;
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.scoreExcellent;
    if (score >= 65) return styles.scoreGood;
    if (score >= 50) return styles.scoreAverage;
    return styles.scorePoor;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng quan</h1>
        <p className={styles.subtitle}>Theo dõi tiến độ luyện tập phỏng vấn của bạn</p>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tổng Phỏng vấn</div>
          <div className={styles.statValue}>{totalInterviews}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Đã hoàn thành</div>
          <div className={styles.statValue}>{completedInterviews}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Điểm trung bình</div>
          <div className={styles.statValue}>
            {totalReports > 0 ? (
              <>
                <span className={getScoreClass(avgScore)}>{avgScore}</span>
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8', marginLeft: '4px' }}>/ 100</span>
              </>
            ) : (
              <span style={{ color: '#9ca3af' }}>N/A</span>
            )}
          </div>
        </div>
        {data.billing?.entitlement && (
          <div className={styles.statCard}>
            <div className={styles.statTitle}>AI Credits (Còn lại)</div>
            <div className={styles.statValue} style={{ fontSize: data.billing.entitlement.available == null ? '1.25rem' : undefined }}>
              {data.billing.entitlement.available != null
                ? data.billing.entitlement.available.toLocaleString('vi-VN')
                : 'Không giới hạn'}
            </div>
          </div>
        )}
      </div>

      <div className={styles.contentGrid}>
        {/* Interviews List */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.panelTitle} style={{ margin: 0 }}>Phỏng vấn gần đây</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6' }}
            >
              Xem tất cả &rarr;
            </button>
          </div>
          {data.interviews.length === 0 ? (
            <div className={styles.emptyState}>Chưa có bài phỏng vấn nào</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vị trí</th>
                    <th>Cập nhật</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.interviews.slice(0, 5).map(interview => (
                    <tr key={interview.id}>
                      <td style={{ fontWeight: 600 }}>{interview.role}</td>
                      <td>{new Date(interview.updatedAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(interview.status)}`}>
                          {interview.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Kết quả phỏng vấn</h2>
          </div>
          {data.reports.length === 0 ? (
            <div className={styles.emptyState}>Chưa có báo cáo nào</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ngày tạo</th>
                    <th>Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reports.slice(0, 5).map(report => (
                    <tr key={report.id}>
                      <td style={{ fontFamily: 'monospace', color: '#64748b' }}>
                        #{report.id.slice(0, 8)}
                      </td>
                      <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={getScoreClass(report.overallScore)} style={{ fontWeight: 700 }}>
                          {report.overallScore}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '4px' }}>/ 100</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && data && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Lịch sử phỏng vấn</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {data.interviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chưa có bài phỏng vấn nào.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.interviews.map(inv => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', alignItems: 'center', backgroundColor: '#fff' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>{inv.role}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{new Date(inv.updatedAt).toLocaleString('vi-VN')}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className={`${styles.badge} ${getStatusBadgeClass(inv.status)}`}>
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
      )}
    </div>
  );
}
