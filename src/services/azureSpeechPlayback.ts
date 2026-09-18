import type {
  AudioConfig,
  SpeakerAudioDestination,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk';
import { INTERVIEW_SPEECH_CONFIG } from '../config/speech';
import { ApiError } from './apiClient';
import { getInterviewSpeechAuthorization } from './speechTokenManager';

type SpeechSdkModule = typeof import('microsoft-cognitiveservices-speech-sdk');

export type AzureSpeechPlaybackStatus = 'idle' | 'loading' | 'speaking' | 'error';

export interface AzureSpeechPlaybackState {
  status: AzureSpeechPlaybackStatus;
  error: string | null;
}

interface AzureSpeechPlaybackOptions {
  interviewId: string;
  getAuthorization?: typeof getInterviewSpeechAuthorization;
  loadSdk?: () => Promise<SpeechSdkModule>;
  onStateChange?: (state: AzureSpeechPlaybackState) => void;
}

interface PlaybackResources {
  audioConfig: AudioConfig;
  audioElement: HTMLAudioElement | null;
  audioEnded: () => void;
  audioError: () => void;
  audioPlaying: () => void;
  speaker: SpeakerAudioDestination;
  synthesizer: SpeechSynthesizer;
}

const VOICE_UNAVAILABLE_MESSAGE =
  'Giọng AI tạm thời không khả dụng. Bạn vẫn có thể đọc câu hỏi trên màn hình.';
const RATE_LIMITED_MESSAGE =
  'Giọng AI đang nhận quá nhiều yêu cầu. Hãy thử lại sau ít phút.';
const AUTH_REQUIRED_MESSAGE =
  'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.';
const INTERVIEW_UNAVAILABLE_MESSAGE =
  'Không thể mở giọng AI cho buổi phỏng vấn này. Bạn vẫn có thể đọc câu hỏi trên màn hình.';

export function getAzureSpeechErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return VOICE_UNAVAILABLE_MESSAGE;

  const code = error.code?.toUpperCase();
  if (error.status === 429 || code === 'RATE_LIMITED') {
    return RATE_LIMITED_MESSAGE;
  }
  if (error.status === 401 || code === 'UNAUTHENTICATED') {
    return AUTH_REQUIRED_MESSAGE;
  }
  if (error.status === 404 || code === 'NOT_FOUND') {
    return INTERVIEW_UNAVAILABLE_MESSAGE;
  }
  if (
    error.status === 503 ||
    code === 'FEATURE_DISABLED' ||
    code === 'SPEECH_PROVIDER_UNAVAILABLE'
  ) {
    return VOICE_UNAVAILABLE_MESSAGE;
  }

  return VOICE_UNAVAILABLE_MESSAGE;
}

function closeResources(resources: PlaybackResources): void {
  const cleanupErrors: unknown[] = [];

  resources.audioElement?.removeEventListener('playing', resources.audioPlaying);
  resources.audioElement?.removeEventListener('ended', resources.audioEnded);
  resources.audioElement?.removeEventListener('error', resources.audioError);
  resources.speaker.onAudioStart = () => undefined;
  resources.speaker.onAudioEnd = () => undefined;

  try {
    // Pause synchronously before releasing SDK/network resources. This is the
    // stop-before-microphone guarantee used by AudioSpeechDock.
    resources.speaker.pause();
    resources.audioElement?.pause();
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    resources.synthesizer.close();
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    resources.audioConfig.close();
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (cleanupErrors.length > 0) {
    // Do not surface SDK diagnostics because they can contain provider details.
    throw new Error('Unable to stop speech playback safely.');
  }
}

export function createAzureSpeechPlaybackController({
  interviewId,
  getAuthorization = getInterviewSpeechAuthorization,
  loadSdk = async () => import('microsoft-cognitiveservices-speech-sdk'),
  onStateChange,
}: AzureSpeechPlaybackOptions) {
  let generation = 0;
  let disposed = false;
  let activeResources: PlaybackResources | null = null;

  const isCurrent = (attempt: number) => !disposed && generation === attempt;

  const publish = (status: AzureSpeechPlaybackStatus, error: string | null = null) => {
    onStateChange?.({ status, error });
  };

  const releaseActiveResources = () => {
    const resources = activeResources;
    activeResources = null;
    if (resources) closeResources(resources);
  };

  const finish = (attempt: number) => {
    if (!isCurrent(attempt)) return;
    generation += 1;
    try {
      releaseActiveResources();
    } finally {
      publish('idle');
    }
  };

  const fail = (attempt: number, error: unknown) => {
    if (!isCurrent(attempt)) return;
    generation += 1;
    try {
      releaseActiveResources();
    } catch {
      // The safe user-facing error below intentionally hides SDK diagnostics.
    }
    publish('error', getAzureSpeechErrorMessage(error));
  };

  const stop = async () => {
    generation += 1;
    const resources = activeResources;
    activeResources = null;
    publish('idle');
    if (resources) closeResources(resources);
  };

  const speak = async (text: string) => {
    if (disposed || !interviewId || !text.trim()) return;

    const attempt = ++generation;
    try {
      releaseActiveResources();
      publish('loading');

      const authorization = await getAuthorization(interviewId);
      if (!isCurrent(attempt)) return;

      // The official SDK stays out of the server/initial route module graph.
      const sdk = await loadSdk();
      if (!isCurrent(attempt)) return;

      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
        authorization.token,
        authorization.region
      );
      speechConfig.speechSynthesisVoiceName = INTERVIEW_SPEECH_CONFIG.voiceName;
      speechConfig.speechSynthesisOutputFormat =
        sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

      const speaker = new sdk.SpeakerAudioDestination();
      const audioConfig = sdk.AudioConfig.fromSpeakerOutput(speaker);
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      const resources: PlaybackResources = {
        audioConfig,
        audioElement: null,
        audioEnded: () => finish(attempt),
        audioError: () => fail(attempt, new Error('Audio playback failed.')),
        audioPlaying: () => {
          if (isCurrent(attempt)) publish('speaking');
        },
        speaker,
        synthesizer,
      };

      if (!isCurrent(attempt)) {
        closeResources(resources);
        return;
      }

      activeResources = resources;
      speaker.onAudioStart = () => {
        if (!isCurrent(attempt)) return;
        // The SDK creates its internal HTMLAudioElement when it assigns the
        // negotiated output format, which can happen after synthesizer setup.
        const audioElement = speaker.internalAudio;
        if (!audioElement) return;
        resources.audioElement = audioElement;
        audioElement.addEventListener('playing', resources.audioPlaying);
        audioElement.addEventListener('ended', resources.audioEnded);
        audioElement.addEventListener('error', resources.audioError);
      };
      speaker.onAudioEnd = resources.audioEnded;
      // SDK onAudioStart fires before HTMLMediaElement.play() succeeds. Actual
      // playback state is driven by the media element's `playing` event above.

      // One complete interview question is one synthesis request; no language
      // splitting or provider fallback is performed.
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (!isCurrent(attempt)) return;
          if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
            fail(attempt, new Error('Speech synthesis did not complete.'));
          }
        },
        (sdkError) => fail(attempt, sdkError)
      );
    } catch (error) {
      fail(attempt, error);
    }
  };

  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    generation += 1;
    const resources = activeResources;
    activeResources = null;
    publish('idle');
    if (resources) closeResources(resources);
  };

  return { speak, stop, dispose };
}
