'use client';

import React, { useEffect, useState } from 'react';
import styles from './DashboardPage.module.css';
import { dashboardApi, DashboardResponse } from '@/services/dashboardApi';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <span className={getScoreClass(avgScore)}>{avgScore} / 100</span>
            ) : (
              <span style={{ color: '#9ca3af' }}>N/A</span>
            )}
          </div>
        </div>
        {data.billing?.entitlement && (
          <div className={styles.statCard}>
            <div className={styles.statTitle}>AI Credits (Còn lại)</div>
            <div className={styles.statValue}>{data.billing.entitlement.available.toLocaleString('vi-VN')}</div>
          </div>
        )}
      </div>

      <div className={styles.contentGrid}>
        {/* Interviews List */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Phỏng vấn gần đây</h2>
          </div>
          {data.interviews.length === 0 ? (
            <div className={styles.emptyState}>Chưa có bài phỏng vấn nào</div>
          ) : (
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
                    <td style={{ fontWeight: 500 }}>{interview.role}</td>
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
          )}
        </div>

        {/* Reports List */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Báo cáo kết quả</h2>
          </div>
          {data.reports.length === 0 ? (
            <div className={styles.emptyState}>Chưa có báo cáo nào</div>
          ) : (
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
                    <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>
                      #{report.id.slice(0, 8)}
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className={getScoreClass(report.overallScore)}>
                      {report.overallScore} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
