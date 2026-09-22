'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type CameraState = 'off' | 'requesting' | 'on' | 'denied' | 'unavailable' | 'error';

export interface CameraAcquisitionToken {
  generation: number;
  scopeKey: string;
}

export interface MediaTrackLike {
  stop: () => void;
}

export interface MediaStreamLike {
  getTracks: () => MediaTrackLike[];
}

/**
 * Production coordinator managing acquisition generation tokens,
 * canonical room eligibility, and interview ID scope boundaries.
 */
export class CameraAcquisitionCoordinator {
  private generation = 0;
  private currentScopeKey = '';
  private isAllowed = false;
  private isMounted = true;

  constructor(initialAllowed = true, initialScopeKey = '') {
    this.isAllowed = initialAllowed;
    this.currentScopeKey = initialScopeKey;
  }

  update(allowed: boolean, scopeKey: string, mounted = true): void {
    this.isAllowed = allowed;
    this.currentScopeKey = scopeKey;
    this.isMounted = mounted;
  }

  setMounted(mounted: boolean): void {
    this.isMounted = mounted;
  }

  isAcquisitionAllowed(): boolean {
    return this.isMounted && this.isAllowed;
  }

  beginAcquisition(): CameraAcquisitionToken {
    const generation = ++this.generation;
    return {
      generation,
      scopeKey: this.currentScopeKey,
    };
  }

  invalidate(): void {
    this.generation++;
  }

  shouldAccept(token: CameraAcquisitionToken): boolean {
    return (
      this.isMounted &&
      this.isAllowed &&
      token.generation === this.generation &&
      token.scopeKey === this.currentScopeKey
    );
  }

  stopStreamTracks(stream: MediaStreamLike | MediaStream | null | undefined): void {
    if (!stream) return;
    try {
      const tracks = stream.getTracks();
      if (Array.isArray(tracks)) {
        tracks.forEach((track) => {
          try {
            track.stop();
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }
  }
}

export interface UseLocalCameraOptions {
  autoStopOnUnmount?: boolean;
  enabled?: boolean;
  scopeKey?: string;
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
  const {
    autoStopOnUnmount = true,
    enabled = true,
    scopeKey = '',
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('off');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);

  const [coordinator] = useState(() => new CameraAcquisitionCoordinator(enabled, scopeKey));
  // Synchronously update coordinator on render so asynchronous resolutions
  // can immediately inspect canonical eligibility and scope before passive effects run.
  coordinator.update(enabled, scopeKey);

  const isSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  const stopAllTracks = useCallback(() => {
    if (streamRef.current) {
      coordinator.stopStreamTracks(streamRef.current);
      streamRef.current = null;
    }
    if (mountedRef.current) {
      setStream(null);
    }
  }, [coordinator]);

  const disableCamera = useCallback(() => {
    coordinator.invalidate();
    stopAllTracks();
    if (mountedRef.current) {
      setState('off');
      setErrorMessage(null);
    }
  }, [coordinator, stopAllTracks]);

  const enableCamera = useCallback(async () => {
    if (!isSupported) {
      setState('unavailable');
      setErrorMessage('Thiết bị hoặc trình duyệt của bạn không hỗ trợ truy cập camera.');
      return;
    }

    if (!coordinator.isAcquisitionAllowed()) {
      return;
    }

    // Stop existing stream if any before acquiring new
    stopAllTracks();

    const token = coordinator.beginAcquisition();
    setState('requesting');
    setErrorMessage(null);

    try {
      // Audio is explicitly false to ensure zero conflict with speech recognition and TTS
      const mediaStream = await navigator.mediaDevices.getUserMedia(CAMERA_VIDEO_CONSTRAINTS);

      // Guard against component unmount, newer operation, scope change, or non-active room
      if (!coordinator.shouldAccept(token)) {
        coordinator.stopStreamTracks(mediaStream);
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setState('on');
      setErrorMessage(null);
    } catch (err: unknown) {
      if (!coordinator.shouldAccept(token)) return;

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
  }, [coordinator, isSupported, stopAllTracks]);

  const toggleCamera = useCallback(async () => {
    if (state === 'on' || state === 'requesting') {
      disableCamera();
    } else {
      await enableCamera();
    }
  }, [state, disableCamera, enableCamera]);

  // Stop active stream when camera becomes disabled / non-active
  useEffect(() => {
    if (!enabled) {
      disableCamera();
    }
  }, [enabled, disableCamera]);

  // Stop active stream when interview ID scope changes
  const prevScopeRef = useRef<string>(scopeKey);
  useEffect(() => {
    if (prevScopeRef.current !== scopeKey) {
      prevScopeRef.current = scopeKey;
      disableCamera();
    }
  }, [scopeKey, disableCamera]);

  // Mount & unmount lifecycle
  useEffect(() => {
    mountedRef.current = true;
    coordinator.setMounted(true);
    return () => {
      mountedRef.current = false;
      coordinator.setMounted(false);
      coordinator.invalidate();
      if (autoStopOnUnmount) {
        stopAllTracks();
      }
    };
  }, [autoStopOnUnmount, coordinator, stopAllTracks]);

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
