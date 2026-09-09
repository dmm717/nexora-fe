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
import {
  generateIdempotencyKey,
  getScenarioErrorMessage,
  parseMarkdownBlocks,
} from '@/utils/scenarioHelpers';
import type { ScenarioDetail } from '@/types/scenario';

interface ScenarioPracticeProps {
  scenario: ScenarioDetail;
}

const FormattedScenarioContent = ({ text }: { text: string }) => {
  const blocks = useMemo(() => parseMarkdownBlocks(text), [text]);

  return (
    <>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'h3') {
          return (
            <h3
              key={`h3-${blockIndex}`}
              className={styles.scenarioContentHeading}
            >
              {block.content}
            </h3>
          );
        }
        if (block.type === 'h4') {
          return (
            <h4
              key={`h4-${blockIndex}`}
              className={styles.scenarioContentHeading}
            >
              {block.content}
            </h4>
          );
        }
        if (block.type === 'list') {
          return (
            <ul
              key={`ul-${blockIndex}`}
              className={styles.scenarioContentList}
            >
              {block.items.map((item, itemIdx) => (
                <li
                  key={`li-${blockIndex}-${itemIdx}`}
                  className={styles.scenarioContentListItem}
                >
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph with bold support
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(block.content)) {
          const parts = block.content.split(boldRegex);
          return (
            <p key={`p-${blockIndex}`} className={styles.scenarioContentParagraph}>
              {parts.map((part, idx) =>
                idx % 2 === 1 ? (
                  <strong key={`bold-${idx}`} className={styles.scenarioContentHeading}>
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
          <p key={`p-${blockIndex}`} className={styles.scenarioContentParagraph}>
            {block.content}
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
  const createInFlightRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const retryInFlightRef = useRef(false);

  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useScenarioAttemptHistory(scenario.slug);

  // Derive active attempt ID without setState in effect
  const activeAttemptId = useMemo(() => {
    if (selectedAttemptId) return selectedAttemptId;
    if (!history?.attempts || history.attempts.length === 0) return null;
    const inProgress = history.attempts.find(
      (a) => a.status === 'draft' || a.status === 'queued' || a.status === 'processing'
    );
    return inProgress ? inProgress.id : history.attempts[0].id;
  }, [selectedAttemptId, history]);

  const {
    data: currentAttempt,
    isLoading: attemptLoading,
    error: attemptQueryError,
    refetch: refetchAttempt,
  } = useScenarioAttempt(activeAttemptId || '');

  const createAttemptMutation = useCreateScenarioAttempt();
  const submitAttemptMutation = useSubmitScenarioAttempt();
  const retryMutation = useRetryScenario();

  // Answer text is either user typed value or stored draft answer
  const answerText = userAnswerText !== null ? userAnswerText : currentAttempt?.answer || '';
  const attemptStatus = currentAttempt?.status;

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
    if (createInFlightRef.current) return;
    createInFlightRef.current = true;
    setErrorMessage(null);
    try {
      const attempt = await createAttemptMutation.mutateAsync({
        scenarioId: scenario.id,
        idempotencyKey: createIdempotencyKeyRef.current,
      });
      // Reset idempotency key for future requests
      createIdempotencyKeyRef.current = generateIdempotencyKey();
      // A new attempt is a new logical submit operation.
      submitIdempotencyKeyRef.current = generateIdempotencyKey();
      setSelectedAttemptId(attempt.id);
      setUserAnswerText(attempt.answer || '');
    } catch (err: unknown) {
      const msg = getScenarioErrorMessage(err, 'Không thể khởi tạo lượt luyện tập.');
      setErrorMessage(msg);
    } finally {
      createInFlightRef.current = false;
    }
  };

  // Handler: Submit answer
  const handleSubmit = async () => {
    if (!activeAttemptId || attemptStatus !== 'draft' || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    if (!answerText.trim()) {
      setErrorMessage('Vui lòng nhập câu trả lời trước khi gửi đánh giá.');
      submitInFlightRef.current = false;
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
      const msg = getScenarioErrorMessage(err, 'Lỗi khi gửi bài đánh giá.');
      setErrorMessage(msg);
    } finally {
      submitInFlightRef.current = false;
    }
  };

  // Handler: Retry / New attempt for this scenario (recovers failed attempts by creating a fresh draft)
  const handleRetry = async () => {
    if (retryInFlightRef.current) return;
    retryInFlightRef.current = true;
    setErrorMessage(null);
    const draftContent = answerText || currentAttempt?.answer || '';
    try {
      const attempt = await retryMutation.mutateAsync({
        scenarioId: scenario.id,
        idempotencyKey: retryIdempotencyKeyRef.current,
      });
      retryIdempotencyKeyRef.current = generateIdempotencyKey();
      // The replacement draft must not reuse a key from a previous attempt.
      submitIdempotencyKeyRef.current = generateIdempotencyKey();
      setSelectedAttemptId(attempt.id);
      // Retain previous answer so user can refine and submit
      setUserAnswerText(attempt.answer || draftContent);
    } catch (err: unknown) {
      const msg = getScenarioErrorMessage(err, 'Không thể tạo lượt thử mới.');
      setErrorMessage(msg);
    } finally {
      retryInFlightRef.current = false;
    }
  };

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
        <div className={styles.practiceErrorAlert} role="alert" aria-live="assertive">
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

          <div className={styles.guidelinesBox}>
            <span className={styles.guidelinesTitle}>
              💡 Gợi ý cấu trúc trả lời hiệu quả:
            </span>
            1. <strong>Phân tích vấn đề:</strong> Xác định rủi ro cốt lõi, người liên quan chính.
            <br />
            2. <strong>Hành động cụ thể:</strong> Các bước xử lý ngay lập tức và giải pháp dài hạn.
            <br />
            3. <strong>Đo lường & Bài học:</strong> Kết quả đạt được hoặc cơ chế phòng ngừa lặp lại.
          </div>
        </section>

        {/* Right Column: Interactive Practice / Evaluation */}
        <section className={styles.panelCard} aria-label="Khu vực làm bài và đánh giá">
          {historyLoading && (
            <div className={styles.practiceLoadingState} aria-live="polite">
              <div className={`${styles.spinnerLarge} ${styles.practiceLoadingSpinner}`} />
              <p className={styles.practiceLoadingMessage}>Đang tải lịch sử bài làm...</p>
            </div>
          )}

          {!historyLoading && historyError && (
            <div className={styles.practiceErrorAlert} role="alert" aria-live="assertive">
              <span>
                {getScenarioErrorMessage(
                  historyError,
                  'Không thể tải lịch sử bài làm. Vui lòng thử lại trước khi bắt đầu lượt mới.'
                )}
              </span>
              <button
                type="button"
                className={`${styles.btnSecondaryAction} ${styles.contentWidthAuto}`}
                onClick={() => void refetchHistory()}
              >
                Thử tải lại
              </button>
            </div>
          )}

          {!activeAttemptId && !historyLoading && !historyError && (
            <div className={styles.promptStartHero}>
              <div className={styles.promptStartIconWrap}>
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
              <h3 className={styles.promptStartTitle}>
                Sẵn sàng thử sức với tình huống này?
              </h3>
              <p className={styles.promptStartDescription}>
                Khởi tạo một lượt luyện tập mới để nhận phản hồi chuyên sâu và đo lường tiến bộ kỹ năng.
              </p>
              <button
                type="button"
                className={`${styles.btnPracticeAction} ${styles.promptStartButton}`}
                onClick={handleStartAttempt}
                disabled={createAttemptMutation.isPending}
              >
                {createAttemptMutation.isPending ? 'Đang khởi tạo...' : 'Bắt đầu làm bài'}
              </button>
            </div>
          )}

          {activeAttemptId && attemptLoading && (
            <div className={styles.practiceLoadingState} aria-live="polite">
              <div className={`${styles.spinnerLarge} ${styles.practiceLoadingSpinner}`} />
              <p className={styles.practiceLoadingMessage}>
                Đang tải dữ liệu bài làm...
              </p>
            </div>
          )}

          {activeAttemptId && !attemptLoading && attemptQueryError && (
            <div className={styles.practiceErrorAlert} role="alert" aria-live="assertive">
              <span>
                {getScenarioErrorMessage(
                  attemptQueryError,
                  'Không thể tải lượt luyện tập. Vui lòng thử lại.'
                )}
              </span>
              <button
                type="button"
                className={`${styles.btnSecondaryAction} ${styles.contentWidthAuto}`}
                onClick={() => void refetchAttempt()}
              >
                Thử tải lại
              </button>
            </div>
          )}

          {activeAttemptId && !attemptLoading && !attemptQueryError && currentAttempt && (
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
                        className={
                          answerText.length >= 50
                            ? styles.answerLengthValid
                            : styles.answerLengthShort
                        }
                      >
                        {answerText.length} ký tự
                      </strong>
                      {answerText.length < 50 && ' (khuyến nghị tối thiểu 50 ký tự)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.btnPracticeAction}
                    onClick={handleSubmit}
                    disabled={submitAttemptMutation.isPending || !answerText.trim()}
                  >
                    {submitAttemptMutation.isPending ? (
                      <>
                        <span className={`${styles.spinnerLarge} ${styles.compactSpinner}`} />
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
                    <h3 className={styles.statusHeading}>
                      {attemptStatus === 'queued'
                        ? 'Đang chờ xử lý trong hàng đợi...'
                        : 'AI đang phân tích câu trả lời của bạn...'}
                    </h3>
                    <p className={styles.statusDescription}>
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

              {/* State 4: FAILED (Recovery via new draft attempt only) */}
              {attemptStatus === 'failed' && (
                <div className={`${styles.asyncStatusBanner} ${styles.failedStatusBanner}`} role="alert">
                  <div className={styles.failedStatusIconWrap}>
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
                    <h3 className={styles.failedStatusTitle}>
                      Đánh giá chưa thành công
                    </h3>
                    <p className={styles.failedStatusMessage}>
                      Mã lỗi: {currentAttempt?.errorCode || 'UNKNOWN_ERROR'}. Lượt làm bài này đã kết thúc. Bạn có thể khởi tạo lượt mới để tiếp tục.
                    </p>
                    <div className={styles.statusActions}>
                      <button
                        type="button"
                        className={`${styles.btnPracticeAction} ${styles.contentWidthAuto}`}
                        onClick={handleRetry}
                        disabled={retryMutation.isPending}
                      >
                        {retryMutation.isPending ? 'Đang khởi tạo...' : 'Bắt đầu lượt mới'}
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
        <div className={styles.practiceHistorySection}>
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
