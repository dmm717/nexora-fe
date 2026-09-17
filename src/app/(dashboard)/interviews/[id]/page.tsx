'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import '@/styles/interview-stage.css';
import { interviewApi } from '@/services/interviewApi';
import {
  type InterviewView,
  getCurrentQuestion,
  getAnsweredQuestions,
  canFinishInterview,
  canSubmitInterviewAnswer,
  canUpgradeAndContinue,
  isUpgradeRequired,
  generateIdempotencyKey,
  getOrCreateAnswerIntent,
  applyAnswerResultToInterview,
  createCompleteIntentState,
  type AnswerIntent,
  type CompleteIntentState,
  shouldRunAnswerTimer,
  type AnswerEvaluation,
} from '@/services/interviewContract';
import { useInterview } from '@/hooks/queries/useInterviews';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { ProductFocusedSurface } from '@/components/ui/ProductFocusedSurface';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/services/apiClient';

// Feature components
import { AiInterviewerPresence, type InterviewPresenceState } from '@/components/features/interview/AiInterviewerPresence';
import { CurrentAnswerCaption } from '@/components/features/interview/CurrentAnswerCaption';
import { QuestionSpeaker } from '@/components/features/interview/QuestionSpeaker';
import { AudioSpeechDock, type AudioSpeechState } from '@/components/features/interview/AudioSpeechDock';
import { QuickCoachingDrawer } from '@/components/features/coaching/QuickCoachingDrawer';

