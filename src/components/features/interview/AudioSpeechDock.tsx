'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnswerEditor } from './AnswerEditor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { mergeFinalTranscript } from '@/hooks/speechRecognitionContract';

export interface AudioSpeechState {
  listening: boolean;
  mode: 'voice' | 'chatbox';
  error: string | null;
  duration: number;
}

export interface AudioSpeechDockProps {
  initialContent?: string;
  onSubmit?: (content: string, durationSeconds?: number) => void;
  isSubmitting?: boolean;
  onTranscriptChange?: (transcript: string) => void;
  onDurationUpdate?: (seconds: number) => void;
  forcedTextOnly?: boolean;
  variant?: 'default' | 'call';
  controls?: React.ReactNode;
  onStateChange?: (state: AudioSpeechState) => void;
  onListeningPreparationChange?: (preparing: boolean) => void;
  onBeforeListening?: () => void | Promise<void>;
  onBeforeSubmit?: () => void | Promise<void>;
  editorOpen?: boolean;
  onEditorOpenChange?: (open: boolean) => void;
}

export const AudioSpeechDock: React.FC<AudioSpeechDockProps> = ({
  initialContent = '',
  onSubmit,
  isSubmitting = false,
  onTranscriptChange,
  onDurationUpdate,
  forcedTextOnly = false,
  variant = 'call',
  controls,
  onStateChange,
  onListeningPreparationChange,
  onBeforeListening,
  onBeforeSubmit,
  editorOpen,
  onEditorOpenChange,
}) => {
  const [deviceMode, setDeviceMode] = useState<'voice' | 'chatbox'>(() => {
    if (forcedTextOnly) return 'chatbox';
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('nexora_text_only_mode');
      if (stored === '1') return 'chatbox';
    }
    return 'voice';
  });

  const effectiveMode = forcedTextOnly ? 'chatbox' : deviceMode;

  const [content, setContent] = useState<string>(initialContent);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isStartingListening, setIsStartingListening] = useState(false);
  const [preparationError, setPreparationError] = useState<string | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<string>(content);
  const mountedRef = useRef(true);
  const onListeningPreparationChangeRef = useRef(onListeningPreparationChange);
  const listeningAttemptRef = useRef(0);
  const listeningStartInFlightRef = useRef(false);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => {
    onListeningPreparationChangeRef.current = onListeningPreparationChange;
  }, [onListeningPreparationChange]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Speech Recognition hook
  const handleFinalSegment = useCallback((segment: string) => {
    setContent((prev) => {
      const next = mergeFinalTranscript(prev, segment);
      contentRef.current = next;
      onTranscriptChange?.(next);
      return next;
    });
  }, [onTranscriptChange]);

  const speech = useSpeechRecognition({ onFinalSegment: handleFinalSegment });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      listeningAttemptRef.current += 1;
      listeningStartInFlightRef.current = false;
      onListeningPreparationChangeRef.current?.(false);
    };
  }, []);

  // Notify parent of state change
  useEffect(() => {
    onStateChange?.({
      listening: speech.listening,
      mode: effectiveMode,
      error: speech.error ? speech.error.message : null,
      duration: durationSeconds,
    });
  }, [speech.listening, effectiveMode, speech.error, durationSeconds, onStateChange]);

  // Timer counter
  useEffect(() => {
    if (speech.listening) {
      durationTimerRef.current = setInterval(() => {
        setDurationSeconds((d) => d + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [speech.listening]);

  useEffect(() => {
    onDurationUpdate?.(durationSeconds);
  }, [durationSeconds, onDurationUpdate]);

  useEffect(() => {
    if (!isStartingListening || (!speech.listening && !speech.error)) return;
    listeningStartInFlightRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStartingListening(false);
    onListeningPreparationChangeRef.current?.(false);
  }, [isStartingListening, speech.error, speech.listening]);

  const cancelPendingListeningStart = () => {
    listeningAttemptRef.current += 1;
    listeningStartInFlightRef.current = false;
    setIsStartingListening(false);
    onListeningPreparationChangeRef.current?.(false);
  };

  const handleStartListening = async () => {
    if (
      listeningStartInFlightRef.current ||
      speech.listening ||
      isSubmittingRef.current
    ) {
      return;
    }

    listeningStartInFlightRef.current = true;
    const attempt = ++listeningAttemptRef.current;
    setIsStartingListening(true);
    onListeningPreparationChangeRef.current?.(true);
    setPreparationError(null);
    let startAccepted = false;

    try {
      // Await parent-owned interviewer playback shutdown before opening STT.
      await onBeforeListening?.();
      if (
        !mountedRef.current ||
        listeningAttemptRef.current !== attempt ||
        isSubmittingRef.current
      ) {
        return;
      }
      startAccepted = speech.start();
      if (!startAccepted) {
        setPreparationError(
          'Không thể bắt đầu microphone. Hãy kiểm tra quyền truy cập rồi thử lại.'
        );
      }
    } catch {
      if (mountedRef.current && listeningAttemptRef.current === attempt) {
        setPreparationError(
          'Không thể dừng giọng AI. Hãy thử lại trước khi bật microphone.'
        );
      }
    } finally {
      if (
        !startAccepted &&
        mountedRef.current &&
        listeningAttemptRef.current === attempt
      ) {
        listeningStartInFlightRef.current = false;
        setIsStartingListening(false);
        onListeningPreparationChangeRef.current?.(false);
      }
    }
  };

  const handleStopListening = () => {
    cancelPendingListeningStart();
    speech.stop();
  };

  const handleSubmit = async () => {
    const wasPreparingListening =
      isStartingListening || listeningStartInFlightRef.current;
    cancelPendingListeningStart();
    if (speech.listening || wasPreparingListening) speech.stop();

    try {
      await onBeforeSubmit?.();
      setPreparationError(null);
    } catch {
      // Text submission stays available even if presentation audio cannot stop.
      setPreparationError(
        'Không thể dừng giọng AI. Câu trả lời văn bản vẫn có thể được gửi.'
      );
    }

    const trimmed = content.trim();
    if (!trimmed || !onSubmit) return;
    onSubmit(trimmed, durationSeconds > 0 ? durationSeconds : undefined);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (variant === 'call') {
    return (
      <div className="interview-speech-controls" aria-label="Điều khiển câu trả lời">
        <div className="interview-control-tray">
          {!forcedTextOnly && (
            <button
              type="button"
              className={`interview-mic-button ${speech.listening ? 'is-listening' : ''}`}
              aria-label={
                isStartingListening
                  ? 'Đang dừng giọng AI trước khi bật microphone'
                  : speech.listening
                  ? 'Dừng microphone và xem lại câu trả lời'
                  : 'Bắt đầu trả lời bằng microphone'
              }
              aria-pressed={speech.listening}
              aria-busy={isStartingListening}
              disabled={isSubmitting || isStartingListening}
              onClick={speech.listening ? handleStopListening : () => void handleStartListening()}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                {speech.listening ? 'stop_circle' : 'mic'}
              </span>
              <span>
                {isStartingListening
                  ? 'Đang chuẩn bị micro...'
                  : speech.listening
                  ? 'Dừng nói'
                  : 'Trả lời'}
              </span>
            </button>
          )}

          <button
            type="button"
            className="interview-call-button"
            disabled={isSubmitting}
            aria-label={
              forcedTextOnly
                ? 'Mở trình chỉnh sửa văn bản'
                : effectiveMode === 'voice'
                ? 'Chuyển sang gõ văn bản'
                : 'Chuyển sang giọng nói'
            }
            onClick={() => {
              const wasPreparingListening =
                isStartingListening || listeningStartInFlightRef.current;
              if (wasPreparingListening) {
                cancelPendingListeningStart();
                speech.stop();
              } else if (speech.listening) {
                handleStopListening();
              }
              const next = forcedTextOnly || effectiveMode === 'voice' ? 'chatbox' : 'voice';
              setDeviceMode(next);
              onEditorOpenChange?.(next === 'chatbox');
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              {effectiveMode === 'voice' ? 'keyboard' : 'mic'}
            </span>
            <span>{forcedTextOnly || effectiveMode === 'voice' ? 'Gõ văn bản' : 'Giọng nói'}</span>
          </button>

          {controls}
        </div>

        <p className="interview-dock-status" role="status">
          {isSubmitting
            ? 'Đã nộp câu trả lời · chờ phản hồi từ Nexora AI'
            : speech.listening
            ? `Đang nghe bạn · ${formatTimer(durationSeconds)}`
            : effectiveMode === 'chatbox'
            ? 'Nhập câu trả lời, xem lại rồi nộp'
            : 'Nhấn microphone để bắt đầu trả lời · không tự động nộp'}
        </p>

        {speech.error && (
          <p className="interview-mic-error" role="alert">
            {speech.error.message}
          </p>
        )}

        {preparationError && (
          <p className="interview-mic-error" role="alert">
            {preparationError}
          </p>
        )}

        {editorOpen !== undefined ? (
          <AnswerEditor
            isOpen={editorOpen && !isSubmitting}
            content={content}
            disabled={isSubmitting}
            listening={speech.listening}
            onClose={() => onEditorOpenChange?.(false)}
            onChange={(val) => {
              setContent(val);
              contentRef.current = val;
              onTranscriptChange?.(val);
            }}
            onSubmit={() => {
              handleSubmit();
              onEditorOpenChange?.(false);
            }}
          />
        ) : (
          (effectiveMode === 'chatbox' || Boolean(content.trim())) && (
            <div className="interview-answer-composer">
              <label htmlFor="interview-answer-draft">
                Phụ đề câu trả lời của bạn <span>· {wordCount} từ</span>
              </label>
              <textarea
                id="interview-answer-draft"
                rows={3}
                value={content}
                readOnly={speech.listening}
                disabled={isSubmitting}
                onChange={(e) => {
                  setContent(e.target.value);
                  contentRef.current = e.target.value;
                  onTranscriptChange?.(e.target.value);
                }}
                placeholder="Nhập câu trả lời của bạn hoặc nói vào mic để nhận diện..."
              />
              <div className="interview-composer-footer">
                <p>Bản nháp được lưu tự động theo từng câu hỏi.</p>
                <button
                  type="button"
                  className="interview-call-button"
                  disabled={!content.trim() || isSubmitting || speech.listening}
                  onClick={handleSubmit}
                >
                  Nộp câu trả lời
                </button>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  // Default fallback layout
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={speech.listening ? handleStopListening : () => void handleStartListening()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold"
          disabled={isSubmitting}
        >
          {speech.listening ? 'Dừng nói' : 'Bắt đầu nói'}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold"
          disabled={!content.trim() || isSubmitting || speech.listening}
        >
          Nộp câu trả lời
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onTranscriptChange?.(e.target.value);
        }}
        rows={4}
        className="w-full p-3 border rounded-lg"
        placeholder="Câu trả lời của bạn..."
      />
    </div>
  );
};

export default AudioSpeechDock;
