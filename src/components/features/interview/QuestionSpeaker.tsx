'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface QuestionSpeakerProps {
  text: string;
  className?: string;
  questionId?: string;
  onSpeakingChange?: (speaking: boolean) => void;
  autoSpeak?: boolean;
  disabled?: boolean;
}

export const QuestionSpeaker: React.FC<QuestionSpeakerProps> = ({
  text,
  questionId,
  className = '',
  onSpeakingChange,
  autoSpeak = false,
  disabled = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  });

  const callbackRef = useRef(onSpeakingChange);
  const attemptedRef = useRef(new Set<string>());
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    callbackRef.current = onSpeakingChange;
  }, [onSpeakingChange]);

  const reportSpeaking = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    callbackRef.current?.(speaking);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    reportSpeaking(false);
  }, [reportSpeaking]);

  const speak = useCallback(() => {
    if (disabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => {
      if (utteranceRef.current === utterance) {
        reportSpeaking(true);
      }
    };

    const finish = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        reportSpeaking(false);
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      finish();
    }
  }, [disabled, text, stop, reportSpeaking]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const available = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    const key = questionId || text;
    if (available && autoSpeak && !disabled && !attemptedRef.current.has(key)) {
      attemptedRef.current.add(key);
      speak();
    }

    if (disabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stop();
    }

    const pollInterval = window.setInterval(() => {
      if (
        utteranceRef.current &&
        !window.speechSynthesis.speaking &&
        !window.speechSynthesis.pending
      ) {
        utteranceRef.current = null;
        reportSpeaking(false);
      }
    }, 100);

    return () => {
      clearInterval(pollInterval);
      stop();
    };
  }, [autoSpeak, disabled, questionId, text, speak, stop, reportSpeaking]);

  const handleToggleSpeak = () => {
    if (!supported || disabled) return;
    if (isSpeaking) {
      stop();
    } else {
      speak();
    }
  };

  return (
    <button
      type="button"
      disabled={!supported || disabled}
      aria-label={isSpeaking ? 'Dừng đọc câu hỏi' : 'Nghe lại câu hỏi'}
      aria-pressed={isSpeaking}
      onClick={handleToggleSpeak}
      title={isSpeaking ? 'Dừng đọc câu hỏi' : 'Đọc to câu hỏi'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        isSpeaking
          ? 'bg-primary text-white animate-pulse'
          : 'bg-surface-container-high hover:bg-surface-container text-primary'
      } ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {isSpeaking ? 'volume_up' : 'volume_down'}
      </span>
      <span>
        {!supported
          ? 'Đọc câu hỏi trên màn hình'
          : isSpeaking
          ? 'Dừng đọc'
          : 'Nghe lại câu hỏi'}
      </span>
    </button>
  );
};

export default QuestionSpeaker;
