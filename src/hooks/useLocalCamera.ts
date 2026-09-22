'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type CameraState = 'off' | 'requesting' | 'on' | 'denied' | 'unavailable' | 'error';

export interface UseLocalCameraOptions {
  autoStopOnUnmount?: boolean;
}

export interface UseLocalCameraReturn {
  stream: MediaStream | null;
  state: CameraState;
  enableCamera: () => Promise<void>;
  disableCamera: () => void;
  toggleCamera: () => Promise<void>;
  errorMessage: string | null;
  isSupported: boolean;
}

export const CAMERA_VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

export function getCameraErrorMessage(errorName: string): string {
  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Không thể truy cập camera. Bạn vẫn có thể tiếp tục phỏng vấn mà không bật camera.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Không tìm thấy camera. Phiên phỏng vấn vẫn có thể tiếp tục bình thường.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera đang được ứng dụng khác sử dụng. Bạn vẫn có thể tiếp tục phỏng vấn mà không bật camera.';
    default:
      return 'Không thể bật camera lúc này. Phiên phỏng vấn vẫn có thể tiếp tục bình thường.';
  }
}

export function useLocalCamera(options: UseLocalCameraOptions = {}): UseLocalCameraReturn {
  const { autoStopOnUnmount = true } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('off');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);
  const requestGenerationRef = useRef<number>(0);

  const isSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore already stopped tracks
        }
      });
      streamRef.current = null;
    }
    if (mountedRef.current) {
      setStream(null);
    }
  }, []);

  const disableCamera = useCallback(() => {
    // Invalidate any in-flight enableCamera requests
    requestGenerationRef.current++;
    stopAllTracks();
    if (mountedRef.current) {
      setState((prev) => (prev === 'off' ? prev : 'off'));
      setErrorMessage((prev) => (prev === null ? null : null));
    }
  }, [stopAllTracks]);

  const enableCamera = useCallback(async () => {
    if (!isSupported) {
      setState('unavailable');
      setErrorMessage('Thiết bị hoặc trình duyệt của bạn không hỗ trợ truy cập camera.');
      return;
    }

    // Stop existing stream if any before acquiring new
    stopAllTracks();

    const generation = ++requestGenerationRef.current;
    setState('requesting');
    setErrorMessage(null);

    try {
      // Audio is explicitly false to ensure zero conflict with speech recognition and TTS
      const mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_VIDEO_CONSTRAINTS);

      // Guard against component unmount or newer operation (e.g. disableCamera, interview status change)
      if (!mountedRef.current || generation !== requestGenerationRef.current) {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // ignore
          }
        });
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setState('on');
      setErrorMessage(null);
    } catch (err: unknown) {
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;

      const errorName = err instanceof Error ? err.name : 'UnknownError';
      const friendlyMessage = getCameraErrorMessage(errorName);

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setState('denied');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setState('unavailable');
      } else {
        setState('error');
      }

      setErrorMessage(friendlyMessage);
      stopAllTracks();
    }
  }, [isSupported, stopAllTracks]);

  const toggleCamera = useCallback(async () => {
    if (state === 'on' || state === 'requesting') {
      disableCamera();
    } else {
      await enableCamera();
    }
  }, [state, disableCamera, enableCamera]);

  useEffect(() => {
    mountedRef.current = true;
    const generationRef = requestGenerationRef;
    return () => {
      mountedRef.current = false;
      generationRef.current++;
      if (autoStopOnUnmount) {
        stopAllTracks();
      }
    };
  }, [autoStopOnUnmount, stopAllTracks]);

  return {
    stream,
    state,
    enableCamera,
    disableCamera,
    toggleCamera,
    errorMessage,
    isSupported,
  };
}
