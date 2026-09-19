'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useInterview, useInterviewReport } from '@/hooks/queries/useInterviews';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { ApiError } from '@/services/apiClient';
import { interviewApi, type PracticeAgainCommand } from '@/services/interviewApi';
import {
  isReportProcessingError,
  isReportFailedError,
  getInterviewReportRenderState,
  generateIdempotencyKey,
  SCORE_SCALE,
  shouldShowGroundedRewrite,
} from '@/services/interviewContract';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadialScore } from '@/components/ui/RadialScore';
import { StarEvaluationCard } from '@/components/features/coaching/StarEvaluationCard';
import { SampleAnswerCard } from '@/components/features/coaching/SampleAnswerCard';

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  useAutoTranslate();

  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'star' | 'action_plan'>('overview');
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [practicingAgain, setPracticingAgain] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [retryError, setRetryError] = useState<{ message: string; requestId?: string } | null>(null);

  const retryKeyRef = useRef<string>(generateIdempotencyKey());
  const practiceAgainKeyRef = useRef<string>(generateIdempotencyKey());

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
  const reportRenderState = getInterviewReportRenderState({
    loading,
    failed: isFailed,
    pollingBoundExhausted: reportPollingBoundExhausted,
    processing: isProcessing,
  });

  // Practice Again creates a NEW linked session ID
  const handlePracticeAgain = async (questionId?: string, topic?: string) => {
    if (practicingAgain) return;
    setPracticingAgain(true);
    try {
      const payload: PracticeAgainCommand = {
        focus: topic || interview?.role || 'Luyện tập phỏng vấn',
        reason: questionId ? 'repeat_question' : 'manual',
        ...(questionId ? { questionId } : {}),
      };
      const res = await interviewApi.practiceAgain(id, payload, practiceAgainKeyRef.current);
      practiceAgainKeyRef.current = generateIdempotencyKey();
      router.push(`/interviews/${res.id}`);
    } catch (err: unknown) {
      alert(err instanceof ApiError ? err.message : 'Không thể khởi tạo phiên luyện tập lại.');
      setPracticingAgain(false);
    }
  };

  // Retry report generation
  const handleRetryReport = async () => {
    if (retrying) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await interviewApi.retryReport(id, retryKeyRef.current);
      resetReportPollingAttempts();
      await queryClient.invalidateQueries({ queryKey: ['interview', id] });
      await queryClient.invalidateQueries({ queryKey: ['interviewReport', id] });
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

  // Loading state
  if (reportRenderState === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="functional-spinner w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500">Đang tải báo cáo đánh giá phỏng vấn...</p>
      </div>
    );
  }

  // Confirmed server failed state
  if (reportRenderState === 'failed') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-red-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-red-900">Chưa thể xuất báo cáo</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {retryError?.message ||
            'Hệ thống gặp sự cố khi tạo báo cáo (INTERVIEW_REPORT_FAILED). Bạn có thể yêu cầu tạo lại.'}
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleRetryReport}
            disabled={retrying}
            className="shadow-sm font-semibold"
          >
            {retrying ? 'Đang gửi yêu cầu tạo lại...' : 'Thử tạo lại báo cáo'}
          </Button>
        </div>
      </div>
    );
  }

  // Polling exhaustion (client-side timeout without confirmed server failure)
  if (reportRenderState === 'polling_exhausted') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl">hourglass_empty</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Báo cáo cần thêm thời gian xử lý</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Quá trình tổng hợp báo cáo đang mất nhiều thời gian hơn dự kiến. Trình duyệt đã tạm dừng tự động kiểm tra để tiết kiệm tài nguyên.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={async () => {
              resetReportPollingAttempts();
              await queryClient.invalidateQueries({ queryKey: ['interview', id] });
              await queryClient.invalidateQueries({ queryKey: ['interviewReport', id] });
            }}
            className="shadow-sm font-semibold"
          >
            Kiểm tra lại trạng thái
          </Button>
        </div>
      </div>
    );
  }

  // Processing state while the local polling budget remains available
  if (reportRenderState === 'processing') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="functional-spinner w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Báo cáo đang được tổng hợp...</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Nexora AI đang phân tích dữ liệu câu trả lời, đối soát thang điểm Rubric và mô hình STAR. Quá trình này diễn ra hoàn toàn tự động.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy báo cáo</h2>
        <p className="text-xs text-slate-500">Buổi phỏng vấn này chưa có dữ liệu báo cáo.</p>
        <Link href="/interviews" className="inline-block mt-4 text-indigo-600 underline font-semibold text-sm">
          Trở về Danh sách phỏng vấn
        </Link>
      </div>
    );
  }

  const sample = report.sample;
  const isPartial = sample?.isPartial ?? false;
  const answeredCount = sample?.answeredQuestions ?? report.questionReviews?.length ?? 0;
  const totalCount = sample?.issuedQuestions;
  const hasOverallScore = report.overallScore !== null && report.overallScore !== undefined;
  const overallScore = report.overallScore;

  const reviews = report.questionReviews || [];
  const safeSelectedIdx = Math.min(selectedQuestionIdx, Math.max(0, reviews.length - 1));
  const activeReview = reviews[safeSelectedIdx] || null;
  const showGroundedRewrite = activeReview
    ? shouldShowGroundedRewrite({
        candidateAnswer: activeReview.answer,
        improvedAnswer: activeReview.suggestedImprovedAnswer,
      })
    : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/interviews" className="hover:text-indigo-600 transition-colors">
              Phỏng vấn thử
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Báo cáo đánh giá #{id.substring(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Báo cáo đánh giá Phỏng vấn</span>
            {isPartial ? (
              <Badge variant="warning" size="sm">
                Báo cáo thu gọn ({totalCount == null ? `${answeredCount} câu hỏi` : `${answeredCount}/${totalCount} câu hỏi`})
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Báo cáo hoàn chỉnh
              </Badge>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Vị trí: {interview?.role || 'Ứng viên'} · {interview?.seniority || ''} ({interview?.interviewType || 'technical'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<span className="material-symbols-outlined text-[18px]">print</span>}
          >
            In báo cáo
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handlePracticeAgain()}
            disabled={practicingAgain}
            icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
            className="shadow-sm font-semibold"
          >
            {practicingAgain ? 'Đang tạo phiên mới...' : 'Luyện tập lại'}
          </Button>
        </div>
      </div>

      {/* Snapshot Notice: Immutable Context */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-[18px]">history_edu</span>
          <span>
            <strong>Bản chụp bối cảnh lịch sử:</strong> Đánh giá này gắn liền với snapshot năng lực tại thời điểm nộp bài. Cập nhật hồ sơ sự nghiệp trong tương lai sẽ không làm thay đổi kết quả này.
          </span>
        </div>
        <Badge variant="neutral" size="sm">Immutable Snapshot</Badge>
      </div>

      {/* Partial Notice if early finished */}
      {isPartial && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0">info</span>
          <div>
            <strong>Phiên kết thúc sớm tại mốc {answeredCount} câu hỏi:</strong> Báo cáo đánh giá đầy đủ cho các câu đã nộp. Bạn có thể luyện tập lại bất kỳ lúc nào để hoàn thiện trọn vẹn phiên.
          </div>
        </div>
      )}

      {/* Overview Score Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radial Score Card */}
        <Card variant="elevated" padding="lg" className="flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Điểm tổng hợp toàn phiên
          </span>
          <RadialScore score={overallScore} size={140} strokeWidth={12} />
          <div>
            <div className="text-sm font-bold text-slate-900">
              {hasOverallScore && overallScore !== null
                ? overallScore >= 80
                  ? 'Mức độ Sẵn sàng Cao'
                  : overallScore >= 60
                  ? 'Mức độ Khá · Cần cải thiện'
                  : 'Cần rèn luyện thêm'
                : 'Chưa đủ dữ liệu điểm'}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thang điểm {SCORE_SCALE} chuẩn hóa theo năng lực thực chiến
            </p>
          </div>
        </Card>

        {/* 4 Rubric Axes Breakdown */}
        <Card variant="elevated" padding="lg" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đánh giá 4 trục Rubric tiêu chuẩn
            </span>
            <span className="text-xs text-slate-500">Thang điểm 0 - 100</span>
          </div>

          <div className="space-y-3.5">
            {report.rubric && report.rubric.length > 0 ? (
              report.rubric.map((item, idx) => {
                const labelMap: Record<string, string> = {
                  correctness: 'Tính chính xác kỹ thuật (Correctness)',
                  structure: 'Cấu trúc & Mạch lạc (Structure)',
                  completeness: 'Độ bao quát & Đầy đủ (Completeness)',
                  clarity: 'Sự rõ ràng & Tự tin (Clarity)',
                };

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {labelMap[item.criterion] || item.criterion}
                      </span>
                      <span className="font-bold text-indigo-600">{item.score}/100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.score >= 80
                            ? 'bg-emerald-600'
                            : item.score >= 60
                            ? 'bg-indigo-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4">Chưa có phân bổ điểm Rubric.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tổng quan &amp; Nhận xét
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-1 border-b-2 font-semibold transition-colors ${
              activeTab === 'questions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chi tiết từng câu ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('action_plan')}
            className={`py-3 px-1 border-b-2 font-semibold transition-colors ${
              activeTab === 'action_plan'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kế hoạch hành động
          </button>
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card variant="elevated" padding="md" className="space-y-3 bg-emerald-50/40 border-emerald-200">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <span className="material-symbols-outlined text-emerald-600">thumb_up</span>
              <span>Điểm sáng nổi bật toàn phiên</span>
            </div>
            {report.strengths && report.strengths.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-800 list-disc list-inside leading-relaxed">
                {report.strengths.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Chưa ghi nhận điểm sáng cụ thể.</p>
            )}
          </Card>

          {/* Gaps / Areas to improve */}
          <Card variant="elevated" padding="md" className="space-y-3 bg-amber-50/40 border-amber-200">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <span className="material-symbols-outlined text-amber-600">lightbulb</span>
              <span>Điểm cần hoàn thiện</span>
            </div>
            {report.gaps && report.gaps.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-800 list-disc list-inside leading-relaxed">
                {report.gaps.map((im: string, i: number) => (
                  <li key={i}>{im}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Chưa có đề xuất hoàn thiện.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Detailed Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Question Selector buttons */}
          <div className="flex flex-wrap gap-2">
            {reviews.map((q, idx) => (
              <button
                key={q.questionId}
                onClick={() => setSelectedQuestionIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  safeSelectedIdx === idx
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Câu {q.sequence}
              </button>
            ))}
          </div>

          {activeReview ? (
            <Card variant="elevated" padding="lg" className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-base text-slate-900">
                  Câu hỏi {activeReview.sequence}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePracticeAgain(activeReview.questionId, activeReview.topic)}
                  disabled={practicingAgain}
                  icon={<span className="material-symbols-outlined text-[16px]">replay</span>}
                >
                  Luyện tập lại câu này
                </Button>
              </div>

              {/* Question content */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                &ldquo;{activeReview.question}&rdquo;
              </div>

              {/* Candidate verbatim answer */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">
                  Câu trả lời thực tế của bạn (Verbatim)
                </h4>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeReview.answer}
                </div>
              </div>

              {/* STAR Evaluation if present */}
              {activeReview.star && activeReview.star.applicable && (
                <StarEvaluationCard star={activeReview.star} />
              )}

              {/* Feedback */}
              {activeReview.feedback && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-1">
                  <h4 className="text-xs font-bold text-indigo-900">Nhận xét chi tiết từ AI</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeReview.feedback}</p>
                </div>
              )}

              {/* Grounded rewrite is distinct from the illustrative sample below. */}
              {showGroundedRewrite && activeReview.suggestedImprovedAnswer && (
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                    <span>Cách diễn đạt tốt hơn từ câu trả lời của bạn</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Phiên bản này chỉ sử dụng những thông tin bạn đã thực sự nêu.
                  </p>
                  <p className="whitespace-pre-wrap break-words text-xs sm:text-sm text-slate-800 italic leading-relaxed pt-1">
                    {activeReview.suggestedImprovedAnswer}
                  </p>
                </div>
              )}

              {activeReview.sampleAnswer && (
                <SampleAnswerCard sample={activeReview.sampleAnswer} />
              )}
            </Card>
          ) : (
            <p className="text-xs text-slate-500">Chưa có dữ liệu câu hỏi.</p>
          )}
        </div>
      )}

      {/* Tab 3: Action Plan / Recommendations */}
      {activeTab === 'action_plan' && (
        <Card variant="elevated" padding="lg" className="space-y-4">
          <h3 className="font-bold text-base text-slate-900">Kế hoạch hành động đề xuất (Action Plan)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kế hoạch hành động cụ thể được tổng hợp từ dữ liệu phân tích buổi phỏng vấn thực tế của bạn.
          </p>

          {report.actionPlan && report.actionPlan.length > 0 ? (
            <div className="space-y-2 py-2">
              {report.actionPlan.map((step: string, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-2">Chưa có kế hoạch hành động chi tiết trong báo cáo này.</p>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Tiếp tục rèn luyện kỹ năng phỏng vấn</span>
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
            >
              <span>Đến khu vực Luyện tập</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
