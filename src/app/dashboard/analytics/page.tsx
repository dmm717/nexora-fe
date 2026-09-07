'use client';

import React from 'react';
import styles from './Analytics.module.css';
import { useAnalytics } from '@/hooks/queries/useDashboard';

export default function AnalyticsPage() {
  const { data, isLoading: loading, error: queryError } = useAnalytics();
  const error = queryError ? queryError.message || 'Lỗi tải dữ liệu Analytics' : null;

  if (loading) {
    return <div className={styles.container}>Đang tải dữ liệu báo cáo tiến độ...</div>;
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>{error || 'Không có dữ liệu'}</div>
      </div>
    );
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.scoreExcellent;
    if (score >= 65) return styles.scoreGood;
    if (score >= 50) return styles.scoreAverage;
    return styles.scorePoor;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Báo cáo Tiến độ (Progress Analytics)</h1>
        <p className={styles.subtitle}>Phân tích chi tiết quá trình luyện tập và hiệu suất trả lời phỏng vấn của bạn.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Phỏng vấn đã hoàn thành</div>
          <div className={styles.statValue}>{data.completedInterviews}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Điểm Phỏng vấn Trung bình</div>
          <div className={styles.statValue}>
            <span className={getScoreClass(data.averageInterviewScore)}>{data.averageInterviewScore}</span>
            <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>/100</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tình huống (Scenarios) đã giải quyết</div>
          <div className={styles.statValue}>{data.completedScenarios}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>STAR Builder đã hoàn thành</div>
          <div className={styles.statValue}>{data.completedStarAttempts}</div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Biểu đồ điểm S-T-A-R */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Phân tích kỹ năng S-T-A-R</h2>
          </div>
          <div className={styles.starBars}>
            <div className={styles.barItem}>
              <div className={styles.barHeader}>
                <span className={styles.barLabel}>Situation (Tình huống)</span>
                <span className={styles.barScore}>{data.starAverages.situation}/100</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${data.starAverages.situation}%`, backgroundColor: '#3b82f6' }}></div>
              </div>
            </div>
            <div className={styles.barItem}>
              <div className={styles.barHeader}>
                <span className={styles.barLabel}>Task (Nhiệm vụ)</span>
                <span className={styles.barScore}>{data.starAverages.task}/100</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${data.starAverages.task}%`, backgroundColor: '#8b5cf6' }}></div>
              </div>
            </div>
            <div className={styles.barItem}>
              <div className={styles.barHeader}>
                <span className={styles.barLabel}>Action (Hành động)</span>
                <span className={styles.barScore}>{data.starAverages.action}/100</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${data.starAverages.action}%`, backgroundColor: '#10b981' }}></div>
              </div>
            </div>
            <div className={styles.barItem}>
              <div className={styles.barHeader}>
                <span className={styles.barLabel}>Result (Kết quả)</span>
                <span className={styles.barScore}>{data.starAverages.result}/100</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${data.starAverages.result}%`, backgroundColor: '#f59e0b' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lịch sử hoạt động gần đây */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Hoạt động gần đây</h2>
          </div>
          {data.recentActivity && data.recentActivity.length > 0 ? (
            <ul className={styles.timeline}>
              {data.recentActivity.map((activity, index) => (
                <li key={index} className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineType}>{activity.type}</div>
                    <div className={styles.timelineTime}>{new Date(activity.timestamp).toLocaleString('vi-VN')}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>Chưa có hoạt động nào gần đây</div>
          )}
        </div>
      </div>
    </div>
  );
}
