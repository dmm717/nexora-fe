'use client';

import React from 'react';
import styles from './ScenarioAcademy.module.css';
import type { ScenarioEvaluation } from '@/types/scenario';

interface ScenarioEvaluationViewProps {
  evaluation: ScenarioEvaluation;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ScenarioEvaluationView({
  evaluation,
  onRetry,
  isRetrying = false,
}: ScenarioEvaluationViewProps) {
  const score = evaluation.overallScore ?? 0;

  const getBadgeClass = (s: number) => {
    if (s >= 80) return styles.badgeEasy; // emerald
    if (s >= 60) return styles.badgeMedium; // amber
    return styles.badgeHard; // rose
  };

  return (
    <div className={styles.evaluationSection} aria-label="Kết quả đánh giá tình huống">
      {/* Overall Score Hero */}
      <section className={styles.evalScoreHero}>
        <div className={styles.scoreGaugeWrap}>
          <div className={styles.scoreCircle} aria-label={`Điểm tổng quan: ${score} trên 100`}>
            <span>{score}</span>
            <small>/100</small>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.375rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              Đánh giá tổng quan
            </h3>
            <p className={styles.scoreFeedbackText}>
              {evaluation.feedback ||
                (score >= 80
                  ? 'Phản xạ xử lý tình huống rất xuất sắc, logic mạch lạc và thể hiện năng lực chuyên môn vững vàng.'
                  : score >= 60
                  ? 'Xử lý tình huống tương đối tốt. Cần bổ sung chi tiết hành động và đo lường kết quả cụ thể hơn.'
                  : 'Phần phản hồi còn chung chung hoặc thiếu các bước giải quyết mấu chốt. Xem chi tiết bên dưới để cải thiện.')}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            className={styles.btnSecondaryAction}
            onClick={onRetry}
            disabled={isRetrying}
            style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}
          >
            {isRetrying ? (
              <>
                <span className={styles.spinnerLarge} style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                <span>Đang tạo lượt mới...</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Thử lại tình huống</span>
              </>
            )}
          </button>
        )}
      </section>

      {/* Dimensions Breakdown */}
      {evaluation.dimensions && evaluation.dimensions.length > 0 && (
        <section aria-label="Phân tích theo tiêu chí">
          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--sa-text-main)' }}>
            Phân tích theo tiêu chí
          </h4>
          <div className={styles.dimensionGrid}>
            {evaluation.dimensions.map((dim) => (
              <div key={dim.criterion} className={styles.dimensionCard}>
                <div className={styles.dimensionHeader}>
                  <span className={styles.dimensionName}>{dim.criterion}</span>
                  <span className={`${styles.dimensionScoreBadge} ${getBadgeClass(dim.score)}`}>
                    {dim.score}/100
                  </span>
                </div>

                {dim.evidence && (
                  <blockquote className={styles.dimensionEvidence} cite="">
                    &ldquo;{dim.evidence}&rdquo;
                  </blockquote>
                )}

                <p className={styles.dimensionFeedback}>{dim.feedback}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strengths & Gaps */}
      <div className={styles.strengthsGapsGrid}>
        {/* Strengths */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className={styles.strengthsCard}>
            <div className={styles.cardSectionHeader} style={{ color: 'var(--sa-emerald-text)' }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Điểm mạnh ghi nhận</span>
            </div>
            <ul className={styles.bulletList}>
              {evaluation.strengths.map((str, idx) => (
                <li key={`str-${idx}`} className={styles.bulletItem}>
                  <span className={styles.bulletIconEmerald}>•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {evaluation.gaps && evaluation.gaps.length > 0 && (
          <div className={styles.gapsCard}>
            <div className={styles.cardSectionHeader} style={{ color: 'var(--sa-amber-text)' }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Điểm cần hoàn thiện</span>
            </div>
            <ul className={styles.bulletList}>
              {evaluation.gaps.map((gap, idx) => (
                <li key={`gap-${idx}`} className={styles.bulletItem}>
                  <span className={styles.bulletIconAmber}>•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended Approach */}
      {evaluation.recommendedApproach && evaluation.recommendedApproach.length > 0 && (
        <section
          className={styles.panelCard}
          style={{ borderLeft: '4px solid var(--sa-accent)' }}
          aria-label="Hướng tiếp cận đề xuất"
        >
          <div className={styles.cardSectionHeader} style={{ color: 'var(--sa-accent)' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            <span>Hướng tiếp cận chuyên gia khuyến nghị</span>
          </div>
          <ul className={styles.bulletList}>
            {evaluation.recommendedApproach.map((step, idx) => (
              <li key={`step-${idx}`} className={styles.bulletItem}>
                <span
                  style={{
                    color: 'var(--sa-accent)',
                    fontWeight: 700,
                    marginRight: '0.25rem',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
