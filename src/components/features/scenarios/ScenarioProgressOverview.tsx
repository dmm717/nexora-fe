'use client';
import React from 'react';
import Link from 'next/link';
import styles from './ScenarioAcademy.module.css';
import type { ScenarioProgress } from '@/types/scenario';

interface ScenarioProgressOverviewProps {
  progress?: ScenarioProgress;
  onSelectRecommendedDifficulty?: (difficulty: string) => void;
}

export function ScenarioProgressOverview({
  progress,
  onSelectRecommendedDifficulty,
}: ScenarioProgressOverviewProps) {
  const recommended = (progress?.recommendedDifficulty || 'easy').toLowerCase();
  const completedCount = progress?.completedAttempts ?? 0;
  const totalAttempts = progress?.attemptCount ?? 0;
  const avgScore = progress?.averageScore !== null && progress?.averageScore !== undefined
    ? Math.round(progress.averageScore)
    : null;
  const latestScore = progress?.latestScore ?? null;
  const bestScore = progress?.bestScore ?? null;

  const difficultyLabel =
    recommended === 'hard' ? 'Khó' : recommended === 'medium' ? 'Vừa' : 'Dễ';

  const badgeClass =
    recommended === 'hard'
      ? styles.badgeHard
      : recommended === 'medium'
      ? styles.badgeMedium
      : styles.badgeEasy;

  return (
    <>
      {/* Top Header */}
      <header className={styles.topHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Kỹ năng phỏng vấn chuyên sâu
          </div>
          <h1 className={styles.mainTitle}>Scenario Academy</h1>
          <p className={styles.mainSubtitle}>
            Luyện xử lý tình huống thực tế và theo dõi tiến bộ theo kỹ năng.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/dashboard/star-builder" className={styles.btnSecondaryAction}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            STAR Builder tự do
          </Link>
        </div>
      </header>

      {/* Coaching Progress Panel */}
      <section className={styles.coachingPanel} aria-label="Tiến độ và gợi ý luyện tập">
        <div className={styles.coachingNextStep}>
          <div>
            <div className={styles.nextStepEyebrow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Tiếp theo nên luyện
            </div>

            <div className={styles.recommendationHighlight}>
              <span className={styles.recommendationTitle}>Độ khó:</span>
              <span className={`${styles.difficultyPill} ${badgeClass}`}>
                {difficultyLabel}
              </span>
            </div>

            <p className={styles.coachingHint}>
              {completedCount === 0
                ? 'Bắt đầu từ mức Dễ để tạo baseline năng lực trước khi nâng cao.'
                : `Điểm gần nhất: ${latestScore ?? '--'}/100 · Điểm cao nhất: ${bestScore ?? '--'}/100.`}
            </p>
          </div>

          {onSelectRecommendedDifficulty && (
            <div>
              <button
                type="button"
                className={styles.btnSecondaryAction}
                onClick={() => onSelectRecommendedDifficulty(recommended)}
              >
                Xem bài phù hợp ({difficultyLabel})
              </button>
            </div>
          )}
        </div>

        {/* 4 compact metric indicators */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Đã hoàn thành</span>
            <span className={styles.metricValue}>
              {completedCount}
              <span className={styles.metricValueSmall}> / {totalAttempts} lượt</span>
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Điểm trung bình</span>
            <span className={styles.metricValue}>
              {avgScore !== null ? `${avgScore}` : '--'}
              {avgScore !== null && <span className={styles.metricValueSmall}> / 100</span>}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Điểm tốt nhất</span>
            <span className={styles.metricValue}>
              {bestScore !== null ? `${bestScore}` : '--'}
              {bestScore !== null && <span className={styles.metricValueSmall}> / 100</span>}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Lượt gần nhất</span>
            <span className={styles.metricValue}>
              {latestScore !== null ? `${latestScore}` : '--'}
              {latestScore !== null && <span className={styles.metricValueSmall}> / 100</span>}
            </span>
          </div>
        </div>
      </section>

      {/* Track / Category Breakdown Row if available */}
      {progress?.tracks && progress.tracks.length > 0 && (
        <div className={styles.trackSummaryRow}>
          <span className={styles.trackSummaryLabel}>Lĩnh vực:</span>
          {progress.tracks.map((track) => (
            <div key={track.categorySlug} className={styles.trackPill}>
              <span>{track.categoryName}:</span>
              <span className={styles.trackPillStrong}>
                {track.completedAttempts} bài {track.averageScore !== null && `(TB: ${Math.round(track.averageScore)})`}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
