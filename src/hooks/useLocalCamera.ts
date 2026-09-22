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
    setStream(null);
  }, []);

  const disableCamera = useCallback(() => {
    stopAllTracks();
    if (mountedRef.current) {
      setState('off');
      setErrorMessage(null);
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

    setState('requesting');
    setErrorMessage(null);

    try {
      // Audio is explicitly false to ensure zero conflict with speech recognition and TTS
      const mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_VIDEO_CONSTRAINTS);

      if (!mountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setState('on');
      setErrorMessage(null);
    } catch (err: unknown) {
      if (!mountedRef.current) return;

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
    return () => {
      mountedRef.current = false;
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
