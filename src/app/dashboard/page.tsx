'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './DashboardPage.module.css';
import { useDashboardSummary } from '@/hooks/queries/useDashboard';
import { useProgressDashboard } from '@/hooks/queries/useProgressDashboard';
import { ClientDate } from '@/components/ui/ClientDate';
import { NextPracticeRecommendationContent } from '@/components/features/recommendations/NextPracticeRecommendationCard';
import { ApiError } from '@/services/apiClient';

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

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading: loading, error: queryError } = useDashboardSummary();
  const {
    data: progressData,
    isLoading: progressLoading,
    error: progressError,
  } = useProgressDashboard();

  const error = queryError ? 'Không thể tải dữ liệu Dashboard' : null;

  if (loading) {
    return <div className={styles.container}>Đang tải dữ liệu...</div>;
  }

  if (error || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>{error || 'Có lỗi xảy ra'}</div>
      </div>
    );
  }

  // Calculate legacy interview counts (fallback if historicalStats is absent)
  const totalInterviews =
    progressData?.historicalStats?.completedInterviews ?? data.interviews.length;
  const completedInterviews =
    progressData?.historicalStats?.completedInterviews ??
    data.interviews.filter((i) => i.status.toLowerCase() === 'completed').length;
  const totalReports = data.reports.length;
  const avgScore =
    progressData?.historicalStats?.averageInterviewScore != null
      ? Math.round(progressData.historicalStats.averageInterviewScore)
      : totalReports > 0
      ? Math.round(data.reports.reduce((acc, r) => acc + r.overallScore, 0) / totalReports)
      : null;

  const isFeatureNotAvailable =
    progressError instanceof ApiError &&
    progressError.code === 'FEATURE_NOT_AVAILABLE';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng quan</h1>
        <p className={styles.subtitle}>
          Theo dõi tiến độ phát triển năng lực và luyện tập phỏng vấn của bạn
        </p>
      </header>

      {/* Feature Gate Banner for ProgressAnalytics if unentitled */}
      {isFeatureNotAvailable && (
        <div className={styles.entitlementBanner} role="alert">
          <div>
            <div className={styles.entitlementTitle}>
              Tính năng Phân tích tiến độ nâng cao (Progress Analytics)
            </div>
            <div className={styles.entitlementMsg}>
              Gói tài khoản hiện tại chưa hỗ trợ xem chỉ số sẵn sàng và phân tích tiến độ tuần.
            </div>
          </div>
          <Link href="/dashboard/billing" className={styles.badgeInfo} style={{ textDecoration: 'none' }}>
            Nâng cấp gói cước →
          </Link>
        </div>
      )}

      {/* Stats Cards (combines Readiness & Overall Stats) */}
      <div className={styles.statsGrid}>
        {/* Readiness Score (B13) */}
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Chỉ số sẵn sàng (Readiness)</div>
          <div className={styles.statValue}>
            {progressData?.readiness?.score != null ? (
              <>
                <span className={getScoreClass(progressData.readiness.score)}>
                  {progressData.readiness.score}
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#94a3b8',
                    marginLeft: '4px',
                  }}
                >
                  / 100
                </span>
              </>
            ) : (
              <span style={{ color: '#9ca3af', fontSize: '1.25rem' }}>
                {progressLoading ? 'Đang tải...' : 'Chưa đủ dữ liệu'}
              </span>
            )}
          </div>
          {progressData?.readiness && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
              {progressData.readiness.assessedCompetencies} năng lực · {progressData.readiness.evidenceCount} bằng chứng
              {progressData.readiness.priorityGapCount > 0 && (
                <span> · <strong style={{ color: '#ef4444' }}>{progressData.readiness.priorityGapCount} thiếu sót</strong></span>
              )}
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tổng Phỏng vấn</div>
          <div className={styles.statValue}>{totalInterviews}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTitle}>Đã hoàn thành</div>
          <div className={styles.statValue}>{completedInterviews}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTitle}>Điểm phỏng vấn TB</div>
          <div className={styles.statValue}>
            {avgScore != null ? (
              <>
                <span className={getScoreClass(avgScore)}>{avgScore}</span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#94a3b8',
                    marginLeft: '4px',
                  }}
                >
                  / 100
                </span>
              </>
            ) : (
              <span style={{ color: '#9ca3af' }}>N/A</span>
            )}
          </div>
        </div>

        {data.billing?.entitlement && (
          <div className={styles.statCard}>
            <div className={styles.statTitle}>AI Credits (Còn lại)</div>
            <div
              className={styles.statValue}
              style={{
                fontSize:
                  data.billing.entitlement.available == null
                    ? '1.25rem'
                    : undefined,
              }}
            >
              {data.billing.entitlement.available != null
                ? data.billing.entitlement.available.toLocaleString('vi-VN')
                : 'Không giới hạn'}
            </div>
          </div>
        )}
      </div>

      {/* B12 Next Recommendation (Pure presentation component fed from B13 dashboard snapshot to avoid duplicate fetch) */}
      <NextPracticeRecommendationContent
        recommendation={progressData?.nextRecommendedPractice}
        isLoading={progressLoading}
      />

      {/* Weekly Activities Summary (B13) */}
      {progressData?.weeklyCompletedActivities && (
        <section aria-label="Hoạt động trong tuần">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Hoạt động trong tuần này (UTC)</h2>
            <p className={styles.sectionSubtitle}>
              Tổng hợp bài luyện tập và phân tích bạn đã hoàn thành tuần này
            </p>
          </div>
          <div className={styles.weeklyGrid}>
            <div className={`${styles.weeklyCard} ${styles.weeklyCardTotal}`}>
              <div className={styles.weeklyLabel}>Tổng hoạt động</div>
              <div className={styles.weeklyValue}>
                {progressData.weeklyCompletedActivities.total}
              </div>
            </div>
            <div className={styles.weeklyCard}>
              <div className={styles.weeklyLabel}>Phỏng vấn</div>
              <div className={styles.weeklyValue}>
                {progressData.weeklyCompletedActivities.interviews}
              </div>
            </div>
            <div className={styles.weeklyCard}>
              <div className={styles.weeklyLabel}>Tình huống</div>
              <div className={styles.weeklyValue}>
                {progressData.weeklyCompletedActivities.scenarios}
              </div>
            </div>
            <div className={styles.weeklyCard}>
              <div className={styles.weeklyLabel}>STAR Drill</div>
              <div className={styles.weeklyValue}>
                {progressData.weeklyCompletedActivities.starAttempts}
              </div>
            </div>
            <div className={styles.weeklyCard}>
              <div className={styles.weeklyLabel}>Phân tích CV</div>
              <div className={styles.weeklyValue}>
                {progressData.weeklyCompletedActivities.resumeAnalyses}
              </div>
            </div>
            <div className={styles.weeklyCard}>
              <div className={styles.weeklyLabel}>Lộ trình học</div>
              <div className={styles.weeklyValue}>
                {progressData.weeklyCompletedActivities.learningPathActivities}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* B13 Weakest Competencies & Recent Improvements Grid */}
      {progressData && (
        <div className={styles.contentGrid} style={{ marginBottom: '2rem' }}>
          {/* Weakest Competencies Panel */}
          <div className={styles.panel}>
            <div
              className={styles.panelHeader}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 className={styles.panelTitle} style={{ margin: 0 }}>
                Kỹ năng cần ưu tiên cải thiện
              </h2>
              <Link
                href="/dashboard/skill-profile"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#3b82f6',
                  textDecoration: 'none',
                }}
              >
                Hồ sơ kỹ năng →
              </Link>
            </div>
            {progressData.weakestCompetencies.length === 0 ? (
              <div className={styles.emptyState}>
                Chưa ghi nhận điểm yếu kỹ năng nào đáng chú ý
              </div>
            ) : (
              <div className={styles.competencyList}>
                {progressData.weakestCompetencies.map((comp) => (
                  <div key={comp.code} className={styles.competencyItem}>
                    <div>
                      <div className={styles.competencyName}>{comp.name}</div>
                      <div className={styles.competencyCategory}>
                        {comp.category}
                      </div>
                    </div>
                    <div className={styles.competencyScoreGroup}>
                      <div className={styles.competencyScore}>{comp.score}/100</div>
                      <div className={styles.competencyEvidence}>
                        {comp.evidenceCount} bằng chứng
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Improvements Panel */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Cải thiện gần đây</h2>
            </div>
            {progressData.recentImprovements.length === 0 ? (
              <div className={styles.emptyState}>
                Chưa có sự tiến bộ điểm số nào được ghi nhận gần đây
              </div>
            ) : (
              <div>
                {progressData.recentImprovements.map((imp, idx) => (
                  <div
                    key={`${imp.resourceId}-${idx}`}
                    className={styles.improvementItem}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        Phỏng vấn
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          marginLeft: '0.5rem',
                        }}
                      >
                        <ClientDate date={imp.at} format="date" />
                      </span>
                    </div>
                    <div className={styles.improvementScore}>
                      <span style={{ color: '#64748b' }}>
                        {imp.previousScore} → {imp.currentScore}
                      </span>
                      <span className={styles.deltaBadge}>+{imp.delta}</span>
                      <Link
                        href={`/dashboard/interviews/${imp.resourceId}`}
                        style={{
                          fontSize: '0.8rem',
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        Xem →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                      <td><ClientDate date={interview.updatedAt} format="date" /></td>
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
                      <td><ClientDate date={report.createdAt} format="date" /></td>
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
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}><ClientDate date={inv.updatedAt} /></div>
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
