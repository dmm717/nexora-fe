'use client';

import React, { useState, useMemo } from 'react';
import styles from './ScenarioAcademy.module.css';
import { getHistoryScoreDelta } from '@/utils/scenarioHelpers';
import type { ScenarioAttemptHistory } from '@/types/scenario';

interface ScenarioHistoryViewProps {
  history: ScenarioAttemptHistory;
  activeAttemptId?: string;
  onSelectAttempt?: (attemptId: string) => void;
}

export function ScenarioHistoryView({
  history,
  activeAttemptId,
  onSelectAttempt,
}: ScenarioHistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const attempts = history?.attempts;

  // Identify the baseline attempt (lowest attemptNumber with non-null score)
  const firstScoredAttemptId = useMemo(() => {
    if (!attempts) return null;
    const scored = [...attempts]
      .filter((a) => a.overallScore !== null && a.overallScore !== undefined)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
    return scored.length > 0 ? scored[0].id : null;
  }, [attempts]);

  if (!history || !history.attempts || history.attempts.length === 0) {
    return null;
  }

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className={styles.historyCard} aria-label="Lịch sử luyện tập">
      <div className={styles.historyHeader}>
        <h3 className={`${styles.panelTitle} ${styles.historyHeaderTitle}`}>
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
          Lịch sử thử sức ({history.attempts.length} lần)
        </h3>

        <div className={styles.historySummary}>
          {history.latestScore !== null && (
            <span>
              Điểm gần nhất: <strong>{history.latestScore}/100</strong>
            </span>
          )}
          {history.bestScore !== null && (
            <span>
              Kỷ lục: <strong className={styles.historyBestScore}>{history.bestScore}/100</strong>
            </span>
          )}
        </div>
      </div>

      <div className={styles.historyList}>
        {history.attempts.map((item) => {
          const isSelected = activeAttemptId === item.id;
          const isExpanded = expandedId === item.id;

          const deltaInfo = getHistoryScoreDelta(
            item.scoreDelta,
            item.overallScore,
            item.id === firstScoredAttemptId
          );

          let deltaNode: React.ReactNode = null;
          if (deltaInfo.type === 'positive') {
            deltaNode = (
              <span className={styles.scoreDeltaPositive} title="Tiến bộ so với lần trước">
                {deltaInfo.text}
              </span>
            );
          } else if (deltaInfo.type === 'negative') {
            deltaNode = (
              <span className={styles.scoreDeltaNegative} title="Giảm so với lần trước">
                {deltaInfo.text}
              </span>
            );
          } else if (deltaInfo.type === 'neutral') {
            deltaNode = <span className={styles.scoreBaseline}>±0</span>;
          } else if (deltaInfo.type === 'baseline') {
            deltaNode = <span className={styles.scoreBaseline}>Khởi điểm</span>;
          }

          const statusLabel =
            item.status === 'completed'
              ? 'Hoàn thành'
              : item.status === 'processing'
              ? 'Đang chấm...'
              : item.status === 'queued'
              ? 'Hàng đợi...'
              : item.status === 'failed'
              ? 'Lỗi'
              : 'Bản nháp';

          return (
            <div
              key={item.id}
              className={`${styles.historyItemRow} ${isSelected ? styles.historyItemRowSelected : ''}`}
            >
              <div className={styles.historyItemPrimary}>
                <span className={styles.historyNumber}>
                  #{item.attemptNumber}
                </span>

                <div className={styles.historyItemMeta}>
                  <span className={styles.historyItemDate}>
                    {formatTime(item.createdAt)}
                  </span>
                  {item.status !== 'completed' && (
                    <span className={styles.historyItemStatus}>
                      {statusLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.historyItemActions}>
                {item.overallScore !== null ? (
                  <span className={styles.historyScore}>
                    {item.overallScore}/100
                  </span>
                ) : (
                  <span className={styles.historyScoreEmpty}>--</span>
                )}

                {deltaNode}

                {item.answer && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    aria-label={isExpanded ? 'Ẩn câu trả lời' : 'Xem lại câu trả lời'}
                    className={`${styles.btnClearFilters} ${styles.historyActionButton}`}
                  >
                    {isExpanded ? 'Thu gọn' : 'Xem bài làm'}
                  </button>
                )}

                {onSelectAttempt && item.status === 'completed' && !isSelected && (
                  <button
                    type="button"
                    className={`${styles.btnSecondaryAction} ${styles.historyReportButton}`}
                    onClick={() => onSelectAttempt(item.id)}
                  >
                    Xem báo cáo
                  </button>
                )}
              </div>

              {isExpanded && item.answer && (
                <div className={styles.answerHistoryQuote}>
                  <p className={styles.historyAnswerLabel}>
                    CÂU TRẢ LỜI ĐÃ NỘP:
                  </p>
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
