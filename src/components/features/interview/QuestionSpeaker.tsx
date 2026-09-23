'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { useAzureSpeechSynthesis } from '@/hooks/useAzureSpeechSynthesis';
import { MorphIcon } from 'morphicons/react';
import { Volume2, VolumeX } from 'lucide';

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
  if (status === 'speaking') return 'Dừng đọc câu hỏi';
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
    <>
      <button
        type="button"
        disabled={disabled || !text.trim()}
        aria-label={label}
        aria-pressed={status === 'speaking'}
        aria-busy={status === 'loading'}
        onClick={handleToggleSpeak}
        title={status === 'error' && error ? `${label}: ${error}` : label}
        className={`interview-call-button interview-speaker-button ${
          status === 'speaking' ? 'is-speaking' : ''
        } ${className}`}
      >
        {status === 'loading' ? (
          <span
            className="functional-spinner inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            aria-hidden="true"
          />
        ) : (
          <MorphIcon
            icon={status === 'speaking' ? VolumeX : Volume2}
            spring="snappy"
            reducedMotion="user"
            size={20}
            aria-hidden="true"
          />
        )}
      </button>

      {status === 'error' && error && (
        <span className="sr-only" role="status">
          {error}
        </span>
      )}
    </>
  );
});

QuestionSpeaker.displayName = 'QuestionSpeaker';

export default QuestionSpeaker;
