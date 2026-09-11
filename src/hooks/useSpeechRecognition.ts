'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  collectFinalTranscript,
  DEFAULT_SPEECH_LANGUAGE,
  mapSpeechLanguage,
  previewTranscript,
  resolveSpeechRecognitionConstructor,
  shouldSurfaceSpeechError,
  speechErrorToUi,
  canStartSpeechSession,
  emptySpeechTranscript,
  unsupportedSpeechError,
  type SpeechErrorUi,
  type SpeechLanguage,
  type SpeechRecognitionErrorEventLike,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from './speechRecognitionContract';

export interface UseSpeechRecognitionOptions {
  /**
   * Called once per newly finalized speech segment. Consumers merge this into
   * their editable answer field. Interim text is never passed here, so it can
   * never be submitted automatically.
   */
  onFinalSegment?: (segment: string) => void;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  preview: string;
  error: SpeechErrorUi | null;
  language: SpeechLanguage;
  setLanguage: (language: SpeechLanguage) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const emptySubscribe = () => () => {};
const getSpeechSupportedSnapshot = () =>
  resolveSpeechRecognitionConstructor(globalThis) !== null;
const getSpeechSupportedServerSnapshot = () => false;

/**
 * Browser-only voice-to-text hook using the Web Speech API.
 *
 * The transcript is plain editable text destined for the existing answer field;
 * no audio is captured, stored, or transmitted. The hook never submits anything.
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const supported = useSyncExternalStore(
    emptySubscribe,
    getSpeechSupportedSnapshot,
    getSpeechSupportedServerSnapshot
  );
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<SpeechErrorUi | null>(null);
  const [language, setLanguageState] = useState<SpeechLanguage>(DEFAULT_SPEECH_LANGUAGE);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const processedFinalIndexesRef = useRef<Set<number>>(new Set());
  const listeningRef = useRef(false);
  const explicitStopRef = useRef(false);
  const languageRef = useRef<SpeechLanguage>(DEFAULT_SPEECH_LANGUAGE);
  const onFinalSegmentRef = useRef(options.onFinalSegment);

  // Keep the latest callback without re-creating recognizers mid-session.
  useEffect(() => {
    onFinalSegmentRef.current = options.onFinalSegment;
  }, [options.onFinalSegment]);

  const teardown = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    try {
      recognition.abort();
    } catch {
      // Ignore: aborting an already-ended recognizer can throw in some browsers.
    }
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const stop = useCallback(() => {
    // Request the browser to finalize pending audio. Do NOT flip listening=false
    // here: `onresult` may still deliver one final segment before `onend`. Keeping
    // listening=true until `onend` guarantees submission stays blocked until the
    // transcript is truly settled, so no text can appear after a submitted payload.
    explicitStopRef.current = true;
    const recognition = recognitionRef.current;
    if (!recognition) {
      listeningRef.current = false;
      setListening(false);
      return;
    }
    try {
      recognition.stop();
    } catch {
      teardown();
      listeningRef.current = false;
      setListening(false);
    }
  }, [teardown]);

  const reset = useCallback(() => {
    // Hard reset (new question, successful submit, explicit reset): abort any active
    // recognition so late finals cannot leak into the next answer, then clear state.
    teardown();
    listeningRef.current = false;
    setListening(false);
    const empty = emptySpeechTranscript();
    finalTranscriptRef.current = empty.finalText;
    processedFinalIndexesRef.current = new Set();
    setFinalTranscript(empty.finalText);
    setInterimTranscript(empty.interimText);
    setError(empty.error);
  }, [teardown]);

  const start = useCallback(() => {
    if (!canStartSpeechSession(listeningRef.current)) return; // already listening

    const ctor = resolveSpeechRecognitionConstructor(globalThis);
    if (!ctor) {
      setError(unsupportedSpeechError());
      return;
    }

    // Fresh session: clear transcript state but keep the chosen language.
    finalTranscriptRef.current = '';
    processedFinalIndexesRef.current = new Set();
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
    explicitStopRef.current = false;

    let recognition: SpeechRecognitionLike;
    try {
      recognition = new ctor();
    } catch {
      setError(speechErrorToUi('generic'));
      return;
    }

    recognition.lang = mapSpeechLanguage(languageRef.current);
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const collected = collectFinalTranscript(
        finalTranscriptRef.current,
        event.results,
        processedFinalIndexesRef.current
      );
      processedFinalIndexesRef.current = collected.processedFinalIndexes;

      if (collected.finalText !== finalTranscriptRef.current) {
        finalTranscriptRef.current = collected.finalText;
        setFinalTranscript(collected.finalText);
      }
      for (const segment of collected.addedSegments) {
        onFinalSegmentRef.current?.(segment);
      }

      // Interim text is preview-only and never merged into the final answer.
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result && result.isFinal !== true) {
          interim += result[0]?.transcript ?? '';
        }
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      // 'aborted' after an explicit user stop is not a user-facing error.
      if (!shouldSurfaceSpeechError(event.error, explicitStopRef.current)) {
        return;
      }
      const ui = speechErrorToUi(event.error);
      setError(ui);
      if (ui.kind !== 'no-speech') {
        listeningRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      // A natural end (silence) simply returns to idle; we never auto-restart.
      listeningRef.current = false;
      setListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // start() throws if already started; treat as a safe no-op.
      teardown();
      setListening(false);
    }
  }, [teardown]);

  const setLanguage = useCallback((next: SpeechLanguage) => {
    const mapped = mapSpeechLanguage(next);
    languageRef.current = mapped;
    setLanguageState(mapped);
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.lang = mapped;
    }
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    finalTranscript,
    preview: previewTranscript(finalTranscript, interimTranscript),
    error,
    language,
    setLanguage,
    start,
    stop,
    reset,
  };
}
