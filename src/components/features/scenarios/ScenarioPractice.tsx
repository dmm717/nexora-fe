'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import styles from './ScenarioAcademy.module.css';
import {
  useScenarioAttempt,
  useScenarioAttemptHistory,
  useCreateScenarioAttempt,
  useSubmitScenarioAttempt,
  useRetryScenario,
} from '@/hooks/queries/useScenarios';
import { ScenarioEvaluationView } from './ScenarioEvaluationView';
import { ScenarioHistoryView } from './ScenarioHistoryView';
import { generateIdempotencyKey } from '@/services/scenarioApi';
import type { ScenarioDetail } from '@/types/scenario';

interface ScenarioPracticeProps {
  scenario: ScenarioDetail;
}

const FormattedScenarioContent = ({ text }: { text: string }) => {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        const lineKey = `line-${i}`;
        if (!trimmed) return <br key={lineKey} />;
        if (trimmed.startsWith('## ')) {
          return (
            <h4
              key={lineKey}
              style={{
                marginTop: '1.25rem',
                marginBottom: '0.5rem',
                color: 'var(--sa-text-main)',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              {trimmed.replace('## ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h3
              key={lineKey}
              style={{
                marginTop: '1.5rem',
                marginBottom: '0.5rem',
                color: 'var(--sa-text-main)',
                fontWeight: 800,
                fontSize: '1.125rem',
              }}
            >
              {trimmed.replace('# ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <li
              key={lineKey}
              style={{
                marginLeft: '1.25rem',
                marginBottom: '0.375rem',
                color: 'var(--sa-text-main)',
              }}
            >
              {trimmed.replace('- ', '')}
            </li>
          );
        }

        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(trimmed)) {
          const parts = trimmed.split(boldRegex);
          return (
            <p key={lineKey} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
              {parts.map((part, idx) =>
                idx % 2 === 1 ? (
                  <strong key={`bold-${idx}`} style={{ color: 'var(--sa-text-main)' }}>
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        }
        return (
          <p key={lineKey} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
            {trimmed}
          </p>
        );
      })}
    </>
  );
};

export function ScenarioPractice({ scenario }: ScenarioPracticeProps) {
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [userAnswerText, setUserAnswerText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stable idempotency keys for client retry resilience
  const createIdempotencyKeyRef = useRef<string>(generateIdempotencyKey());
  const submitIdempotencyKeyRef = useRef<string>(generateIdempotencyKey());
  const retryIdempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  const { data: history, isLoading: historyLoading } = useScenarioAttemptHistory(scenario.slug);

  // Derive active attempt ID without setState in effect
  const activeAttemptId = useMemo(() => {
    if (selectedAttemptId) return selectedAttemptId;
    if (!history?.attempts || history.attempts.length === 0) return null;
    const inProgress = history.attempts.find(
      (a) => a.status === 'draft' || a.status === 'queued' || a.status === 'processing'
    );
    return inProgress ? inProgress.id : history.attempts[0].id;
  }, [selectedAttemptId, history]);

  const { data: currentAttempt, isLoading: attemptLoading } = useScenarioAttempt(
    activeAttemptId || ''
  );

  const createAttemptMutation = useCreateScenarioAttempt();
  const submitAttemptMutation = useSubmitScenarioAttempt();
  const retryMutation = useRetryScenario();

  // Answer text is either user typed value or stored draft answer
  const answerText = userAnswerText !== null ? userAnswerText : currentAttempt?.answer || '';

  const diff = (scenario.difficulty || 'easy').toLowerCase();
  const diffLabel = diff === 'hard' ? 'Khó' : diff === 'medium' ? 'Vừa' : 'Dễ';
  const badgeClass =
    diff === 'hard'
      ? styles.badgeHard
      : diff === 'medium'
      ? styles.badgeMedium
      : styles.badgeEasy;

  // Handler: Start a fresh attempt
  const handleStartAttempt = async () => {
    setErrorMessage(null);
    try {
      const attempt = await createAttemptMutation.mutateAsync({
        scenarioId: scenario.id,
        idempotencyKey: createIdempotencyKeyRef.current,
      });
      // Reset idempotency key for future requests
      createIdempotencyKeyRef.current = generateIdempotencyKey();
      setSelectedAttemptId(attempt.id);
      setUserAnswerText(attempt.answer || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo lượt luyện tập.';
      setErrorMessage(msg);
    }
  };

  // Handler: Submit answer
  const handleSubmit = async () => {
    if (!activeAttemptId) return;
    if (!answerText.trim()) {
      setErrorMessage('Vui lòng nhập câu trả lời trước khi gửi đánh giá.');
      return;
    }

    setErrorMessage(null);
    try {
      await submitAttemptMutation.mutateAsync({
        attemptId: activeAttemptId,
        answer: answerText.trim(),
        idempotencyKey: submitIdempotencyKeyRef.current,
      });
      // Reset submit idempotency key on success
      submitIdempotencyKeyRef.current = generateIdempotencyKey();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gửi bài đánh giá.';
      setErrorMessage(msg);
    }
  };

  // Handler: Retry / New attempt for this scenario
  const handleRetry = async () => {
    setErrorMessage(null);
    try {
      const attempt = await retryMutation.mutateAsync({
        scenarioId: scenario.id,
        idempotencyKey: retryIdempotencyKeyRef.current,
      });
      retryIdempotencyKeyRef.current = generateIdempotencyKey();
      setSelectedAttemptId(attempt.id);
      setUserAnswerText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo lượt thử mới.';
      setErrorMessage(msg);
    }
  };

  const attemptStatus = currentAttempt?.status;

  return (
    <div className={styles.practiceContainer}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbBar} aria-label="Breadcrumb">
        <Link href="/dashboard" className={styles.breadcrumbLink}>
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/scenarios" className={styles.breadcrumbLink}>
          Scenario Academy
        </Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>{scenario.title}</span>
      </nav>

      {/* Header */}
      <header className={styles.practiceHeader}>
        <div className={styles.practiceMetaRow}>
          <span className={styles.cardCategory}>{scenario.categoryName}</span>
          <span className={`${styles.difficultyPill} ${badgeClass}`}>{diffLabel}</span>
          {scenario.competency && (
            <span className={styles.competencyBadge}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {scenario.competency}
            </span>
          )}
          <span className={styles.timeBadge}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Ước lượng: {scenario.estimatedMinutes} phút
          </span>
        </div>

        <h1 className={styles.practiceTitle}>{scenario.title}</h1>
        <p className={styles.practiceSummary}>{scenario.summary}</p>
      </header>

      {/* Error alert if any */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--sa-rose-bg)',
            border: '1px solid var(--sa-rose-border)',
            color: 'var(--sa-rose-text)',
            borderRadius: 'var(--sa-radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Workbench Split Layout */}
      <div className={styles.workbenchLayout}>
        {/* Left Column: Scenario Briefing */}
        <section className={styles.panelCard} aria-label="Nội dung tình huống">
          <h2 className={styles.panelTitle}>
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Bối cảnh & Đề bài tình huống
          </h2>

          <div className={styles.scenarioContentBody}>
            <FormattedScenarioContent text={scenario.content || scenario.summary} />
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--sa-border-subtle)',
              borderRadius: 'var(--sa-radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--sa-text-muted)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--sa-text-main)', display: 'block', marginBottom: '0.25rem' }}>
              💡 Gợi ý cấu trúc trả lời hiệu quả:
            </strong>
            1. <strong>Phân tích vấn đề:</strong> Xác định rủi ro cốt lõi, người liên quan chính.
            <br />
            2. <strong>Hành động cụ thể:</strong> Các bước xử lý ngay lập tức và giải pháp dài hạn.
            <br />
            3. <strong>Đo lường & Bài học:</strong> Kết quả đạt được hoặc cơ chế phòng ngừa lặp lại.
          </div>
        </section>

        {/* Right Column: Interactive Practice / Evaluation */}
        <section className={styles.panelCard} aria-label="Khu vực làm bài và đánh giá">
          {!activeAttemptId && !historyLoading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--sa-accent-bg)',
                  color: 'var(--sa-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Sẵn sàng thử sức với tình huống này?
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--sa-text-muted)',
                  maxWidth: '380px',
                  margin: '0 auto 1.5rem',
                  lineHeight: 1.5,
                }}
              >
                Khởi tạo một lượt luyện tập mới để nhận phản hồi chuyên sâu và đo lường tiến bộ kỹ năng.
              </p>
              <button
                type="button"
                className={styles.btnPracticeAction}
                onClick={handleStartAttempt}
                disabled={createAttemptMutation.isPending}
                style={{ maxWidth: '240px', margin: '0 auto' }}
              >
                {createAttemptMutation.isPending ? 'Đang khởi tạo...' : 'Bắt đầu làm bài'}
              </button>
            </div>
          )}

          {activeAttemptId && attemptLoading && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div className={styles.spinnerLarge} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--sa-text-muted)' }}>
                Đang tải dữ liệu bài làm...
              </p>
            </div>
          )}

          {activeAttemptId && !attemptLoading && (
            <>
              {/* State 1: DRAFT */}
              {attemptStatus === 'draft' && (
                <div>
                  <h3 className={styles.panelTitle}>
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
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Câu trả lời của bạn
                  </h3>

                  <label htmlFor="scenario-answer-input" className="sr-only">
                    Nội dung câu trả lời xử lý tình huống
                  </label>
                  <textarea
                    id="scenario-answer-input"
                    className={styles.answerTextarea}
                    placeholder="Mô tả chi tiết cách bạn sẽ xử lý tình huống này theo bối cảnh thực tế..."
                    value={answerText}
                    onChange={(e) => setUserAnswerText(e.target.value)}
                    rows={10}
                    disabled={submitAttemptMutation.isPending}
                  />

                  <div className={styles.textareaMeta}>
                    <span>
                      Độ dài:{' '}
                      <strong
                        style={{
                          color:
                            answerText.length >= 50
                              ? 'var(--sa-text-main)'
                              : 'var(--sa-amber-text)',
                        }}
                      >
                        {answerText.length} ký tự
                      </strong>
                      {answerText.length < 50 && ' (khuyến nghị tối thiểu 50 ký tự)'}
                    </span>
                    <span>Tự động lưu trạng thái nháp</span>
                  </div>

                  <button
                    type="button"
                    className={styles.btnPracticeAction}
                    onClick={handleSubmit}
                    disabled={submitAttemptMutation.isPending || !answerText.trim()}
                  >
                    {submitAttemptMutation.isPending ? (
                      <>
                        <span
                          className={styles.spinnerLarge}
                          style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}
                        />
                        <span>Đang gửi bài...</span>
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
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <span>Nộp bài & Chấm điểm AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* State 2: QUEUED or PROCESSING */}
              {(attemptStatus === 'queued' || attemptStatus === 'processing') && (
                <div className={styles.asyncStatusBanner} aria-live="polite">
                  <div className={styles.spinnerLarge} />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                      {attemptStatus === 'queued'
                        ? 'Đang chờ xử lý trong hàng đợi...'
                        : 'AI đang phân tích câu trả lời của bạn...'}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--sa-text-muted)',
                        maxWidth: '420px',
                        margin: '0 auto',
                        lineHeight: 1.5,
                      }}
                    >
                      Hệ thống đang đối chiếu câu trả lời với tiêu chí năng lực chuyên môn, ghi nhận
                      bằng chứng thực tế và tổng hợp điểm số. Kết quả sẽ tự động cập nhật ngay khi
                      hoàn tất.
                    </p>
                  </div>
                </div>
              )}

              {/* State 3: COMPLETED */}
              {attemptStatus === 'completed' && currentAttempt?.evaluation && (
                <div>
                  <ScenarioEvaluationView
                    evaluation={currentAttempt.evaluation}
                    onRetry={handleRetry}
                    isRetrying={retryMutation.isPending}
                  />
                </div>
              )}

              {/* State 4: FAILED */}
              {attemptStatus === 'failed' && (
                <div
                  className={styles.asyncStatusBanner}
                  style={{ borderColor: 'var(--sa-rose-border)' }}
                  role="alert"
                >
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--sa-rose-bg)',
                      color: 'var(--sa-rose-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                      Đánh giá chưa thành công
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--sa-text-muted)', margin: '0 0 1rem 0' }}>
                      Mã lỗi: {currentAttempt?.errorCode || 'UNKNOWN_ERROR'}. Bạn có thể thử lại để tiếp tục.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className={styles.btnSecondaryAction}
                        onClick={handleSubmit}
                        disabled={submitAttemptMutation.isPending}
                      >
                        Thử gửi lại
                      </button>
                      <button
                        type="button"
                        className={styles.btnPracticeAction}
                        onClick={handleRetry}
                        disabled={retryMutation.isPending}
                        style={{ width: 'auto' }}
                      >
                        Bắt đầu lượt mới
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* History view */}
      {history && history.attempts.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <ScenarioHistoryView
            history={history}
            activeAttemptId={activeAttemptId || undefined}
            onSelectAttempt={(attemptId) => {
              setSelectedAttemptId(attemptId);
              setUserAnswerText(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
