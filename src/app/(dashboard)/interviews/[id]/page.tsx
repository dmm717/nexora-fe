'use client';

import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
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
  isUpgradeRequired,
  getInterviewContinuationAction,
  getInterviewRouteState,
  generateIdempotencyKey,
  getOrCreateAnswerIntent,
  getAnswerEvaluationErrorMessage,
  applyAnswerResultToInterview,
  createCompleteIntentState,
  type AnswerIntent,
  type CompleteIntentState,
  type AnswerEvaluation,
  safeAnswerEvaluation,
} from '@/services/interviewContract';
import { useInterview } from '@/hooks/queries/useInterviews';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { ProductFocusedSurface } from '@/components/ui/ProductFocusedSurface';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/services/apiClient';
import { useFocusedPracticeShell } from '@/components/layouts/FocusedPracticeShellContext';

// Feature components
import { AiInterviewerPresence, type InterviewPresenceState } from '@/components/features/interview/AiInterviewerPresence';
import { CurrentAnswerCaption } from '@/components/features/interview/CurrentAnswerCaption';
import {
  QuestionSpeaker,
  type QuestionSpeakerHandle,
} from '@/components/features/interview/QuestionSpeaker';
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
  const [pendingEntitlementRecheck, setPendingEntitlementRecheck] = useState<boolean>(false);

  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isPreparingCandidateInput, setIsPreparingCandidateInput] =
    useState<boolean>(false);
  const questionSpeakerRef = useRef<QuestionSpeakerHandle>(null);
  const [candidateState, setCandidateState] = useState<AudioSpeechState>({
    listening: false,
    mode: 'voice',
    error: null,
    duration: 0,
  });

  // Coaching & Q3 boundary UI state
  const [showCoaching, setShowCoaching] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] = useState<AnswerEvaluation | null>(null);
  const [latestCandidateAnswer, setLatestCandidateAnswer] = useState<string | null>(null);
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
  const [answerSubmitState, setAnswerSubmitState] = useState<
    'draft' | 'submitting' | 'recoverable_error'
  >('draft');

  // Stable idempotency intents
  const pendingAnswerIntentRef = useRef<AnswerIntent | null>(null);
  const continueKeyRef = useRef<string>(generateIdempotencyKey());
  const completeIntentRef = useRef<CompleteIntentState>(createCompleteIntentState());
  const continuationReturnHandledRef = useRef<boolean>(false);
  const continueInFlightRef = useRef<boolean>(false);

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
  const continuationAction = getInterviewContinuationAction({
    continuation,
    answeredQuestionCount: answeredPairs.length,
    hasActiveQuestion: Boolean(activeQuestion),
  });

  const canAnswer = canSubmitInterviewAnswer({
    status: interview?.status,
    hasQuestion: Boolean(activeQuestion),
    upgradeRequired,
  });
  const activeQuestionId = activeQuestion?.id;

  // Consume the billing return marker once, then re-check canonical server entitlement.
  useEffect(() => {
    const isContinuationReturn = searchParams.get('sessionContinuation') === 'true';
    if (isContinuationReturn && !continuationReturnHandledRef.current) {
      continuationReturnHandledRef.current = true;
      router.replace(`/interviews/${id}`, { scroll: false });

      const runContinuation = async () => {
        try {
          if (continueInFlightRef.current) return;
          continueInFlightRef.current = true;
          setContinuing(true);
          setActionError(null);
          await queryClient.invalidateQueries({ queryKey: ['interview', id] });
          const freshInterview = await interviewApi.getById(id);
          queryClient.setQueryData(['interview', id], freshInterview);

          const freshAction = getInterviewContinuationAction({
            continuation: freshInterview.continuation,
            answeredQuestionCount: getAnsweredQuestions(
              freshInterview.questions,
              freshInterview.answers
            ).length,
            hasActiveQuestion: Boolean(
              getCurrentQuestion(freshInterview.questions, freshInterview.answers)
            ),
          });

          if (freshInterview.status !== 'active' || freshAction !== 'continue_same_session') {
            if (freshAction === 'upgrade') {
              setPendingEntitlementRecheck(true);
              setActionError({
                message:
                  'Quyền tiếp tục chưa được xác nhận cho phiên này. Hãy kiểm tra lại trạng thái sau khi thanh toán hoàn tất.',
              });
            }
            return;
          }

          const updated = await interviewApi.continue(id, continueKeyRef.current);
          queryClient.setQueryData(['interview', id], updated);
          continueKeyRef.current = generateIdempotencyKey();
        } catch (err: unknown) {
          setActionError({
            message:
              err instanceof ApiError
                ? err.message
                : 'Không thể kiểm tra trạng thái nâng cấp. Vui lòng thử lại.',
            requestId: err instanceof ApiError ? err.requestId : undefined,
            code: err instanceof ApiError ? err.code : undefined,
          });
        } finally {
          continueInFlightRef.current = false;
          setContinuing(false);
        }
      };
      runContinuation();
    }
  }, [searchParams, id, queryClient, router]);

  // Reset timer on question change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDraftContent('');
    pendingAnswerIntentRef.current = null;
    setAnswerSubmitState('draft');
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
  const isBeyondFreeBoundary = currentSequence > 3 || answeredPairs.length >= 3;
  const headerQuestionLabel = `Câu ${currentSequence}`;

  useFocusedPracticeShell({
    title: interview?.role ? `Phỏng vấn ${interview.role}` : 'Phỏng vấn AI',
    subtitle: interview?.seniority
      ? `${interview.seniority} · ${interview.interviewType}`
      : undefined,
    stepInfo: activeQuestion ? headerQuestionLabel : undefined,
    statusLabel:
      isEvaluating || submitting
        ? 'AI đang đánh giá câu trả lời'
        : candidateState.listening
          ? 'Đang lắng nghe câu trả lời'
          : isAiSpeaking
            ? 'AI đang đọc câu hỏi'
            : interview?.status === 'active'
              ? 'Phiên phỏng vấn đang hoạt động'
              : undefined,
    exitTo: '/interviews',
  });

  const handleCandidateStateChange = useCallback((state: AudioSpeechState) => {
    setCandidateState(state);
    if (state.listening) setIsAiSpeaking(false);
  }, []);

  // Submit Answer handler
  const handleSubmitAnswer = async (content: string, durationSec?: number) => {
    if (!canAnswer || !activeQuestion || submitting || isEvaluating) return;

    setSubmitting(true);
    setIsEvaluating(true);
    setAnswerSubmitState('submitting');
    setActionError(null);

    const intent = getOrCreateAnswerIntent(pendingAnswerIntentRef.current, {
      questionId: activeQuestion.id,
      content,
      ...(durationSec !== undefined ? { durationSeconds: durationSec } : {}),
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
      setAnswerSubmitState('draft');

      // Extract evaluation
      const evalData = result.answer.evaluation
        ? safeAnswerEvaluation(result.answer.evaluation)
        : null;
      setLatestCandidateAnswer(
        typeof result.answer.content === 'string' ? result.answer.content : null
      );
      setLatestEvaluation(evalData);
      setLatestEvaluatedSeq(currentSequence);
      setShowCoaching(true);
    } catch (err: unknown) {
      setAnswerSubmitState('recoverable_error');
      setActionError({
        message: getAnswerEvaluationErrorMessage(err),
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
    } finally {
      setSubmitting(false);
      setIsEvaluating(false);
    }
  };

  const handleEntitlementRecheck = async () => {
    if (continuing) return;
    setContinuing(true);
    setActionError(null);

    try {
      await queryClient.invalidateQueries({ queryKey: ['interview', id] });
      const freshInterview = await interviewApi.getById(id);
      queryClient.setQueryData(['interview', id], freshInterview);
      setPendingEntitlementRecheck(
        freshInterview.continuation?.state === 'upgrade_required'
      );
    } catch (err: unknown) {
      setActionError({
        message:
          err instanceof ApiError
            ? err.message
            : 'Không thể kiểm tra quyền tiếp tục. Vui lòng thử lại.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
        code: err instanceof ApiError ? err.code : undefined,
      });
    } finally {
      setContinuing(false);
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

    if (continuationAction === 'complete') {
      await handleFinishEarly();
      return;
    }

    if (continuationAction !== 'continue_same_session') return;

    try {
      if (continueInFlightRef.current) return;
      continueInFlightRef.current = true;
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
      continueInFlightRef.current = false;
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
    if (activeQuestion) {
      setShowQ3BoundaryModal(false);
      return;
    }

    if (continuationAction === 'continue_same_session') {
      setShowQ3BoundaryModal(false);
      try {
        if (continueInFlightRef.current) return;
        continueInFlightRef.current = true;
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
        continueInFlightRef.current = false;
        setContinuing(false);
      }
    } else if (continuationAction === 'upgrade') {
      router.push(`/pricing?returnTo=${encodeURIComponent(`/interviews/${id}?sessionContinuation=true`)}`);
    } else if (continuationAction === 'complete') {
      await handleFinishEarly();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="functional-spinner w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
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

  const routeState = getInterviewRouteState(interview.status);

  // Status transitions
  if (routeState === 'preparing') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="functional-spinner w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Đang chuẩn bị câu hỏi phỏng vấn...</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Nexora AI đang tổng hợp các tình huống phù hợp nhất với vị trí {interview.role}. Vui lòng chờ trong giây lát.
        </p>
      </div>
    );
  }

  if (routeState === 'processing' || routeState === 'completed') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="functional-spinner w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          {routeState === 'completed' ? 'Báo cáo phỏng vấn đã sẵn sàng' : 'Đang chấm điểm & Tổng hợp báo cáo...'}
        </h2>
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

  if (routeState === 'terminal') {
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

  if (routeState !== 'active') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Phiên phỏng vấn chưa khả dụng</h2>
        <p className="text-xs text-slate-500">
          Trạng thái hiện tại chưa được hỗ trợ. Phòng phỏng vấn sẽ không mở cho đến khi máy chủ xác nhận phiên đang hoạt động.
        </p>
        <Link href="/interviews" className="inline-block text-indigo-600 font-semibold underline">
          Quay lại danh sách phỏng vấn
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
              {answerSubmitState === 'recoverable_error' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={submitting || isEvaluating}
                    onClick={() => {
                      const intent = pendingAnswerIntentRef.current;
                      if (intent) {
                        void handleSubmitAnswer(
                          intent.payload.content,
                          intent.payload.durationSeconds
                        );
                      }
                    }}
                  >
                    Thử lại đánh giá
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || isEvaluating}
                    onClick={() => setEditorOpen(true)}
                  >
                    Chỉnh sửa câu trả lời
                  </Button>
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
                Mẹo trả lời chung
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
              submitDisabled={!canAnswer || isEvaluating || submitting || showCoaching}
              onEdit={() => setEditorOpen(true)}
              onSubmit={() => {
                const trimmed = currentDraftContent.trim();
                if (trimmed) {
                  handleSubmitAnswer(
                    trimmed,
                    candidateState.duration > 0 ? candidateState.duration : undefined
                  );
                }
              }}
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
              isLocked={submitting || isEvaluating || showCoaching}
              submissionPhase={
                submitting || isEvaluating
                  ? 'evaluating'
                  : showCoaching
                    ? 'accepted'
                    : 'idle'
              }
              forcedTextOnly={forcedTextOnly}
              variant="call"
              editorOpen={editorOpen}
              onEditorOpenChange={(open) => setEditorOpen(open)}
              onTranscriptChange={(content) => setCurrentDraftContent(content)}
              onStateChange={handleCandidateStateChange}
              onListeningPreparationChange={setIsPreparingCandidateInput}
              onBeforeListening={async () => {
                await questionSpeakerRef.current?.stop();
              }}
              onBeforeSubmit={async () => {
                await questionSpeakerRef.current?.stop();
              }}
              controls={
                <>
                  <QuestionSpeaker
                    ref={questionSpeakerRef}
                    interviewId={id}
                    text={activeQuestion.content}
                    questionId={activeQuestion.id}
                    autoSpeak
                    disabled={
                      candidateState.listening ||
                      isPreparingCandidateInput ||
                      submitting ||
                      isEvaluating ||
                      showCoaching
                    }
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

        {!activeQuestion && answeredPairs.length >= 3 && (
          <Card variant="elevated" padding="md" className="space-y-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                {continuationAction === 'complete'
                  ? 'Bạn đã hoàn thành số câu hỏi của phiên này'
                  : continuationAction === 'upgrade'
                  ? 'Bạn đã hoàn thành 3 câu hỏi miễn phí'
                  : 'Sẵn sàng cho câu hỏi tiếp theo'}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Bạn luôn có thể kết thúc phiên và nhận báo cáo từ các câu trả lời đã hoàn thành.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {canFinish && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleFinishEarly}
                  disabled={completing}
                >
                  {completing ? 'Đang tổng hợp...' : 'Hoàn thành & Xem báo cáo'}
                </Button>
              )}
              {(continuationAction === 'upgrade' ||
                continuationAction === 'continue_same_session') && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={
                    pendingEntitlementRecheck && continuationAction === 'upgrade'
                      ? handleEntitlementRecheck
                      : handleUpgradeAndContinue
                  }
                  disabled={continuing}
                >
                  {continuing
                    ? 'Đang kiểm tra...'
                    : pendingEntitlementRecheck && continuationAction === 'upgrade'
                    ? 'Kiểm tra lại quyền tiếp tục'
                    : continuationAction === 'upgrade'
                    ? 'Nâng cấp để tiếp tục'
                    : 'Tiếp tục cùng phiên'}
                </Button>
              )}
            </div>
          </Card>
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
            candidateAnswer={latestCandidateAnswer}
            questionSequence={latestEvaluatedSeq}
            totalQuestions={isBeyondFreeBoundary ? null : 3}
            canContinueQuestion={
              Boolean(activeQuestion) ||
              latestEvaluatedSeq < 3 ||
              continuationAction === 'continue_same_session'
            }
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
                className="border-indigo-300 hover:border-indigo-600 transition-all flex flex-col justify-between"
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
                className="border-slate-200 hover:border-slate-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">
                      Tiếp tục phỏng vấn chuyên sâu
                    </span>
                    <Badge variant="neutral" size="sm">
                      {activeQuestion || continuationAction === 'continue_same_session'
                        ? 'Đã kích hoạt'
                        : continuationAction === 'complete'
                        ? 'Đã đạt giới hạn'
                        : 'Nâng cấp gói'}
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
                    : activeQuestion || continuationAction === 'continue_same_session'
                    ? 'Tiếp tục Câu 4+ ngay'
                    : continuationAction === 'complete'
                    ? 'Hoàn thành & Xem báo cáo'
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
