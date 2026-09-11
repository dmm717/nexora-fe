/**
 * Pure, browser-agnostic helpers for the temporary A10 voice input.
 *
 * This module intentionally has NO React and NO direct `window` access so it can
 * be imported by Node production-contract tests. Browser wiring lives in
 * `useSpeechRecognition.ts`. Audio is never produced or uploaded: speech becomes
 * editable text that is submitted as the normal answer `content`.
 */

export type SpeechLanguage = 'vi-VN' | 'en-US';

export interface SpeechLanguageOption {
  label: string;
  value: SpeechLanguage;
}

export const DEFAULT_SPEECH_LANGUAGE: SpeechLanguage = 'vi-VN';

export const SPEECH_LANGUAGE_OPTIONS: readonly SpeechLanguageOption[] = [
  { label: 'Tiếng Việt', value: 'vi-VN' },
  { label: 'English', value: 'en-US' },
];

// --- Minimal structural Web Speech API types (not present in TS lib.dom) ---

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

export type SpeechErrorKind =
  | 'unsupported'
  | 'permission'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'generic';

export interface SpeechErrorUi {
  kind: SpeechErrorKind;
  message: string;
}

export const SPEECH_UNSUPPORTED_MESSAGE =
  'Trình duyệt hiện tại chưa hỗ trợ nhập giọng nói. Bạn vẫn có thể nhập câu trả lời bằng bàn phím.';

const SPEECH_ERROR_MESSAGES: Record<SpeechErrorKind, string> = {
  unsupported: SPEECH_UNSUPPORTED_MESSAGE,
  permission:
    'Không thể truy cập microphone. Vui lòng cấp quyền microphone cho trình duyệt.',
  'no-speech': 'Không nhận diện được giọng nói. Vui lòng thử nói lại.',
  'audio-capture':
    'Không thể thu âm từ microphone. Vui lòng kiểm tra thiết bị và thử lại.',
  network: 'Lỗi kết nối dịch vụ nhận diện giọng nói. Vui lòng thử lại.',
  aborted: 'Đã dừng nhận diện giọng nói.',
  generic:
    'Không thể nhận diện giọng nói. Vui lòng thử lại hoặc nhập câu trả lời bằng bàn phím.',
};

/**
 * Resolves the browser SpeechRecognition constructor, supporting both the
 * standard and Chromium-prefixed implementations. Returns null when unsupported.
 */
export function resolveSpeechRecognitionConstructor(
  scope: unknown
): SpeechRecognitionConstructor | null {
  if (!scope || typeof scope !== 'object') return null;
  const candidate = scope as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  if (typeof candidate.SpeechRecognition === 'function') {
    return candidate.SpeechRecognition as SpeechRecognitionConstructor;
  }
  if (typeof candidate.webkitSpeechRecognition === 'function') {
    return candidate.webkitSpeechRecognition as SpeechRecognitionConstructor;
  }
  return null;
}

/**
 * Normalizes a language code to a supported recognition locale.
 * Anything unrecognized falls back to the Vietnamese default.
 */
export function mapSpeechLanguage(code: unknown): SpeechLanguage {
  return SPEECH_LANGUAGE_OPTIONS.some((option) => option.value === code)
    ? (code as SpeechLanguage)
    : DEFAULT_SPEECH_LANGUAGE;
}

/**
 * Appends a freshly finalized speech segment to the current (editable) text.
 * Idempotent: a segment already present at the tail is not duplicated. The
 * returned value is always fully editable plain text, never an audio artifact.
 */
export function mergeFinalTranscript(current: string, segment: string): string {
  const cleanSegment = segment.trim();
  if (!cleanSegment) return current;

  const trimmedCurrent = current.replace(/\s+$/, '');
  if (!trimmedCurrent) return cleanSegment;
  if (trimmedCurrent === cleanSegment) return current;
  if (trimmedCurrent.endsWith(cleanSegment)) return current;

  return `${trimmedCurrent} ${cleanSegment}`;
}

export interface FinalTranscriptCollection {
  finalText: string;
  nextIndex: number;
  addedSegments: string[];
}

/**
 * Consumes a SpeechRecognition result list, collecting only finalized segments.
 * Interim (non-final) results are never returned, so they can never be submitted
 * automatically. `startIndex` lets callers resume without reprocessing finalized
 * results, which prevents duplicate chunks across repeated result events.
 */
export function collectFinalTranscript(
  previousFinal: string,
  results: SpeechRecognitionResultListLike,
  startIndex: number
): FinalTranscriptCollection {
  let finalText = previousFinal;
  let nextIndex = startIndex;
  const addedSegments: string[] = [];

  const safeStart = Math.max(0, startIndex);
  if (!results || typeof results.length !== 'number') {
    return { finalText, nextIndex, addedSegments };
  }

  for (let i = safeStart; i < results.length; i += 1) {
    const result = results[i];
    if (!result || result.isFinal !== true) continue;

    const segment = result[0]?.transcript ?? '';
    const nextText = mergeFinalTranscript(finalText, segment);
    if (nextText !== finalText) {
      const cleanSegment = segment.trim();
      if (cleanSegment) addedSegments.push(cleanSegment);
      finalText = nextText;
    }
    nextIndex = i + 1;
  }

  return { finalText, nextIndex, addedSegments };
}

/**
 * Builds the live preview shown while listening: committed final text plus the
 * current interim text. Preview is display-only and never submitted directly.
 */
export function previewTranscript(finalText: string, interimText: string): string {
  return [finalText, interimText]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(' ');
}

/**
 * Maps a Web Speech error code to a safe, actionable Vietnamese message.
 * Unknown errors fall back to a generic message; raw provider details are never
 * surfaced, keeping A11 observability concerns backend-side.
 */
export function speechErrorToUi(error: unknown): SpeechErrorUi {
  const code = typeof error === 'string' ? error : '';
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return { kind: 'permission', message: SPEECH_ERROR_MESSAGES.permission };
    case 'no-speech':
      return { kind: 'no-speech', message: SPEECH_ERROR_MESSAGES['no-speech'] };
    case 'audio-capture':
      return { kind: 'audio-capture', message: SPEECH_ERROR_MESSAGES['audio-capture'] };
    case 'network':
      return { kind: 'network', message: SPEECH_ERROR_MESSAGES.network };
    case 'aborted':
      return { kind: 'aborted', message: SPEECH_ERROR_MESSAGES.aborted };
    default:
      return { kind: 'generic', message: SPEECH_ERROR_MESSAGES.generic };
  }
}

/** Returns the unsupported-browser UI state. */
export function unsupportedSpeechError(): SpeechErrorUi {
  return { kind: 'unsupported', message: SPEECH_ERROR_MESSAGES.unsupported };
}

/** A listening session may only begin when not already listening. */
export function canStartSpeechSession(isListening: boolean): boolean {
  return !isListening;
}

/**
 * Decides whether a recognition error should surface to the user.
 * An 'aborted' event after an explicit user stop is expected, not an error.
 */
export function shouldSurfaceSpeechError(error: unknown, explicitStop: boolean): boolean {
  return !(error === 'aborted' && explicitStop);
}

/** Canonical cleared transcript state; keeps reset() deterministic and testable. */
export function emptySpeechTranscript(): {
  finalText: string;
  interimText: string;
  error: SpeechErrorUi | null;
} {
  return { finalText: '', interimText: '', error: null };
}
