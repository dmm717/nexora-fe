'use client';

import React, { useState } from 'react';
import styles from './ScenarioAcademy.module.css';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className={styles.panelTitle} style={{ margin: 0 }}>
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

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
          {history.latestScore !== null && (
            <span>
              Điểm gần nhất: <strong>{history.latestScore}/100</strong>
            </span>
          )}
          {history.bestScore !== null && (
            <span>
              Kỷ lục: <strong style={{ color: 'var(--sa-accent)' }}>{history.bestScore}/100</strong>
            </span>
          )}
        </div>
      </div>

      <div className={styles.historyList}>
        {history.attempts.map((item) => {
          const isSelected = activeAttemptId === item.id;
          const isExpanded = expandedId === item.id;

          let deltaNode: React.ReactNode = null;
          if (item.scoreDelta !== null && item.scoreDelta !== undefined) {
            if (item.scoreDelta > 0) {
              deltaNode = (
                <span className={styles.scoreDeltaPositive} title="Tiến bộ so với lần trước">
                  +{item.scoreDelta}
                </span>
              );
            } else if (item.scoreDelta < 0) {
              deltaNode = (
                <span className={styles.scoreDeltaNegative} title="Giảm so với lần trước">
                  {item.scoreDelta}
                </span>
              );
            } else {
              deltaNode = <span className={styles.scoreBaseline}>±0</span>;
            }
          } else if (item.attemptNumber === 1 && item.overallScore !== null) {
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
              className={styles.historyItemRow}
              style={
                isSelected
                  ? { borderColor: 'var(--sa-accent)', backgroundColor: 'var(--sa-accent-bg)' }
                  : undefined
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <span className={styles.historyNumber}>
                  #{item.attemptNumber}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sa-text-subtle)' }}>
                    {formatTime(item.createdAt)}
                  </span>
                  {item.status !== 'completed' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--sa-amber-text)' }}>
                      {statusLabel}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {item.overallScore !== null ? (
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sa-text-main)' }}>
                    {item.overallScore}/100
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--sa-text-subtle)' }}>--</span>
                )}

                {deltaNode}

                {item.answer && (
                  <button
                    type="button"
                    className={styles.btnClearFilters}
                    onClick={() => toggleExpand(item.id)}
                    aria-label={isExpanded ? 'Ẩn câu trả lời' : 'Xem lại câu trả lời'}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    {isExpanded ? 'Thu gọn' : 'Xem bài làm'}
                  </button>
                )}

                {onSelectAttempt && item.status === 'completed' && !isSelected && (
                  <button
                    type="button"
                    className={styles.btnSecondaryAction}
                    onClick={() => onSelectAttempt(item.id)}
                    style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                  >
                    Xem báo cáo
                  </button>
                )}
              </div>

              {isExpanded && item.answer && (
                <div
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--sa-border-subtle)',
                    borderRadius: 'var(--sa-radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--sa-text-main)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--sa-text-subtle)' }}>
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
