'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../Interviews.module.css';
import { interviewApi } from '@/services/interviewApi';
import {
  type InterviewView,
  getCurrentQuestion,
  getAnsweredQuestions,
  canFinishInterview,
  canSubmitInterviewAnswer,
  canUpgradeAndContinue,
  isUpgradeRequired,
  shouldAutoComplete,
  isStarApplicable,
  normalizeStarComponent,
  safeAnswerEvaluation,
  generateIdempotencyKey,
  getOrCreateAnswerIntent,
  applyAnswerResultToInterview,
  createCompleteIntentState,
  type AnswerIntent,
  type CompleteIntentState,
  shouldRunAnswerTimer,
  SCORE_SCALE,
} from '@/services/interviewContract';
import { useInterview } from '@/hooks/queries/useInterviews';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import {
  mergeFinalTranscript,
  SPEECH_LANGUAGE_OPTIONS,
  SPEECH_UNSUPPORTED_MESSAGE,
} from '@/hooks/speechRecognitionContract';
import { formatTime } from '@/utils/formatters';
import { ApiError } from '@/services/apiClient';

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [actionError, setActionError] = useState<{
    message: string;
    requestId?: string;
    code?: string;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stable intent tracking: reuse key and frozen duration for unchanged retries of the same answer
  const pendingAnswerIntentRef = useRef<AnswerIntent | null>(null);
  const continueKeyRef = useRef<string>(generateIdempotencyKey());
  const completeIntentRef = useRef<CompleteIntentState>(createCompleteIntentState());

  const { data: interview, isLoading: loading, error: queryError } = useInterview(id);

  // A10 temporary voice input: browser speech -> editable transcript -> normal answer submit.
  // Only finalized segments are merged into the editable textarea; interim text stays a preview.
  const handleFinalSpeechSegment = useCallback((segment: string) => {
    setAnswerContent((prev) => mergeFinalTranscript(prev, segment));
  }, []);
  const speech = useSpeechRecognition({ onFinalSegment: handleFinalSpeechSegment });

  // Derive questions and active status from server-owned data
  const answeredPairs = getAnsweredQuestions(interview?.questions, interview?.answers);
  const activeQuestion = getCurrentQuestion(interview?.questions, interview?.answers);
  const continuation = interview?.continuation;
  const canFinish = canFinishInterview(continuation);
  const upgradeRequired = isUpgradeRequired(continuation);
  const canUpgrade = canUpgradeAndContinue(continuation);

  // Active lifecycle gating: only the production helper decides whether official answer controls are allowed.
  const canAnswer = canSubmitInterviewAnswer({
    status: interview?.status,
    hasQuestion: Boolean(activeQuestion),
    upgradeRequired,
  });
  const hasActiveQuestion = Boolean(activeQuestion);
  const activeQuestionId = activeQuestion?.id;

  // Stop listening when leaving the answerable state or while submitting.
  useEffect(() => {
    if (!speech.supported) return;
    if (!canAnswer || submitting) {
      speech.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAnswer, submitting, speech.supported]);

  // Keep the timer running only while the current answer is genuinely answerable.
  // When a submission fails, submitting returns to false and this effect resumes it.
  useEffect(() => {
    if (shouldRunAnswerTimer({
      status: interview?.status,
      hasQuestion: hasActiveQuestion,
      canSubmitAnswer: canAnswer,
      submitting,
    })) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    if (interview?.status === 'completed') {
      router.push(`/dashboard/interviews/${id}/report`);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interview?.status, hasActiveQuestion, canAnswer, submitting, id, router]);

  // Reset timer and speech preview on active question change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsElapsed(0);
    speech.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestionId]);

  const handleComplete = async () => {
    if (!canFinish || completing || submitting) return;
    if (answeredPairs.length > 0 && !window.confirm('Bạn có chắc chắn muốn kết thúc buổi phỏng vấn và xuất báo cáo?')) {
      return;
    }

    setCompleting(true);
    setActionError(null);
    try {
      await interviewApi.complete(id, completeIntentRef.current.getKey());
      // Completion confirmed: mint a fresh key for any future (unused) intent
      completeIntentRef.current.confirmComplete();
      router.push(`/dashboard/interviews/${id}/report`);
    } catch (err: unknown) {
      setActionError({
        message: err instanceof ApiError ? err.message : 'Lỗi khi kết thúc bài thi. Vui lòng thử lại.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
      setCompleting(false);
    }
  };

  const handleContinue = async () => {
    if (continuing || submitting) return;
    setContinuing(true);
    setActionError(null);
    try {
      const updatedInterview = await interviewApi.continue(id, continueKeyRef.current);
      queryClient.setQueryData(['interview', id], updatedInterview);
      // Intent succeeded, prepare next idempotency key
      continueKeyRef.current = generateIdempotencyKey();
    } catch (err: unknown) {
      setActionError({
        message:
          err instanceof ApiError
            ? err.message
            : 'Chưa thể tiếp tục buổi phỏng vấn. Vui lòng kiểm tra gói tài khoản của bạn.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
    } finally {
      setContinuing(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!canAnswer || !answerContent.trim() || !activeQuestion || submitting) return;

    setSubmitting(true);
    setActionError(null);

    // Stop timer while submitting
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Option B: Freeze attempt duration in pending intent. If retrying unchanged answer, reuse key & frozen duration.
    const intent = getOrCreateAnswerIntent(pendingAnswerIntentRef.current, {
      questionId: activeQuestion.id,
      content: answerContent,
      durationSeconds: secondsElapsed,
    });
    pendingAnswerIntentRef.current = intent;

    try {
      const result = await interviewApi.submitAnswer(
        id,
        intent.payload,
        intent.key
      );

      // The answer is accepted on the backend the moment submitAnswer resolves.
      // Reconcile it into client cache BEFORE any further network mutation so a
      // failed complete cannot desync client state from the accepted answer.
      queryClient.setQueryData(['interview', id], (oldData: InterviewView | undefined) =>
        oldData ? applyAnswerResultToInterview(oldData, result) : oldData
      );

      // Submission succeeded: clear pending intent, input, timer, and speech state
      pendingAnswerIntentRef.current = null;
      setAnswerContent('');
      setSecondsElapsed(0);
      speech.reset();

      // Check auto-completion: nextQuestion=null with upgrade_required must NOT auto-complete
      const resultContinuation = result.continuation ?? continuation;
      if (
        shouldAutoComplete(result.isComplete, resultContinuation, result.nextQuestion) &&
        canFinishInterview(resultContinuation)
      ) {
        try {
          await interviewApi.complete(id, completeIntentRef.current.getKey());
          // Completion confirmed: mint a fresh key for any future (unused) intent
          completeIntentRef.current.confirmComplete();
          router.push(`/dashboard/interviews/${id}/report`);
        } catch (err: unknown) {
          // Do NOT roll back the accepted answer. Same complete key must remain
          // reusable so the Finish action can retry with identical idempotency.
          setActionError({
            message:
              'Câu trả lời đã được lưu, nhưng chưa thể kết thúc buổi phỏng vấn. Vui lòng thử nộp bài lại.',
            requestId: err instanceof ApiError ? err.requestId : undefined,
            code: err instanceof ApiError ? err.code : undefined,
          });
        }
      }
    } catch (err: unknown) {
      setActionError({
        message: err instanceof ApiError ? err.message : 'Lỗi khi gửi câu trả lời. Bạn có thể thử gửi lại.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Đang tải dữ liệu buổi phỏng vấn...</div>
      </div>
    );
  }

  if (queryError && !interview) {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ color: '#dc2626' }}>
          <p style={{ fontWeight: 600 }}>{queryError.message || 'Không thể tải buổi phỏng vấn.'}</p>
          <Link href="/dashboard/interviews" style={{ color: '#2563eb', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>
            Quay lại danh sách phỏng vấn
          </Link>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  // Lifecycle state: starting
  if (interview.status === 'starting') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang khởi tạo bài thi...</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            AI đang chuẩn bị các câu hỏi phỏng vấn phù hợp nhất với hồ sơ và cấu hình của bạn. Vui lòng đợi trong giây lát...
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Lifecycle state: completing
  if (interview.status === 'completing') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang chấm điểm &amp; Tổng hợp báo cáo...</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            AI đang đánh giá toàn diện phần thi của bạn để lập báo cáo phỏng vấn chi tiết.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <button
              className={styles.btnPrimary}
              onClick={() => router.push(`/dashboard/interviews/${id}/report`)}
            >
              Xem tiến độ báo cáo &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lifecycle state: failed or abandoned
  if (interview.status === 'failed' || interview.status === 'abandoned') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 className={styles.title} style={{ color: '#dc2626' }}>
            Buổi phỏng vấn đã kết thúc ({interview.status === 'failed' ? 'Thất bại' : 'Đã hủy'})
          </h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            Phiên phỏng vấn này không còn hoạt động. Bạn có thể quay lại danh sách phỏng vấn để xem các lựa chọn hiện có.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/dashboard/interviews" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-block' }}>
              Trở về Danh sách phỏng vấn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (interview.status === 'completed') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 className={styles.title}>Buổi phỏng vấn đã hoàn thành</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            Bài phỏng vấn đã kết thúc. Bạn có thể xem báo cáo đánh giá chi tiết.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <button
              className={styles.btnPrimary}
              onClick={() => router.push(`/dashboard/interviews/${id}/report`)}
            >
              Xem báo cáo &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (interview.status === 'draft') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 className={styles.title}>Buổi phỏng vấn chưa sẵn sàng.</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            Vui lòng quay lại danh sách và thử mở lại sau ít phút.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/dashboard/interviews" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-block' }}>
              Trở về Danh sách phỏng vấn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (interview.status !== 'active') {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 className={styles.title}>Trạng thái buổi phỏng vấn chưa được hỗ trợ.</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            Vui lòng tải lại hoặc quay lại danh sách phỏng vấn.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/dashboard/interviews" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-block' }}>
              Trở về Danh sách phỏng vấn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Phỏng vấn: {interview.role}</h1>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={styles.statusBadge}>{interview.interviewType}</span>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.2rem 0.6rem', borderRadius: '4px' }}
            >
              {interview.difficulty}
            </span>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.2rem 0.6rem', borderRadius: '4px' }}
            >
              {interview.seniority}
            </span>
          </div>
        </div>
        <button
          className={styles.btnDanger}
          onClick={handleComplete}
          disabled={completing || submitting || !canFinish}
          style={{ opacity: canFinish ? 1 : 0.5 }}
          title={canFinish ? 'Nộp bài và xuất báo cáo' : 'Chưa thể kết thúc buổi phỏng vấn ở trạng thái hiện tại.'}
        >
          {completing ? 'Đang xử lý...' : 'Nộp bài sớm'}
        </button>
      </div>

      <div className={styles.panel}>
        {actionError && (
          <div className={styles.actionError}>
            <div className={styles.errorTitle}>
              <span>⚠️</span>
              <span>{actionError.message}</span>
            </div>
            {actionError.requestId && (
              <div className={styles.errorMeta}>Mã yêu cầu (Request ID): {actionError.requestId}</div>
            )}
          </div>
        )}

        {/* History with Per-Answer Coaching (A8) */}
        {answeredPairs.length > 0 && (
          <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {answeredPairs.map(({ question: q, answer: ans }) => {
              const evalData = safeAnswerEvaluation(ans.evaluation);
              const star = evalData.star;
              const hasStar = isStarApplicable(star);
              const hasGenericCoaching =
                evalData.strengths.length > 0 ||
                evalData.improvements.length > 0 ||
                Boolean(evalData.improvedAnswer) ||
                Boolean(evalData.feedback);

              return (
                <div
                  key={q.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.05rem' }}>
                      Câu {q.sequence}: {q.content}
                    </div>
                    {q.topic && (
                      <span className={styles.statusBadge} style={{ fontSize: '0.75rem' }}>
                        {q.topic}
                      </span>
                    )}
                  </div>
                  <div style={{ marginBottom: '1rem', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    <strong>Trả lời:</strong> {ans.content}
                  </div>

                  {/* A8 Per-Answer Coaching Display */}
                  {hasStar && star ? (
                    <div className={styles.coachingBox}>
                      <div className={styles.coachingTitle}>
                        <span>⭐</span>
                        <span>Đánh giá theo Phương pháp S-T-A-R ({evalData.scoreScale || SCORE_SCALE})</span>
                        {typeof star.overallScore === 'number' && (
                          <span className={styles.scorePill} style={{ marginLeft: 'auto' }}>
                            {star.overallScore}/100
                          </span>
                        )}
                      </div>

                      <div className={styles.starTableWrapper}>
                        <table className={styles.starTable}>
                          <thead>
                            <tr>
                              <th style={{ width: '130px' }}>Thành phần</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Trạng thái</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Điểm</th>
                              <th>Nhận xét &amp; Bằng chứng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {star.situation && (() => {
                              const norm = normalizeStarComponent(star.situation);
                              return (
                                <tr>
                                  <td><strong>Situation (Tình huống)</strong></td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      className={styles.scorePill}
                                      style={{
                                        backgroundColor: norm.detected ? '#dcfce7' : '#fee2e2',
                                        color: norm.detected ? '#166534' : '#991b1b',
                                      }}
                                    >
                                      {norm.detected ? 'Phát hiện' : 'Chưa rõ'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={styles.scorePill}>
                                      {norm.score}/100
                                    </span>
                                  </td>
                                  <td>
                                    <div>{norm.feedback}</div>
                                    {norm.evidence && (
                                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        <em>Bằng chứng: {norm.evidence}</em>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })()}
                            {star.task && (() => {
                              const norm = normalizeStarComponent(star.task);
                              return (
                                <tr>
                                  <td><strong>Task (Nhiệm vụ)</strong></td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      className={styles.scorePill}
                                      style={{
                                        backgroundColor: norm.detected ? '#dcfce7' : '#fee2e2',
                                        color: norm.detected ? '#166534' : '#991b1b',
                                      }}
                                    >
                                      {norm.detected ? 'Phát hiện' : 'Chưa rõ'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={styles.scorePill}>
                                      {norm.score}/100
                                    </span>
                                  </td>
                                  <td>
                                    <div>{norm.feedback}</div>
                                    {norm.evidence && (
                                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        <em>Bằng chứng: {norm.evidence}</em>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })()}
                            {star.action && (() => {
                              const norm = normalizeStarComponent(star.action);
                              return (
                                <tr>
                                  <td><strong>Action (Hành động)</strong></td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      className={styles.scorePill}
                                      style={{
                                        backgroundColor: norm.detected ? '#dcfce7' : '#fee2e2',
                                        color: norm.detected ? '#166534' : '#991b1b',
                                      }}
                                    >
                                      {norm.detected ? 'Phát hiện' : 'Chưa rõ'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={styles.scorePill}>
                                      {norm.score}/100
                                    </span>
                                  </td>
                                  <td>
                                    <div>{norm.feedback}</div>
                                    {norm.evidence && (
                                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        <em>Bằng chứng: {norm.evidence}</em>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })()}
                            {star.result && (() => {
                              const norm = normalizeStarComponent(star.result);
                              return (
                                <tr>
                                  <td><strong>Result (Kết quả)</strong></td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      className={styles.scorePill}
                                      style={{
                                        backgroundColor: norm.detected ? '#dcfce7' : '#fee2e2',
                                        color: norm.detected ? '#166534' : '#991b1b',
                                      }}
                                    >
                                      {norm.detected ? 'Phát hiện' : 'Chưa rõ'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={styles.scorePill}>
                                      {norm.score}/100
                                    </span>
                                  </td>
                                  <td>
                                    <div>{norm.feedback}</div>
                                    {norm.evidence && (
                                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        <em>Bằng chứng: {norm.evidence}</em>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {star.missingElements && star.missingElements.length > 0 && (
                        <div style={{ marginTop: '0.75rem', color: '#b91c1c', fontSize: '0.9rem' }}>
                          <strong>Yếu tố còn thiếu:</strong> {star.missingElements.join(', ')}
                        </div>
                      )}

                      {star.strengths && star.strengths.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <strong style={{ color: '#059669', display: 'block', marginBottom: '0.25rem' }}>
                            ✨ Điểm mạnh nổi bật:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#064e3b' }}>
                            {star.strengths.map((st, idx) => (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>
                                {st}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {star.coachingTips && star.coachingTips.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <strong style={{ color: '#16a34a', display: 'block', marginBottom: '0.25rem' }}>
                            💡 Lời khuyên hoàn thiện:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155' }}>
                            {star.coachingTips.map((tip, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : hasGenericCoaching ? (
                    <div className={styles.coachingBox}>
                      <div className={styles.coachingTitle}>
                        <span>✨</span>
                        <span>AI Phản Hồi Trực Tiếp ({evalData.scoreScale || SCORE_SCALE})</span>
                      </div>

                      {evalData.scores.length > 0 && (
                        <div className={styles.starTableWrapper} style={{ marginBottom: '1rem' }}>
                          <table className={styles.starTable}>
                            <thead>
                              <tr>
                                <th style={{ width: '160px' }}>Tiêu chí</th>
                                <th style={{ width: '90px', textAlign: 'center' }}>Điểm</th>
                                <th>Bằng chứng đánh giá</th>
                              </tr>
                            </thead>
                            <tbody>
                              {evalData.scores.map((sc, scIdx) => (
                                <tr key={scIdx}>
                                  <td><strong>{sc.criterion}</strong></td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={styles.scorePill}>{sc.score}/100</span>
                                  </td>
                                  <td>{sc.evidence || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {evalData.feedback && (
                        <div style={{ marginBottom: '0.75rem', color: '#334155', lineHeight: '1.6' }}>
                          <strong>Nhận xét:</strong> {evalData.feedback}
                        </div>
                      )}

                      {evalData.strengths.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong style={{ color: '#059669', display: 'block', marginBottom: '0.25rem' }}>
                            Điểm mạnh:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#064e3b' }}>
                            {evalData.strengths.map((s, idx) => (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evalData.improvements.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.25rem' }}>
                            Cần cải thiện:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#7f1d1d' }}>
                            {evalData.improvements.map((imp, idx) => (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evalData.improvedAnswer && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <strong style={{ color: '#2563eb', display: 'block', marginBottom: '0.25rem' }}>
                            Câu trả lời mẫu gợi ý:
                          </strong>
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              backgroundColor: '#eff6ff',
                              color: '#1e3a8a',
                              borderRadius: '8px',
                              fontStyle: 'italic',
                              lineHeight: '1.5',
                            }}
                          >
                            &ldquo;{evalData.improvedAnswer}&rdquo;
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Continuation State: upgrade_required (A7) */}
        {upgradeRequired ? (
          <div className={styles.upgradeCard}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 700 }}>
              Bạn đã đạt giới hạn câu hỏi của gói hiện tại
            </h3>
            <p
              style={{
                color: '#64748b',
                marginBottom: '2rem',
                fontSize: '1.05rem',
                maxWidth: '620px',
                margin: '0 auto 2rem',
                lineHeight: '1.6',
              }}
            >
              Nâng cấp gói để tiếp tục buổi phỏng vấn này với các câu hỏi tình huống chuyên sâu, phân tích kỹ năng và nhận phản hồi chi tiết từ AI.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className={styles.btnDanger}
                onClick={handleComplete}
                disabled={completing || submitting || !canFinish}
              >
                {completing ? 'Đang hoàn tất...' : 'Nộp bài & Xem báo cáo'}
              </button>

              {canUpgrade && (
                <Link
                  href="/pricing"
                  target="_blank"
                  className={styles.btnPrimary}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Nâng cấp gói ngay
                </Link>
              )}

              <button
                className={styles.btnSecondary}
                onClick={handleContinue}
                disabled={continuing || submitting}
              >
                {continuing ? 'Đang kiểm tra...' : 'Đã nâng cấp? Tiếp tục phỏng vấn'}
              </button>
            </div>
          </div>
        ) : canAnswer && activeQuestion ? (
          <>
            <div className={styles.questionBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className={styles.questionSequence}>
                  Câu hỏi {activeQuestion.sequence} / {interview.questions.length}
                  {activeQuestion.topic && (
                    <span style={{ marginLeft: '0.75rem', textTransform: 'none', color: '#64748b' }}>
                      ({activeQuestion.topic})
                    </span>
                  )}
                </div>
                <div className={styles.timer}>⏱ {formatTime(secondsElapsed)}</div>
              </div>
              <div className={styles.questionContent}>{activeQuestion.content}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="answerContent">
                Câu trả lời của bạn
              </label>
              <textarea
                id="answerContent"
                className={styles.textarea}
                placeholder="Nhập câu trả lời chi tiết của bạn tại đây..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                disabled={!canAnswer || submitting}
              />
            </div>

            {/* A10 temporary voice input (browser Web Speech API) */}
            <div
              style={{
                marginTop: '0.75rem',
                marginBottom: '0.75rem',
                padding: '0.75rem',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                background: '#f8fafc',
              }}
            >
              {speech.supported ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {speech.listening ? (
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={speech.stop}
                        disabled={submitting}
                      >
                        ⏹ Dừng ghi âm
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={speech.start}
                        disabled={!canAnswer || submitting}
                      >
                        🎤 Bắt đầu nói
                      </button>
                    )}

                    <label htmlFor="speechLanguage" style={{ fontSize: '0.9rem', color: '#475569' }}>
                      Ngôn ngữ:
                    </label>
                    <select
                      id="speechLanguage"
                      className={styles.select}
                      value={speech.language}
                      onChange={(e) =>
                        speech.setLanguage(e.target.value === 'en-US' ? 'en-US' : 'vi-VN')
                      }
                      disabled={submitting}
                    >
                      {SPEECH_LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {speech.listening && (
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>● Đang nghe...</span>
                    )}
                  </div>

                  {speech.preview && (
                    <div style={{ marginTop: '0.5rem', color: '#475569', fontSize: '0.9rem' }}>
                      <strong>Bản nháp giọng nói:</strong> {speech.preview}
                    </div>
                  )}

                  {speech.error && (
                    <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.9rem', fontWeight: 500 }}>
                      {speech.error.message}
                    </div>
                  )}

                  <div style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Nhập giọng nói chỉ tạo bản nháp có thể chỉnh sửa. Nội dung gửi đi là văn bản cuối cùng trong ô trả lời — không có âm thanh nào được gửi.
                  </div>
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{SPEECH_UNSUPPORTED_MESSAGE}</div>
              )}
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmitAnswer}
                disabled={!canAnswer || submitting || !answerContent.trim()}
              >
                {submitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '1rem', fontWeight: 600, color: '#1e293b' }}>
              Bạn đã hoàn thành tất cả câu hỏi!
            </h3>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Hãy nhấn nút bên dưới để nộp bài và xem báo cáo đánh giá chi tiết từ AI.
            </p>
            <button
              className={styles.btnPrimary}
              onClick={handleComplete}
              disabled={completing || submitting || !canFinish}
            >
              {completing ? 'Đang xuất báo cáo...' : 'Nộp bài & Xem báo cáo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
