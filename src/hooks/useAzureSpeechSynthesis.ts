'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAzureSpeechPlaybackController,
  type AzureSpeechPlaybackState,
} from '@/services/azureSpeechPlayback';

const IDLE_STATE: AzureSpeechPlaybackState = { status: 'idle', error: null };

export function useAzureSpeechSynthesis(
  interviewId: string,
  onSpeakingChange?: (speaking: boolean) => void
) {
  const [playback, setPlayback] = useState<AzureSpeechPlaybackState>(IDLE_STATE);

  const controller = useMemo(
    () =>
      createAzureSpeechPlaybackController({
        interviewId,
        onStateChange: setPlayback,
      }),
    [interviewId]
  );

  useEffect(() => {
    onSpeakingChange?.(playback.status === 'speaking');
  }, [onSpeakingChange, playback.status]);

  useEffect(() => {
    // stop() is intentionally reusable: React StrictMode replays effect
    // cleanup/setup in development using the same controller instance.
    return () => {
      void controller.stop().catch(() => undefined);
    };
  }, [controller]);

  const speak = useCallback((text: string) => controller.speak(text), [controller]);
  const stop = useCallback(() => controller.stop(), [controller]);

  return {
    ...playback,
    speak,
    stop,
  };
}
