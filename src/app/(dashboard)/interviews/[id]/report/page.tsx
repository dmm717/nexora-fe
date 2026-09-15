'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import styles from './Report.module.css';
import { useInterview, useInterviewReport } from '@/hooks/queries/useInterviews';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { ClientDate } from '@/components/ui/ClientDate';
import { ApiError } from '@/services/apiClient';
import { interviewApi, type PracticeAgainCommand } from '@/services/interviewApi';
import {
  isReportProcessingError,
  isReportFailedError,
  normalizeStarComponent,
  generateIdempotencyKey,
  SCORE_SCALE,
} from '@/services/interviewContract';
import Link from 'next/link';

function PracticeAgainButton({
  interviewId,
  questionId,
  reason,
  focus,
  label,
  className,
}: {
  interviewId: string;
  questionId?: string;
  reason: PracticeAgainCommand['reason'];
  focus: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const handlePractice = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const payload: PracticeAgainCommand = { focus, reason };
      if (questionId) payload.questionId = questionId;

      const res = await interviewApi.practiceAgain(interviewId, payload, idempotencyKeyRef.current);
      idempotencyKeyRef.current = generateIdempotencyKey(); // Refresh on success
      router.push(`/interviews/${res.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi tạo bài luyện tập mới.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start mt-3">
      <button
        onClick={handlePractice}
        disabled={loading}
        className={className || "flex items-center gap-2 bg-primary text-on-primary px-6 py-2 rounded-xl font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"}
      >
        <span className="material-symbols-outlined text-[20px]">replay</span>
        <span>{loading ? 'Đang khởi tạo...' : label || 'Thực hành lại'}</span>
      </button>
      {error && <span className="text-[#dc2626] text-[0.85rem] mt-1">{error}</span>}
    </div>
  );
}

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
      <div className="flex-1 pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto bg-[#F5F3FF] min-h-screen">
        <div className="bg-surface rounded-[24px] p-stack-md premium-shadow hover-shadow text-center py-12">
          <h2 className="font-headline-md text-headline-md">Báo cáo vẫn đang được xử lý lâu hơn dự kiến.</h2>
          <p className="text-secondary mt-4">Bạn có thể thử làm mới trạng thái sau ít phút.</p>
          <div className="mt-8 flex justify-center gap-4">
            <button className="bg-primary text-on-primary px-6 py-2 rounded-xl font-label-md" onClick={handleRefreshReportState} disabled={refreshing}>
              {refreshing ? 'Đang làm mới...' : 'Làm mới trạng thái'}
            </button>
            <button className="bg-surface-container text-on-surface px-6 py-2 rounded-xl font-label-md" onClick={() => router.push('/interviews')}>
              Về danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State: Report is actively generating
  if (loading || (isProcessing && !report)) {
    return (
      <div className="flex-1 pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto bg-[#F5F3FF] min-h-screen">
        <div className="bg-surface rounded-[24px] p-stack-md premium-shadow hover-shadow text-center py-16">
          <h2 className="font-headline-md text-headline-md">Đang tổng hợp báo cáo...</h2>
          <p className="text-on-surface font-semibold mt-4">AI đang phân tích câu trả lời và tổng hợp báo cáo phỏng vấn của bạn. Quá trình này có thể mất đến 1 phút...</p>
          <div className="mt-8 flex justify-center">
            <div className="w-10 h-10 border-4 border-surface-container border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // State: Report generation failed
  if (isFailed && !report) {
    const errorObj = queryError instanceof ApiError ? queryError : null;
    return (
      <div className="flex-1 pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto bg-[#F5F3FF] min-h-screen">
        <div className="bg-surface rounded-[24px] p-stack-md premium-shadow hover-shadow text-center py-12">
          <h2 className="font-headline-md text-headline-md text-error">Báo cáo phỏng vấn chưa tạo được ⚠️</h2>
          <p className="text-secondary mt-4 max-w-2xl mx-auto">Hệ thống gặp sự cố gián đoạn trong quá trình phân tích bài phỏng vấn. Bạn có thể thử lại mà không bị trừ thêm lượt phỏng vấn nào.</p>
          
          {retryError && (
            <div className="mt-4 text-error font-medium">
              {retryError.message}
              {retryError.requestId && <div className="text-sm">Mã yêu cầu: {retryError.requestId}</div>}
            </div>
          )}

          <div className="mt-8 flex justify-center gap-4">
            <button className="bg-primary text-on-primary px-6 py-2 rounded-xl font-label-md" onClick={handleRetryReport} disabled={retrying}>
              {retrying ? 'Đang gửi yêu cầu...' : 'Thử tạo lại báo cáo ngay'}
            </button>
            <button className="border border-outline-variant text-on-surface px-6 py-2 rounded-xl font-label-md" onClick={() => router.push(`/interviews/${id}`)}>
              Vào phòng phỏng vấn
            </button>
          </div>
          {errorObj?.requestId && !retryError && (
            <div className="mt-4 text-sm text-secondary">Mã yêu cầu: {errorObj.requestId}</div>
          )}
        </div>
      </div>
    );
  }

  const errorMessage = queryError && !isProcessing ? queryError.message : null;

  if (errorMessage || !report) {
    return (
      <div className="flex-1 pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto bg-[#F5F3FF] min-h-screen">
        <div className="bg-surface rounded-[24px] p-stack-md premium-shadow hover-shadow text-center py-12 text-error font-semibold">
          <p>{errorMessage || 'Đã xảy ra lỗi không xác định khi tải báo cáo.'}</p>
          <button className="mt-6 bg-primary text-on-primary px-6 py-2 rounded-xl font-label-md" onClick={() => router.push('/interviews')}>
            Về danh sách phỏng vấn
          </button>
        </div>
      </div>
    );
  }

  const { strengths, gaps, actionPlan, rubric, questionReviews } = report;

  return (
    <main className="flex-1 pt-24 md:pt-28 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col gap-stack-lg bg-[#F5F3FF] min-h-screen">
      <div id="google_translate_element"></div>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Báo cáo phỏng vấn</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                  <span className="font-semibold">{interview?.role || 'Business Analyst'}</span>, kết thúc lúc <ClientDate date={report.createdAt} />
              </p>
          </div>
          <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 bg-surface text-primary border border-primary px-5 py-2 rounded-xl font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Tải báo cáo PDF
              </button>
              <PracticeAgainButton
                interviewId={id as string}
                reason="manual"
                focus="correctness"
                label="Luyện lại"
                className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2 rounded-xl font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm"
              />
          </div>
      </header>

      {/* Partial Evaluation Banner */}
      {report.sample?.isPartial && (
        <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-4 flex gap-3 items-center text-[#9a3412]">
          <span className="material-symbols-outlined">info</span>
          <span className="font-label-md">
            <strong>Báo cáo một phần:</strong> Đánh giá này dựa trên {report.sample.answeredQuestions}/{report.sample.issuedQuestions} câu hỏi đã nộp bài trước khi kết thúc sớm.
          </span>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Tổng quan (8/12) */}
          <div className="md:col-span-8 bg-surface rounded-[24px] p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-[#E0E7FF] border border-transparent">
              <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>summarize</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Tổng quan ứng viên</h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {report.disclaimer || 'Chưa có tóm tắt.'}
              </p>
          </div>

          {/* Match % (4/12) */}
          <div className="md:col-span-4 bg-surface rounded-[24px] p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 border border-transparent flex flex-col items-center justify-center relative overflow-hidden">
              <h2 className="font-headline-md text-[20px] font-semibold text-on-surface-variant mb-2">Điểm tổng quan</h2>
              <div className="text-[64px] font-display font-bold text-primary leading-none select-none">{report.overallScore}</div>
              <p className="font-label-sm text-label-sm text-secondary mt-2 bg-surface-container px-3 py-1 rounded-full">/ 100</p>
          </div>

          {/* Chi tiết điểm (5/12) */}
          <div className="md:col-span-5 bg-surface rounded-[24px] p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 border border-transparent space-y-6">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-tertiary" style={{fontVariationSettings: "'FILL'1"}}>analytics</span>
                  <h2 className="font-headline-md text-[20px] font-bold text-on-surface">Chi tiết điểm phỏng vấn</h2>
              </div>
              <div className="space-y-5">
                  {rubric.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between mb-2">
                            <span className="font-label-md text-label-md text-on-surface">{item.criterion}</span>
                            <span className="font-label-md text-label-md text-primary font-bold">{item.score}/100</span>
                        </div>
                        <div className="w-full bg-surface-container rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{width: `${item.score}%`}}></div>
                        </div>
                    </div>
                  ))}
              </div>
          </div>

          {/* Phân tích STAR (7/12) */}
          <div className="md:col-span-7 bg-surface rounded-[24px] p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 border border-transparent border-l-4 border-l-tertiary">
              <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-tertiary" style={{fontVariationSettings: "'FILL'1"}}>psychology</span>
                  <h2 className="font-headline-md text-[20px] font-bold text-on-surface">Phân tích giao tiếp & STAR</h2>
              </div>
              
              {report.starSummary && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high flex flex-col justify-center items-center">
                          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Thành phần Tốt nhất</p>
                          <p className="font-body-md text-body-md font-bold text-[#16a34a]">{report.starSummary.strongestComponent || 'N/A'}</p>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high flex flex-col justify-center items-center">
                          <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Thành phần Yếu nhất</p>
                          <p className="font-body-md text-body-md font-bold text-[#dc2626]">{report.starSummary.weakestComponent || 'N/A'}</p>
                      </div>
                  </div>
                  <div className="bg-surface-container-low/60 p-4 rounded-xl border border-surface-container-high space-y-3">
                      <div className="flex justify-between items-center">
                          <p className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Phân tích mô hình STAR</p>
                          <span className="font-label-md font-bold text-primary">{report.starSummary.averageScore}/100</span>
                      </div>
                      <div className="space-y-2 grid grid-cols-2 gap-x-4">
                          <p className="font-body-md text-body-md text-on-surface-variant"><strong>Situation:</strong> {report.starSummary.componentAverages?.situation ?? 0}/100</p>
                          <p className="font-body-md text-body-md text-on-surface-variant"><strong>Task:</strong> {report.starSummary.componentAverages?.task ?? 0}/100</p>
                          <p className="font-body-md text-body-md text-on-surface-variant"><strong>Action:</strong> {report.starSummary.componentAverages?.action ?? 0}/100</p>
                          <p className="font-body-md text-body-md text-on-surface-variant"><strong>Result:</strong> {report.starSummary.componentAverages?.result ?? 0}/100</p>
                      </div>
                      {report.starSummary.recurringIssues && report.starSummary.recurringIssues.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/30">
                            <p className="font-label-md font-bold text-[#b91c1c] mb-2">Vấn đề thường gặp:</p>
                            <ul className="list-disc pl-5 text-on-surface-variant text-sm">
                                {report.starSummary.recurringIssues.map(issue => <li key={issue}>{issue}</li>)}
                            </ul>
                        </div>
                      )}
                  </div>
                </>
              )}
          </div>

          {/* Đánh giá chi tiết (12/12) */}
          <div className="md:col-span-12 bg-surface rounded-[24px] p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 border border-transparent">
              <div className="flex items-center justify-between mb-6 border-b border-outline-variant/30 pb-4">
                  <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>insights</span>
                      <h2 className="font-headline-md text-[20px] font-bold text-on-surface">Đánh giá chi tiết & Lộ trình học tập</h2>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Khoảng trống kỹ năng */}
                  <div className="space-y-4">
                      <h4 className="font-label-md font-bold text-secondary uppercase tracking-wider">Khoảng trống kỹ năng</h4>
                      <div className="space-y-3">
                          {gaps.length > 0 ? gaps.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
                                  <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5">warning</span>
                                  <div>
                                      <p className="font-body-md text-body-md text-on-surface-variant">{item}</p>
                                  </div>
                              </div>
                          )) : (
                              <p className="text-secondary">Không có lỗ hổng lớn được ghi nhận.</p>
                          )}
                      </div>

                      <h4 className="font-label-md font-bold text-[#16a34a] uppercase tracking-wider mt-6">Điểm mạnh nổi bật</h4>
                      <div className="space-y-3">
                          {strengths.length > 0 ? strengths.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
                                  <span className="material-symbols-outlined text-[#16a34a] flex-shrink-0 mt-0.5">check_circle</span>
                                  <div>
                                      <p className="font-body-md text-body-md text-on-surface-variant">{item}</p>
                                  </div>
                              </div>
                          )) : (
                              <p className="text-secondary">Chưa có điểm mạnh nổi bật.</p>
                          )}
                      </div>
                  </div>

                  {/* Kế hoạch hành động */}
                  <div className="space-y-4">
                      <h4 className="font-label-md font-bold text-secondary uppercase tracking-wider">Kế hoạch hành động</h4>
                      <div className="space-y-3">
                          {actionPlan.length > 0 ? actionPlan.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-outline-variant/30 hover:shadow-sm transition-shadow">
                                  <div className="w-12 h-12 bg-primary-container text-primary rounded-lg flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</div>
                                  <div className="flex-1 min-w-0">
                                      <p className="font-label-md text-label-md text-on-surface leading-tight">{item}</p>
                                  </div>
                              </div>
                          )) : (
                              <p className="text-secondary">Chưa có kế hoạch hành động cụ thể.</p>
                          )}
                      </div>
                  </div>

              </div>
          </div>

          {/* Chi tiết từng câu hỏi (12/12) */}
          <div className="md:col-span-12 bg-surface rounded-[24px] p-stack-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 border border-transparent">
              <div className="flex items-center justify-between mb-6 border-b border-outline-variant/30 pb-4">
                  <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL'1"}}>question_answer</span>
                      <h2 className="font-headline-md text-[20px] font-bold text-on-surface">Đánh giá chi tiết từng câu hỏi</h2>
                  </div>
              </div>
              <div className="flex flex-col gap-6">
                  {questionReviews && questionReviews.map((rev, idx) => (
                      <div key={idx} className="border border-outline-variant/30 rounded-2xl p-5 bg-surface-container-lowest">
                          <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">Câu {rev.sequence}</span>
                                  {rev.topic && <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">{rev.topic}</span>}
                              </div>
                              <h3 className="font-label-lg font-semibold text-on-surface">{rev.question}</h3>
                          </div>
                          <div className="bg-[#f8fafc] p-4 rounded-xl mb-4 border border-[#e2e8f0]">
                              <p className="text-sm font-semibold text-[#64748b] mb-1">Câu trả lời của bạn:</p>
                              <p className="text-on-surface">{rev.answer}</p>
                          </div>
                          
                          {/* STAR Breakdown if applicable */}
                          {rev.star?.applicable && (
                              <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-3">
                                      <h4 className="font-semibold text-on-surface">Phân tích S-T-A-R</h4>
                                      <span className="bg-primary-container text-primary px-2 py-0.5 rounded text-xs font-bold">{rev.star.overallScore}/100</span>
                                  </div>
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-left text-sm border-collapse">
                                          <thead>
                                              <tr className="bg-surface-container-low text-on-surface-variant">
                                                  <th className="p-2 border border-outline-variant/20">Thành phần</th>
                                                  <th className="p-2 border border-outline-variant/20 w-[100px] text-center">Trạng thái</th>
                                                  <th className="p-2 border border-outline-variant/20 w-[60px] text-center">Điểm</th>
                                                  <th className="p-2 border border-outline-variant/20">Nhận xét</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {['situation', 'task', 'action', 'result'].map(comp => {
                                                  const componentData = (rev.star as any)?.[comp];
                                                  if (!componentData) return null;
                                                  const norm = normalizeStarComponent(componentData);
                                                  return (
                                                      <tr key={comp}>
                                                          <td className="p-2 border border-outline-variant/20 font-semibold capitalize">{comp}</td>
                                                          <td className="p-2 border border-outline-variant/20 text-center">
                                                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${norm.detected ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                                                                  {norm.detected ? 'Phát hiện' : 'Chưa rõ'}
                                                              </span>
                                                          </td>
                                                          <td className="p-2 border border-outline-variant/20 text-center font-bold">{norm.score}</td>
                                                          <td className="p-2 border border-outline-variant/20">
                                                              <p>{norm.feedback}</p>
                                                              {norm.evidence && <p className="text-xs text-secondary mt-1"><em>{norm.evidence}</em></p>}
                                                          </td>
                                                      </tr>
                                                  )
                                              })}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}

                          {rev.feedback && (
                              <div className="mb-4">
                                  <p className="text-on-surface text-sm"><strong>Nhận xét:</strong> {rev.feedback}</p>
                              </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {rev.strengths && rev.strengths.length > 0 && (
                                  <div className="bg-[#ecfdf5] p-3 rounded-lg border border-[#a7f3d0]">
                                      <strong className="text-[#065f46] text-sm block mb-1">Điểm mạnh:</strong>
                                      <ul className="list-disc pl-4 text-sm text-[#064e3b]">
                                          {rev.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                      </ul>
                                  </div>
                              )}
                              {rev.improvements && rev.improvements.length > 0 && (
                                  <div className="bg-[#fef2f2] p-3 rounded-lg border border-[#fecaca]">
                                      <strong className="text-[#991b1b] text-sm block mb-1">Cần cải thiện:</strong>
                                      <ul className="list-disc pl-4 text-sm text-[#7f1d1d]">
                                          {rev.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                      </ul>
                                  </div>
                              )}
                          </div>

                          {rev.suggestedImprovedAnswer && (
                              <div className="bg-[#eff6ff] p-4 rounded-xl border border-[#bfdbfe]">
                                  <strong className="text-[#1e40af] text-sm block mb-1">Câu trả lời gợi ý:</strong>
                                  <p className="text-sm text-[#1e3a8a] italic">"{rev.suggestedImprovedAnswer}"</p>
                              </div>
                          )}

                          <div className="mt-4 flex justify-end">
                              <PracticeAgainButton
                                  interviewId={id as string}
                                  questionId={rev.questionId}
                                  reason="manual"
                                  focus="correctness"
                                  label="Luyện lại câu này"
                                  className="flex items-center gap-1 bg-surface-container text-on-surface px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-outline-variant/30 transition-colors"
                              />
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Đề xuất cuối cùng */}
          <div className="md:col-span-12 bg-primary text-on-primary rounded-[24px] p-stack-lg flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden mt-4">
              <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
                  <img className="w-full h-full object-cover mix-blend-overlay" alt="" src="/img/career-roadmap.png" />
              </div>
              <div className="z-10 md:w-2/3 mb-6 md:mb-0 pr-stack-lg">
                  <h3 className="font-headline-md text-[24px] font-bold mb-2">Đề xuất cuối cùng từ Nexora AI</h3>
                  <p className="font-body-md text-on-primary-container leading-relaxed">
                    Dựa trên hiệu suất hiện tại, bạn có tiềm năng tốt nhưng cần tinh chỉnh lại để đạt kết quả hoàn hảo. Khuyến nghị thực hành thêm các phiên phỏng vấn tình huống (Behavioral) và cải thiện các lỗ hổng kiến thức trước kỳ phỏng vấn thực tế.
                  </p>
              </div>
              <div className="z-10 flex-shrink-0">
                  <Link href="/learning-path" className="flex items-center gap-2 bg-surface text-primary font-label-md text-label-md px-6 py-3 rounded-xl hover:bg-surface-container transition-colors shadow-md font-bold w-full md:w-auto">
                      Xem Roadmap cải thiện
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
              </div>
          </div>

      </div>
    </main>
  );
}