export default function InterviewRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: careerProfile } = useCareerProfile();

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [continuing, setContinuing] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [candidateState, setCandidateState] = useState<AudioSpeechState>({
    listening: false,
    mode: 'voice',
    error: null,
    duration: 0,
  });

  // Coaching & Q3 boundary UI state
  const [showCoaching, setShowCoaching] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] = useState<AnswerEvaluation | null>(null);
  const [latestEvaluatedSeq, setLatestEvaluatedSeq] = useState<number>(1);
  const [showQ3BoundaryModal, setShowQ3BoundaryModal] = useState<boolean>(false);

  // Read text-only preference set at preflight
  const [forcedTextOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('nexora_text_only_mode') === '1';
    }
    return false;
  });

  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [currentDraftContent, setCurrentDraftContent] = useState<string>('');
  const [actionError, setActionError] = useState<{
    message: string;
    requestId?: string;
    code?: string;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stable idempotency intents
  const pendingAnswerIntentRef = useRef<AnswerIntent | null>(null);
  const continueKeyRef = useRef<string>(generateIdempotencyKey());
  const completeIntentRef = useRef<CompleteIntentState>(createCompleteIntentState());

  const { data: interview, isLoading: loading, error: queryError } = useInterview(id);

  // Derived interview domain properties
  const answeredPairs = useMemo(
    () => getAnsweredQuestions(interview?.questions, interview?.answers),
    [interview?.questions, interview?.answers]
  );
  const activeQuestion = useMemo(
    () => getCurrentQuestion(interview?.questions, interview?.answers),
    [interview?.questions, interview?.answers]
  );
  const continuation = interview?.continuation;
  const canFinish = canFinishInterview(continuation);
  const upgradeRequired = isUpgradeRequired(continuation);
  const canUpgrade = canUpgradeAndContinue(continuation);

  const canAnswer = canSubmitInterviewAnswer({
    status: interview?.status,
    hasQuestion: Boolean(activeQuestion),
    upgradeRequired,
  });
  const hasActiveQuestion = Boolean(activeQuestion);
  const activeQuestionId = activeQuestion?.id;

  // Handle automatic continuation when returning from billing with sessionContinuation=true
  useEffect(() => {
    const isContinuationReturn = searchParams.get('sessionContinuation') === 'true';
    if (isContinuationReturn && interview && interview.status === 'active' && !continuing) {
      const runContinuation = async () => {
        try {
          setContinuing(true);
          const updated = await interviewApi.continue(id, continueKeyRef.current);
          queryClient.setQueryData(['interview', id], updated);
          continueKeyRef.current = generateIdempotencyKey();
        } catch {
          // Non-blocking if already unlocked or pending
        } finally {
          setContinuing(false);
        }
      };
      runContinuation();
    }
  }, [searchParams, interview, id, continuing, queryClient]);

  // Answer timer effect
  useEffect(() => {
    if (
      shouldRunAnswerTimer({
        status: interview?.status,
        hasQuestion: hasActiveQuestion,
        canSubmitAnswer: canAnswer,
        submitting: submitting || isEvaluating,
      })
    ) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    if (interview?.status === 'completed') {
      router.push(`/interviews/${id}/report`);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interview?.status, hasActiveQuestion, canAnswer, submitting, isEvaluating, id, router]);

  // Reset timer on question change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsElapsed(0);
    setCurrentDraftContent('');
  }, [activeQuestionId]);

  // Presence State derivation
  const presenceState: InterviewPresenceState = useMemo(() => {
    if (isEvaluating || submitting) return 'thinking';
    if (candidateState.listening) return 'listening';
    if (isAiSpeaking) return 'speaking';
    return 'idle';
  }, [isEvaluating, submitting, candidateState.listening, isAiSpeaking]);

  // Initials for avatar
  const candidateName = careerProfile?.profile?.displayName || 'Bạn';
  const initials = useMemo(() => {
    return candidateName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((p: string) => p[0])
      .join('')
      .toUpperCase();
  }, [candidateName]);

  // Question sequence & header text
  const currentSequence = activeQuestion?.sequence ?? (answeredPairs.length + 1);
  const isPaidPhase = answeredPairs.length >= 3;
  const headerQuestionLabel = isPaidPhase
    ? `Câu hỏi ${currentSequence}`
    : `Câu hỏi ${currentSequence}/3`;

  // Submit Answer handler
  const handleSubmitAnswer = async (content: string, durationSec: number) => {
    if (!canAnswer || !activeQuestion || submitting || isEvaluating) return;

    setSubmitting(true);
    setIsEvaluating(true);
    setActionError(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const intent = getOrCreateAnswerIntent(pendingAnswerIntentRef.current, {
      questionId: activeQuestion.id,
      content,
      durationSeconds: durationSec || secondsElapsed,
    });
    pendingAnswerIntentRef.current = intent;

    try {
      const result = await interviewApi.submitAnswer(id, intent.payload, intent.key);

      // Reconcile into React Query cache immediately
      queryClient.setQueryData(['interview', id], (oldData: InterviewView | undefined) =>
        oldData ? applyAnswerResultToInterview(oldData, result) : oldData
      );

      pendingAnswerIntentRef.current = null;
      setCurrentDraftContent('');
      setSecondsElapsed(0);

      // Extract evaluation
      const evalData = (result.answer.evaluation as AnswerEvaluation) || null;
      setLatestEvaluation(evalData);
      setLatestEvaluatedSeq(currentSequence);
      setShowCoaching(true);
    } catch (err: unknown) {
      setActionError({
        message: err instanceof ApiError ? err.message : 'Lỗi khi gửi câu trả lời. Bạn có thể thử lại.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
    } finally {
      setSubmitting(false);
      setIsEvaluating(false);
    }
  };

  // Continue action after reviewing coaching drawer
  const handleContinueAfterCoaching = async () => {
    setShowCoaching(false);

    if (latestEvaluatedSeq === 1) {
      return;
    }

    if (latestEvaluatedSeq === 2) {
      return;
    }

    if (latestEvaluatedSeq === 3) {
      setShowQ3BoundaryModal(true);
      return;
    }

    if (activeQuestion) {
      return;
    }

    try {
      setContinuing(true);
      const updated = await interviewApi.continue(id, continueKeyRef.current);
      queryClient.setQueryData(['interview', id], updated);
      continueKeyRef.current = generateIdempotencyKey();
    } catch (err: unknown) {
      setActionError({
        message:
          err instanceof ApiError
            ? err.message
            : 'Đã hoàn thành phân bổ câu hỏi. Bạn có thể xuất báo cáo.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
    } finally {
      setContinuing(false);
    }
  };

  // Early finish handler
  const handleFinishEarly = async () => {
    if (!canFinish || completing || submitting) return;
    if (
      answeredPairs.length > 0 &&
      !window.confirm('Bạn có chắc chắn muốn kết thúc buổi phỏng vấn và xuất báo cáo đánh giá?')
    ) {
      return;
    }

    setShowCoaching(false);
    setShowQ3BoundaryModal(false);
    setCompleting(true);
    setActionError(null);

    try {
      await interviewApi.complete(id, completeIntentRef.current.getKey());
      completeIntentRef.current.confirmComplete();
      router.push(`/interviews/${id}/report`);
    } catch (err: unknown) {
      setActionError({
        message: err instanceof ApiError ? err.message : 'Lỗi khi kết thúc bài thi. Vui lòng thử lại.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
      setCompleting(false);
    }
  };

  // Upgrade & Continue into Q4+ in the SAME session
  const handleUpgradeAndContinue = async () => {
    if (canUpgrade) {
      setShowQ3BoundaryModal(false);
      try {
        setContinuing(true);
        const updated = await interviewApi.continue(id, continueKeyRef.current);
        queryClient.setQueryData(['interview', id], updated);
        continueKeyRef.current = generateIdempotencyKey();
      } catch (err: unknown) {
        setActionError({
          message: err instanceof ApiError ? err.message : 'Chưa thể mở rộng phiên phỏng vấn.',
          requestId: err instanceof ApiError ? err.requestId : undefined,
        });
      } finally {
        setContinuing(false);
      }
    } else {
      router.push(`/pricing?returnTo=${encodeURIComponent(`/interviews/${id}?sessionContinuation=true`)}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải dữ liệu buổi phỏng vấn...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (queryError && !interview) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-xl text-red-900">
        <h2 className="font-bold text-lg mb-2">Không thể tải buổi phỏng vấn</h2>
        <p className="text-sm mb-4">{queryError.message || 'Đã có lỗi xảy ra.'}</p>
        <Link href="/interviews" className="text-indigo-600 font-semibold underline">
          Quay lại danh sách phỏng vấn
        </Link>
      </div>
    );
  }

  if (!interview) return null;

  // Status transitions
  if (interview.status === 'starting') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Đang chuẩn bị câu hỏi phỏng vấn...</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Nexora AI đang tổng hợp các tình huống phù hợp nhất với vị trí {interview.role}. Vui lòng chờ trong giây lát.
        </p>
      </div>
    );
  }

  if (interview.status === 'completing') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Đang chấm điểm &amp; Tổng hợp báo cáo...</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          AI đang hoàn tất đánh giá 4 trục Rubric và mô hình STAR cho buổi phỏng vấn.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push(`/interviews/${id}/report`)}
          className="mt-4"
        >
          Xem tiến độ báo cáo &rarr;
        </Button>
      </div>
    );
  }

  if (interview.status === 'failed' || interview.status === 'abandoned') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">
          Buổi phỏng vấn đã kết thúc ({interview.status === 'failed' ? 'Thất bại' : 'Đã hủy'})
        </h2>
        <p className="text-xs text-slate-500">Phiên phỏng vấn này không còn hoạt động.</p>
        <Link href="/interviews" className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm">
          Trở về Danh sách phỏng vấn
        </Link>
      </div>
    );
  }

  const topicLabel = activeQuestion?.topic
    ? activeQuestion.topic.replace(/_/g, ' ').toUpperCase()
    : interview.interviewType.toUpperCase();

  return (
    <ProductFocusedSurface theme="interview" className="min-h-screen py-4 px-2 sm:px-4">
      <div className="interview-call-room mx-auto space-y-4">
        {/* Action Error alert */}
        {actionError && (
          <div className="p-3.5 bg-red-900/40 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
            <span className="material-symbols-outlined text-red-400 text-[18px] flex-shrink-0 mt-0.5">
              error
            </span>
            <div>
              <span className="font-semibold">{actionError.message}</span>
              {actionError.requestId && (
                <div className="text-[10px] text-red-300 mt-0.5">
                  Request ID: {actionError.requestId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meet-style Stage */}
        <section className="interview-call-stage" aria-label="Phòng phỏng vấn cùng Nexora AI">
          <div className="interview-stage-meta">
            <span className="interview-live">
              <i aria-hidden="true" /> Đang trong phiên
            </span>
            <span>{topicLabel}</span>
            <span>{interview.role} ({interview.seniority})</span>
            <span>{headerQuestionLabel}</span>
          </div>

          <div className="interview-stage-center">
            <AiInterviewerPresence state={presenceState} />

            {activeQuestion ? (
              <div className="interview-live-caption" aria-label="Phụ đề câu hỏi">
                <p>&ldquo;{activeQuestion.content}&rdquo;</p>
              </div>
            ) : (
              <div className="interview-live-caption">
                <p>Bạn đã hoàn thành các câu hỏi được phân bổ.</p>
              </div>
            )}

            <details className="interview-coach-tip">
              <summary>
                <span aria-hidden="true" className="material-symbols-outlined">
                  tips_and_updates
                </span>{' '}
                Gợi ý từ Coach
              </summary>
              <p>
                {currentSequence === 1 &&
                  'Nêu bật kinh nghiệm thực chiến gần nhất, nhấn mạnh công nghệ chủ đạo và đóng góp cá nhân nổi bật.'}
                {currentSequence === 2 &&
                  'Trình bày có cấu trúc: 1) Cô lập và chẩn đoán sự cố; 2) Giải pháp ứng phó; 3) Thiết kế phòng ngừa lâu dài.'}
                {currentSequence >= 3 &&
                  'Áp dụng cấu trúc STAR: Nêu rõ Bối cảnh (S), Mục tiêu (T), Hành động cụ thể (A), và Kết quả định lượng (R).'}
              </p>
            </details>
          </div>

          {/* Candidate Self Tile (Initials avatar, timer, status) - No camera */}
          <aside
            className="interview-self-tile"
            data-listening={candidateState.listening}
            aria-label="Trạng thái của bạn"
          >
            <div className="interview-self-avatar" aria-hidden="true">
              {initials}
            </div>
            <strong>{candidateName}</strong>
            <p>
              <span aria-hidden="true" className="material-symbols-outlined">
                {candidateState.error
                  ? 'mic_off'
                  : candidateState.mode === 'chatbox'
                  ? 'keyboard'
                  : 'mic'}
              </span>
              {candidateState.error
                ? 'Mic chưa khả dụng'
                : candidateState.listening
                ? 'Bạn đang trả lời'
                : candidateState.mode === 'chatbox' || forcedTextOnly
                ? 'Đang gõ văn bản'
                : 'Sẵn sàng nói'}
            </p>
            <span className="interview-answer-duration">
              {Math.floor(candidateState.duration / 60)
                .toString()
                .padStart(2, '0')}
              :{(candidateState.duration % 60).toString().padStart(2, '0')}
            </span>
          </aside>

          {/* Live unsubmitted draft preview */}
          {activeQuestion && (
            <CurrentAnswerCaption
              content={currentDraftContent}
              listening={candidateState.listening}
              disabled={isEvaluating || submitting || showCoaching}
              onEdit={() => setEditorOpen(true)}
            />
          )}
        </section>

        {/* Answer Controls Dock */}
        {activeQuestion && (
          <div className="interview-controls">
            <AudioSpeechDock
              key={activeQuestion.id}
              initialContent=""
              onSubmit={(content, duration) => handleSubmitAnswer(content, duration)}
              isSubmitting={submitting || isEvaluating || showCoaching}
              forcedTextOnly={forcedTextOnly}
              variant="call"
              editorOpen={editorOpen}
              onEditorOpenChange={(open) => setEditorOpen(open)}
              onTranscriptChange={(content) => setCurrentDraftContent(content)}
              onStateChange={(state) => {
                setCandidateState(state);
                if (state.listening) setIsAiSpeaking(false);
              }}
              onBeforeListening={() => setIsAiSpeaking(false)}
              controls={
                <>
                  <QuestionSpeaker
                    text={activeQuestion.content}
                    questionId={activeQuestion.id}
                    autoSpeak
                    disabled={candidateState.listening || submitting || isEvaluating || showCoaching}
                    onSpeakingChange={setIsAiSpeaking}
                    className="interview-call-button"
                  />

                  <button
                    type="button"
                    className="interview-call-button interview-end-button"
                    aria-label="Kết thúc phiên phỏng vấn"
                    disabled={submitting || isEvaluating || !canFinish}
                    onClick={handleFinishEarly}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      call_end
                    </span>
                    <span>{completing ? 'Đang nộp...' : 'Nộp bài sớm'}</span>
                  </button>
                </>
              }
            />
          </div>
        )}

        {/* Session Transcript Accordion (Only submitted answers) */}
        <details className="interview-session-transcript">
          <summary>
            Xem transcript buổi phỏng vấn · {answeredPairs.length} câu đã trả lời
          </summary>
          {answeredPairs.length === 0 ? (
            <p className="py-3 text-slate-400">Chưa có câu trả lời nào được nộp.</p>
          ) : (
            answeredPairs.map((pair) => (
              <article key={pair.question.id}>
                <h2>
                  Nexora AI · Câu {pair.question.sequence}
                </h2>
                <p>{pair.question.content}</p>
                <h3>Câu trả lời của bạn</h3>
                <p>{pair.answer.content}</p>
              </article>
            ))
          )}
        </details>

        {/* Quick Coaching Drawer */}
        {latestEvaluation && (
          <QuickCoachingDrawer
            isOpen={showCoaching}
            coaching={latestEvaluation}
            questionSequence={latestEvaluatedSeq}
            totalQuestions={isPaidPhase ? null : 3}
            canContinueQuestion={Boolean(activeQuestion) || latestEvaluatedSeq < 3 || canUpgrade}
            onContinue={handleContinueAfterCoaching}
            onFinishEarly={latestEvaluatedSeq >= 2 ? handleFinishEarly : undefined}
            finishEarlyLabel={latestEvaluatedSeq === 2 ? 'Kết thúc sớm & nhận báo cáo 2 câu' : undefined}
            onClose={() => setShowCoaching(false)}
          />
        )}

        {/* Q3 Free Boundary Modal */}
        <Modal
          isOpen={showQ3BoundaryModal}
          onClose={() => setShowQ3BoundaryModal(false)}
          maxWidth="lg"
        >
          <div className="text-center space-y-6 py-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[32px]">emoji_events</span>
            </div>

            <div className="space-y-2">
              <Badge variant="secondary" size="md">
                Hoàn thành trọn vẹn 3 câu miễn phí
              </Badge>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tuyệt vời! Bạn đã hoàn thành phiên phỏng vấn thử
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Báo cáo đánh giá toàn diện 3 câu của bạn <strong>hoàn toàn miễn phí</strong> và sẵn sàng được tổng hợp ngay bây giờ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
              {/* Choice A: Receive Free Report (100% Free) */}
              <Card
                variant="elevated"
                padding="md"
                className="border-indigo-300 hover:border-indigo-600 cursor-pointer transition-all flex flex-col justify-between"
                onClick={handleFinishEarly}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">Nhận báo cáo miễn phí</span>
                    <Badge variant="secondary" size="sm">Miễn phí 100%</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tổng hợp điểm số 4 tiêu chuẩn Rubric, đánh giá STAR, phân tích điểm sáng và hướng dẫn cải thiện chi tiết.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="mt-5 w-full shadow-sm font-semibold"
                  onClick={handleFinishEarly}
                  disabled={completing}
                >
                  {completing ? 'Đang tổng hợp...' : 'Xem báo cáo ngay'}
                </Button>
              </Card>

              {/* Choice B: Paid Continuation in SAME session */}
              <Card
                variant="elevated"
                padding="md"
                className="border-slate-200 hover:border-slate-400 cursor-pointer transition-all flex flex-col justify-between"
                onClick={handleUpgradeAndContinue}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">
                      Tiếp tục phỏng vấn chuyên sâu
                    </span>
                    <Badge variant="neutral" size="sm">
                      {canUpgrade ? 'Đã kích hoạt' : 'Nâng cấp gói'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mở khóa các câu hỏi tình huống thực tế chuyên sâu (Q4, Q5...) và tiếp tục phỏng vấn ngay trong cùng phiên này.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="md"
                  className="mt-5 w-full font-semibold"
                  onClick={handleUpgradeAndContinue}
                  disabled={continuing}
                >
                  {continuing
                    ? 'Đang kết nối...'
                    : canUpgrade
                    ? 'Tiếp tục Câu 4+ ngay'
                    : 'Nâng cấp & Tiếp tục phiên'}
                </Button>
              </Card>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 max-w-md mx-auto">
              🛡️ <strong>Cam kết minh bạch:</strong> Không làm mờ hay khóa kết quả miễn phí.
            </div>
          </div>
        </Modal>
      </div>
    </ProductFocusedSurface>
  );
}
