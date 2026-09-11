'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import styles from './Report.module.css';
import { useInterview, useInterviewReport } from '@/hooks/queries/useInterviews';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { ClientDate } from '@/components/ui/ClientDate';
import { ApiError } from '@/services/apiClient';
import { interviewApi } from '@/services/interviewApi';
import {
  isReportProcessingError,
  isReportFailedError,
  normalizeStarComponent,
  safeAnswerEvaluation,
  generateIdempotencyKey,
  SCORE_SCALE,
} from '@/services/interviewContract';

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  useAutoTranslate();

  const [retrying, setRetrying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryError, setRetryError] = useState<{ message: string; requestId?: string } | null>(null);

  // Stable idempotency key for report retry intent
  const retryKeyRef = useRef<string>(generateIdempotencyKey());

  const { data: interview } = useInterview(id);
  const {
    data: report,
    isLoading: loading,
    error: queryError,
    reportPollingBoundExhausted,
    resetReportPollingAttempts,
  } = useInterviewReport(id, interview?.status);

  const isProcessing =
    isReportProcessingError(queryError) ||
    (queryError instanceof ApiError && queryError.code === 'NOT_FOUND' && interview?.status === 'completing');
  const isFailed = isReportFailedError(queryError);

  const handleRetryReport = async () => {
    if (retrying) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await interviewApi.retryReport(id, retryKeyRef.current);
      resetReportPollingAttempts();
      // Invalidate queries to trigger fresh polling
      await queryClient.invalidateQueries({ queryKey: ['interview', id] });
      await queryClient.invalidateQueries({ queryKey: ['interviewReport', id] });
      // Succeeded: generate next idempotency key
      retryKeyRef.current = generateIdempotencyKey();
    } catch (err: unknown) {
      setRetryError({
        message: err instanceof ApiError ? err.message : 'Lỗi khi yêu cầu tạo lại báo cáo.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleRefreshReportState = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['interviewReport', id] });
    } finally {
      setRefreshing(false);
    }
  };

  if (reportPollingBoundExhausted && !report) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Báo cáo phỏng vấn</h1>
          <button className={styles.btnPrimary} onClick={() => router.push('/dashboard/interviews')}>
            Trở về Danh sách
          </button>
        </div>

        <div className={styles.panel} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 className={styles.title}>Báo cáo vẫn đang được xử lý lâu hơn dự kiến.</h2>
          <p style={{ color: '#64748b', marginTop: '1rem' }}>
            Bạn có thể thử làm mới trạng thái sau ít phút.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className={styles.btnPrimary} onClick={handleRefreshReportState} disabled={refreshing}>
              {refreshing ? 'Đang làm mới...' : 'Làm mới trạng thái báo cáo'}
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => router.push('/dashboard/interviews')}
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Report is actively generating
  if (loading || (isProcessing && !report)) {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 className={styles.title}>Đang tổng hợp báo cáo...</h2>
          <p style={{ color: '#1d1d1f', marginTop: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
            AI đang phân tích câu trả lời và tổng hợp báo cáo phỏng vấn của bạn. Quá trình này có thể mất đến 1 phút...
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
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

  // State: Report generation failed (409 INTERVIEW_REPORT_FAILED)
  if (isFailed && !report) {
    const errorObj = queryError instanceof ApiError ? queryError : null;
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Báo cáo phỏng vấn</h1>
          <button className={styles.btnPrimary} onClick={() => router.push('/dashboard/interviews')}>
            Trở về Danh sách
          </button>
        </div>

        <div className={styles.retryCard}>
          <div className={styles.retryTitle}>Báo cáo phỏng vấn chưa tạo được ⚠️</div>
          <p className={styles.retryDescription}>
            Hệ thống gặp sự cố gián đoạn trong quá trình phân tích bài phỏng vấn. Bạn có thể thử lại mà không bị trừ thêm lượt phỏng vấn nào.
          </p>

          {retryError && (
            <div style={{ color: '#dc2626', marginBottom: '1rem', fontWeight: 500 }}>
              {retryError.message}
              {retryError.requestId && (
                <div className={styles.retryMeta}>Mã yêu cầu: {retryError.requestId}</div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={styles.btnPrimary}
              onClick={handleRetryReport}
              disabled={retrying}
            >
              {retrying ? 'Đang gửi yêu cầu...' : 'Thử tạo lại báo cáo ngay'}
            </button>
            <button
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '999px',
                background: 'white',
                color: '#334155',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => router.push(`/dashboard/interviews/${id}`)}
            >
              Quay lại phòng phỏng vấn
            </button>
          </div>

          {errorObj?.requestId && !retryError && (
            <div className={styles.retryMeta}>Mã yêu cầu: {errorObj.requestId}</div>
          )}
        </div>
      </div>
    );
  }

  const errorMessage = queryError && !isProcessing ? queryError.message : null;

  if (errorMessage || !report) {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ color: '#dc2626', fontWeight: 600, textAlign: 'center', padding: '3rem' }}>
          <p>{errorMessage || 'Đã xảy ra lỗi không xác định khi tải báo cáo.'}</p>
          <button
            className={styles.btnPrimary}
            style={{ marginTop: '1.5rem' }}
            onClick={() => router.push('/dashboard/interviews')}
          >
            Quay lại danh sách phỏng vấn
          </button>
        </div>
      </div>
    );
  }

  const { strengths, gaps, actionPlan, rubric, questionReviews } = report;

  return (
    <div className={styles.container}>
      <div id="google_translate_element"></div>
      <div className={styles.header}>
        <h1 className={styles.title}>Kết quả phỏng vấn</h1>
        <button className={styles.btnPrimary} onClick={() => router.push('/dashboard/interviews')}>
          Trở về Danh sách
        </button>
      </div>

      {/* Partial Evaluation Banner */}
      {report.sample?.isPartial && (
        <div className={styles.partialBanner}>
          <span>ℹ️</span>
          <span>
            <strong>Báo cáo một phần:</strong> Đánh giá này dựa trên {report.sample.answeredQuestions}/{report.sample.issuedQuestions} câu hỏi đã nộp bài trước khi kết thúc sớm.
          </span>
        </div>
      )}

      {/* Overall Score Card */}
      <div className={styles.panel} style={{ textAlign: 'center' }}>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreValue}>{report.overallScore}</div>
          <div className={styles.scoreLabel}>/ 100</div>
        </div>
        <p className={styles.disclaimer}>{report.disclaimer}</p>
        <div className={styles.timestamp}>
          Tạo lúc: <ClientDate date={report.createdAt} />
        </div>
      </div>

      {/* STAR Methodology Summary */}
      {report.starSummary && (
        <div className={styles.panel} style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6' }}>
          <h2 className={styles.sectionTitle} style={{ color: '#1e3a8a' }}>
            Phân tích Phương pháp S-T-A-R ({SCORE_SCALE})
          </h2>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.infoLabel}>Điểm STAR Trung bình</div>
              <div className={styles.infoValue} style={{ color: '#0f172a' }}>
                {report.starSummary.averageScore}/100
              </div>
            </div>
            <div>
              <div className={styles.infoLabel}>Thành phần Tốt nhất</div>
              <div className={styles.infoValue} style={{ color: '#16a34a' }}>
                {report.starSummary.strongestComponent || 'N/A'}
              </div>
            </div>
            <div>
              <div className={styles.infoLabel}>Thành phần Yếu nhất</div>
              <div className={styles.infoValue} style={{ color: '#dc2626' }}>
                {report.starSummary.weakestComponent || 'N/A'}
              </div>
            </div>
          </div>

          {/* Component Averages */}
          {report.starSummary.componentAverages && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {report.starSummary.componentAverages.situation !== undefined && (
                <div>
                  <span className={styles.infoLabel}>Situation: </span>
                  <strong>{report.starSummary.componentAverages.situation}/100</strong>
                </div>
              )}
              {report.starSummary.componentAverages.task !== undefined && (
                <div>
                  <span className={styles.infoLabel}>Task: </span>
                  <strong>{report.starSummary.componentAverages.task}/100</strong>
                </div>
              )}
              {report.starSummary.componentAverages.action !== undefined && (
                <div>
                  <span className={styles.infoLabel}>Action: </span>
                  <strong>{report.starSummary.componentAverages.action}/100</strong>
                </div>
              )}
              {report.starSummary.componentAverages.result !== undefined && (
                <div>
                  <span className={styles.infoLabel}>Result: </span>
                  <strong>{report.starSummary.componentAverages.result}/100</strong>
                </div>
              )}
            </div>
          )}

          {/* Recurring Issues */}
          {report.starSummary.recurringIssues && report.starSummary.recurringIssues.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className={styles.infoLabel}>Vấn đề cần lưu ý thường gặp:</div>
              <ul className={styles.list} style={{ marginTop: '0.5rem' }}>
                {report.starSummary.recurringIssues.map((issue) => (
                  <li key={issue} className={styles.listItem} style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: 'none' }}>
                    <div className={`${styles.listIcon} ${styles.iconDanger}`} style={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                      !
                    </div>
                    <div className={styles.listContent}>{issue}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coaching Priorities */}
          {report.starSummary.coachingPriorities && report.starSummary.coachingPriorities.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div className={styles.infoLabel}>Ưu tiên rèn luyện:</div>
              <ul className={styles.list} style={{ marginTop: '0.5rem' }}>
                {report.starSummary.coachingPriorities.map((item) => (
                  <li key={item} className={styles.listItem} style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: 'none' }}>
                    <div className={`${styles.listIcon} ${styles.iconInfo}`} style={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                      ★
                    </div>
                    <div className={styles.listContent}>{item}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Strengths & Gaps Grid */}
      <div className={styles.contentGrid}>
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Điểm mạnh</h2>
          {strengths.length > 0 ? (
            <ul className={styles.list}>
              {strengths.map((item) => (
                <li key={item} className={styles.listItem}>
                  <div className={`${styles.listIcon} ${styles.iconSuccess}`}>✓</div>
                  <div className={styles.listContent}>{item}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#64748b' }}>Chưa có điểm mạnh nổi bật được ghi nhận.</p>
          )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Cần cải thiện</h2>
          {gaps.length > 0 ? (
            <ul className={styles.list}>
              {gaps.map((item) => (
                <li key={item} className={styles.listItem}>
                  <div className={`${styles.listIcon} ${styles.iconDanger}`}>!</div>
                  <div className={styles.listContent}>{item}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#64748b' }}>Không có lỗ hổng lớn được ghi nhận.</p>
          )}
        </div>
      </div>

      {/* Action Plan */}
      <div className={styles.panel}>
        <h2 className={styles.sectionTitle}>Kế hoạch hành động</h2>
        {actionPlan.length > 0 ? (
          <ul className={styles.list}>
            {actionPlan.map((item, idx) => (
              <li key={item} className={styles.listItem}>
                <div className={`${styles.listIcon} ${styles.iconInfo}`}>{idx + 1}</div>
                <div className={styles.listContent}>{item}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#64748b' }}>Chưa có kế hoạch hành động cụ thể.</p>
        )}
      </div>

      {/* Criteria Rubric */}
      {rubric.length > 0 && (
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Tiêu chí đánh giá chuyên môn</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Tiêu chí</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Điểm</th>
                  <th>Bằng chứng &amp; Lời phê</th>
                </tr>
              </thead>
              <tbody>
                {rubric.map((item) => (
                  <tr key={item.criterion}>
                    <td className={styles.criterion}>{item.criterion}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.scorePill}>{item.score}/100</span>
                    </td>
                    <td>{item.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Reviews (Canonical production A9) */}
      {questionReviews && questionReviews.length > 0 ? (
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Đánh giá chi tiết từng câu hỏi</h2>
          <div>
            {questionReviews.map((rev) => {
              const star = rev.star;
              const hasStar = Boolean(star?.applicable);
              return (
                <div key={rev.questionId} className={styles.questionReviewCard}>
                  <div className={styles.questionHeader}>
                    <div className={styles.questionText}>
                      Câu {rev.sequence}: {rev.question}
                    </div>
                    {rev.topic && (
                      <span className={styles.scorePill} style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {rev.topic}
                      </span>
                    )}
                  </div>

                  <div className={styles.answerText}>
                    <strong>Câu trả lời của bạn:</strong> {rev.answer}
                  </div>

                  {/* STAR Breakdown if applicable */}
                  {hasStar && star && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                          Phân tích S-T-A-R ({star.scoreScale || SCORE_SCALE})
                        </h4>
                        {typeof star.overallScore === 'number' && (
                          <span className={styles.scorePill} style={{ marginLeft: 'auto' }}>
                            {star.overallScore}/100
                          </span>
                        )}
                      </div>

                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th style={{ width: '120px' }}>Thành phần</th>
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
                                  <td className={styles.criterion}>Situation</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
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
                                  <td className={styles.criterion}>Task</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
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
                                  <td className={styles.criterion}>Action</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
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
                                  <td className={styles.criterion}>Result</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
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
                            ✨ Điểm mạnh:
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
                  )}

                  {/* Rubric Breakdown for Generic evaluation */}
                  {Array.isArray(rev.rubric) && rev.rubric.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                        Tiêu chí đánh giá
                      </h4>
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th style={{ width: '150px' }}>Tiêu chí</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Điểm</th>
                              <th>Bằng chứng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rev.rubric.map((r, rIdx) => (
                              <tr key={rIdx}>
                                <td className={styles.criterion}>{r.criterion}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={styles.scorePill}>{r.score}/100</span>
                                </td>
                                <td>{r.evidence || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {rev.feedback && (
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>
                      <strong>Nhận xét:</strong> {rev.feedback}
                    </div>
                  )}

                  {rev.strengths && rev.strengths.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#059669', display: 'block', marginBottom: '0.25rem' }}>
                        Điểm mạnh:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#064e3b' }}>
                        {rev.strengths.map((s, idx) => (
                          <li key={idx} style={{ marginBottom: '0.2rem' }}>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rev.improvements && rev.improvements.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.25rem' }}>
                        Cần cải thiện:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#7f1d1d' }}>
                        {rev.improvements.map((imp, idx) => (
                          <li key={idx} style={{ marginBottom: '0.2rem' }}>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rev.suggestedImprovedAnswer && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <strong style={{ color: '#2563eb', display: 'block', marginBottom: '0.25rem' }}>
                        Câu trả lời gợi ý:
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
                        &ldquo;{rev.suggestedImprovedAnswer}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : interview?.answers && interview.answers.length > 0 ? (
        /* Fallback to interview answers if questionReviews not populated */
        <div className={styles.panel}>
          <h2 className={styles.sectionTitle}>Lịch sử Câu hỏi &amp; Đánh giá chi tiết</h2>
          <div>
            {interview.answers.map((answer, index) => {
              const question = interview.questions?.find((q) => q.id === answer.questionId);
              const evalData = safeAnswerEvaluation(answer.evaluation);
              const star = evalData.star;
              return (
                <div key={answer.id} className={styles.questionReviewCard}>
                  <div className={styles.questionText} style={{ marginBottom: '0.5rem' }}>
                    Câu {index + 1}: {question?.content || 'Câu hỏi'}
                  </div>
                  <div className={styles.answerText}>{answer.content}</div>

                  {star?.applicable ? (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Đánh giá S-T-A-R ({evalData.scoreScale})
                      </h4>
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th style={{ width: '120px' }}>Thành phần</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Trạng thái</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Điểm</th>
                              <th>Nhận xét</th>
                            </tr>
                          </thead>
                          <tbody>
                            {star.situation && (() => {
                              const norm = normalizeStarComponent(star.situation);
                              return (
                                <tr>
                                  <td className={styles.criterion}>Situation</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
                                  </td>
                                  <td>{norm.feedback}</td>
                                </tr>
                              );
                            })()}
                            {star.task && (() => {
                              const norm = normalizeStarComponent(star.task);
                              return (
                                <tr>
                                  <td className={styles.criterion}>Task</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
                                  </td>
                                  <td>{norm.feedback}</td>
                                </tr>
                              );
                            })()}
                            {star.action && (() => {
                              const norm = normalizeStarComponent(star.action);
                              return (
                                <tr>
                                  <td className={styles.criterion}>Action</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
                                  </td>
                                  <td>{norm.feedback}</td>
                                </tr>
                              );
                            })()}
                            {star.result && (() => {
                              const norm = normalizeStarComponent(star.result);
                              return (
                                <tr>
                                  <td className={styles.criterion}>Result</td>
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
                                    <span className={styles.scorePill}>{norm.score}/100</span>
                                  </td>
                                  <td>{norm.feedback}</td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {star.strengths && star.strengths.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <strong style={{ color: '#059669', display: 'block', marginBottom: '0.25rem' }}>
                            Điểm mạnh:
                          </strong>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#064e3b' }}>
                            {star.strengths.map((s: string, idx: number) => (
                              <li key={idx} style={{ marginBottom: '0.2rem' }}>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {evalData.scores.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                              <thead>
                                <tr>
                                  <th style={{ width: '150px' }}>Tiêu chí</th>
                                  <th style={{ width: '80px', textAlign: 'center' }}>Điểm</th>
                                  <th>Bằng chứng</th>
                                </tr>
                              </thead>
                              <tbody>
                                {evalData.scores.map((r, rIdx: number) => (
                                  <tr key={rIdx}>
                                    <td className={styles.criterion}>{r.criterion}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={styles.scorePill}>{r.score}/100</span>
                                    </td>
                                    <td>{r.evidence || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {evalData.feedback && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Nhận xét: </strong>
                          <span style={{ color: '#475569', fontSize: '0.95rem' }}>{evalData.feedback}</span>
                        </div>
                      )}
                      {evalData.strengths.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#059669' }}>Điểm mạnh: </strong>
                          <span style={{ color: '#064e3b', fontSize: '0.95rem' }}>{evalData.strengths.join('; ')}</span>
                        </div>
                      )}
                      {evalData.improvements.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#b91c1c' }}>Cần cải thiện: </strong>
                          <span style={{ color: '#7f1d1d', fontSize: '0.95rem' }}>{evalData.improvements.join('; ')}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
