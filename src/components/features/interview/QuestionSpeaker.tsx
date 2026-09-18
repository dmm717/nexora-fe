'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { useAzureSpeechSynthesis } from '@/hooks/useAzureSpeechSynthesis';

export interface QuestionSpeakerProps {
  interviewId: string;
  questionId: string;
  text: string;
  className?: string;
  onSpeakingChange?: (speaking: boolean) => void;
  autoSpeak?: boolean;
  disabled?: boolean;
}

export interface QuestionSpeakerHandle {
  stop: () => Promise<void>;
}

const labelForState = (status: string) => {
  if (status === 'loading') return 'Đang chuẩn bị giọng AI...';
  if (status === 'speaking') return 'Dừng đọc';
  if (status === 'error') return 'Thử lại giọng AI';
  return 'Nghe lại câu hỏi';
};

export const QuestionSpeaker = forwardRef<
  QuestionSpeakerHandle,
  QuestionSpeakerProps
>(function QuestionSpeaker(
  {
    interviewId,
    questionId,
    text,
    className = '',
    onSpeakingChange,
    autoSpeak = false,
    disabled = false,
  },
  ref
) {
  const attemptedQuestionsRef = useRef(new Set<string>());
  const { status, error, speak, stop } = useAzureSpeechSynthesis(
    interviewId,
    onSpeakingChange
  );

  useImperativeHandle(ref, () => ({ stop }), [stop]);

  useEffect(() => {
    if (disabled) {
      void stop().catch(() => undefined);
      return;
    }
    if (
      !autoSpeak ||
      !questionId ||
      !text.trim() ||
      attemptedQuestionsRef.current.has(questionId)
    ) {
      return;
    }

    // Deferring the mark-and-speak to a microtask lets StrictMode's simulated
    // cleanup cancel the first setup, so development does not consume the one
    // allowed auto-attempt before the live effect runs.
    let effectIsCurrent = true;
    queueMicrotask(() => {
      if (!effectIsCurrent || attemptedQuestionsRef.current.has(questionId)) return;
      attemptedQuestionsRef.current.add(questionId);
      void speak(text);
    });

    return () => {
      effectIsCurrent = false;
      void stop().catch(() => undefined);
    };
  }, [autoSpeak, disabled, questionId, speak, stop, text]);

  const isActive = status === 'loading' || status === 'speaking';
  const label = labelForState(status);

  const handleToggleSpeak = () => {
    if (disabled || !text.trim()) return;
    if (isActive) {
      void stop().catch(() => undefined);
      return;
    }

    // A manual action wins if it races the initial auto-speak microtask.
    attemptedQuestionsRef.current.add(questionId);
    void speak(text);
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={disabled || !text.trim()}
        aria-label={label}
        aria-pressed={status === 'speaking'}
        aria-busy={status === 'loading'}
        onClick={handleToggleSpeak}
        title={label}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
          status === 'speaking'
            ? 'bg-primary text-white animate-pulse'
            : 'bg-surface-container-high hover:bg-surface-container text-primary'
        } ${className}`}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
          {status === 'speaking'
            ? 'volume_up'
            : status === 'loading'
            ? 'progress_activity'
            : 'volume_down'}
        </span>
        <span>{label}</span>
      </button>

      {status === 'error' && error && (
        <p className="max-w-xs text-xs text-muted-foreground" role="status">
          {error}
        </p>
      )}
    </div>
  );
});

QuestionSpeaker.displayName = 'QuestionSpeaker';

export default QuestionSpeaker;
