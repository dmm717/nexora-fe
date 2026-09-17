'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Analytics.module.css';
import { useAnalytics } from '@/hooks/queries/useDashboard';
import { ClientDate } from '@/components/ui/ClientDate';
import { getProgressActivityPresentation } from '@/services/progressDashboardContract';

const getScoreClass = (score: number) => {
  if (score >= 80) return styles.scoreExcellent;
  if (score >= 65) return styles.scoreGood;
  if (score >= 50) return styles.scoreAverage;
  return styles.scorePoor;
};


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

  const isNewUser =
    data.completedInterviews === 0 &&
    data.completedScenarios === 0 &&
    data.completedStarAttempts === 0 &&
    data.recentActivity.length === 0;

  if (isNewUser) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Báo cáo Tiến độ (Progress Analytics)</h1>
          <p className={styles.subtitle}>
            Phân tích chi tiết quá trình luyện tập và hiệu suất trả lời phỏng vấn của bạn.
          </p>
        </header>

        <div className={styles.panel} style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
            Chưa có dữ liệu tiến bộ
          </h2>
          <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            Hãy bắt đầu hoàn thành các buổi phỏng vấn AI, giải quyết tình huống thực tế hoặc phân tích CV để hệ thống ghi nhận tiến độ học tập của bạn.
          </p>
          <div className={styles.emptyActionLinks}>
            <Link href="/resumes" className={styles.btnSecondary}>
              Phân tích CV
            </Link>
            <Link href="/interviews/new" className={styles.btnSecondary}>
              Luyện phỏng vấn
            </Link>
            <Link href="/practice/scenarios" className={styles.btnSecondary}>
              Luyện tình huống
            </Link>
            <Link href="/practice/star" className={styles.btnSecondary}>
              Luyện STAR
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Báo cáo Tiến độ (Progress Analytics)</h1>
        <p className={styles.subtitle}>
          Phân tích chi tiết quá trình luyện tập và hiệu suất trả lời phỏng vấn của bạn.
        </p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Phỏng vấn đã hoàn thành</div>
          <div className={styles.statValue}>{data.completedInterviews}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Điểm Phỏng vấn TB</div>
          <div className={styles.statValue}>
            {data.averageInterviewScore != null ? (
              <>
                <span className={getScoreClass(data.averageInterviewScore)}>
                  {Math.round(data.averageInterviewScore)}
                </span>
                <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>/100</span>
              </>
            ) : (
              <span style={{ fontSize: '1.25rem', color: '#9ca3af', fontWeight: 500 }}>
                Chưa có điểm
              </span>
            )}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tình huống (Scenarios)</div>
          <div className={styles.statValue}>{data.completedScenarios}</div>
          {data.averageScenarioScore != null && (
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Điểm TB: <strong>{Math.round(data.averageScenarioScore)}/100</strong>
            </div>
          )}
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>STAR Builder đã hoàn thành</div>
          <div className={styles.statValue}>{data.completedStarAttempts}</div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* STAR Skills Analysis */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Phân tích kỹ năng S-T-A-R</h2>
          </div>
          {data.starAverages ? (
            <div className={styles.starBars}>
              <div className={styles.barItem}>
                <div className={styles.barHeader}>
                  <span className={styles.barLabel}>Situation (Tình huống)</span>
                  <span className={styles.barScore}>{data.starAverages.situation}/100</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${data.starAverages.situation}%`, backgroundColor: '#3b82f6' }}
                  />
                </div>
              </div>
              <div className={styles.barItem}>
                <div className={styles.barHeader}>
                  <span className={styles.barLabel}>Task (Nhiệm vụ)</span>
                  <span className={styles.barScore}>{data.starAverages.task}/100</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${data.starAverages.task}%`, backgroundColor: '#8b5cf6' }}
                  />
                </div>
              </div>
              <div className={styles.barItem}>
                <div className={styles.barHeader}>
                  <span className={styles.barLabel}>Action (Hành động)</span>
                  <span className={styles.barScore}>{data.starAverages.action}/100</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${data.starAverages.action}%`, backgroundColor: '#10b981' }}
                  />
                </div>
              </div>
              <div className={styles.barItem}>
                <div className={styles.barHeader}>
                  <span className={styles.barLabel}>Result (Kết quả)</span>
                  <span className={styles.barScore}>{data.starAverages.result}/100</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${data.starAverages.result}%`, backgroundColor: '#f59e0b' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Chưa có dữ liệu đánh giá kỹ năng STAR.</p>
              <div className={styles.emptyActionLinks}>
                <Link href="/practice/star" className={styles.btnSecondary}>
                  Luyện kỹ thuật STAR →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Interview Scores & Trend */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Điểm phỏng vấn gần đây</h2>
          </div>
          {data.recentInterviewScores && data.recentInterviewScores.length > 0 ? (
            <div className={styles.scoreList}>
              {data.recentInterviewScores.map((item, idx) => (
                <div key={item.interviewId || idx} className={styles.scoreRow}>
                  <div>
                    <span style={{ fontWeight: 500, color: '#111827' }}>
                      Phỏng vấn #{idx + 1}
                    </span>
                    {item.completedAt && (
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        <ClientDate date={item.completedAt} />
                      </div>
                    )}
                  </div>
                  <span
                    className={getScoreClass(item.score)}
                    style={{ fontSize: '1.25rem', fontWeight: 700 }}
                  >
                    {item.score}/100
                  </span>
                </div>
              ))}
              {data.recentInterviewScores.length < 2 && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Cần ít nhất 2 buổi phỏng vấn để đánh giá xu hướng tiến bộ.
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Chưa có buổi phỏng vấn nào được hoàn thành.</p>
              <div className={styles.emptyActionLinks}>
                <Link href="/interviews/new" className={styles.btnSecondary}>
                  Bắt đầu phỏng vấn ngay →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities Timeline */}
        <div className={styles.panel} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Hoạt động gần đây</h2>
          </div>
          {data.recentActivity && data.recentActivity.length > 0 ? (
            <ul className={styles.timeline}>
              {data.recentActivity.map((activity, idx) => {
                const { label, deepLink } = getProgressActivityPresentation(activity.kind, activity.resourceId);
                return (
                  <li key={`${activity.at}-${activity.kind}-${idx}`} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineType}>
                        {deepLink ? (
                          <Link href={deepLink} className={styles.timelineLink}>
                            {label} →
                          </Link>
                        ) : (
                          label
                        )}
                      </div>
                      {activity.at && (
                        <div className={styles.timelineTime}>
                          <ClientDate date={activity.at} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyState}>Chưa có hoạt động nào gần đây</div>
          )}
        </div>
      </div>
    </div>
  );
}
