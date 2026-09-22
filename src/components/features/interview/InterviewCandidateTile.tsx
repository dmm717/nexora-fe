'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AudioSpeechState } from './AudioSpeechDock';
import type { CameraState } from '@/hooks/useLocalCamera';

export interface InterviewCandidateTileProps {
  candidateName: string;
  initials: string;
  avatarUrl?: string;
  candidateState: AudioSpeechState;
  forcedTextOnly?: boolean;
  cameraStream: MediaStream | null;
  cameraState: CameraState;
  onToggleCamera?: () => void;
  className?: string;
}

export const InterviewCandidateTile: React.FC<InterviewCandidateTileProps> = ({
  candidateName,
  initials,
  avatarUrl,
  candidateState,
  forcedTextOnly = false,
  cameraStream,
  cameraState,
  onToggleCamera,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const isCameraOn = cameraState === 'on' && Boolean(cameraStream);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      if (cameraStream) {
        videoEl.srcObject = cameraStream;
      } else {
        videoEl.srcObject = null;
      }
    }

    return () => {
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [cameraStream, isCameraOn]);

  const durationLabel = `${Math.floor(candidateState.duration / 60)
    .toString()
    .padStart(2, '0')}:${(candidateState.duration % 60).toString().padStart(2, '0')}`;

  const micIcon = candidateState.error
    ? 'mic_off'
    : candidateState.mode === 'chatbox'
    ? 'keyboard'
    : 'mic';

  const micStatusLabel = candidateState.error
    ? 'Mic chưa khả dụng'
    : candidateState.listening
    ? 'Bạn đang trả lời'
    : candidateState.mode === 'chatbox' || forcedTextOnly
    ? 'Đang gõ văn bản'
    : 'Sẵn sàng nói';

  return (
    <aside
      className={`interview-self-tile ${isCameraOn ? 'interview-self-tile-camera-on' : ''} ${className}`}
      data-listening={candidateState.listening}
      data-camera-state={cameraState}
      aria-label="Trạng thái hình ảnh và giọng nói của bạn"
    >
      {isCameraOn ? (
        <div className="interview-camera-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="interview-camera-video"
            aria-label="Khung hình camera của bạn (tự xem, không thu âm hay ghi hình)"
          />
          <div className="interview-camera-scrim" />
          <div className="interview-camera-overlay">
            <div className="interview-camera-header">
              <span className="interview-camera-live-badge">
                <span className="interview-camera-live-dot" />
                Live
              </span>
              <span className="interview-answer-duration">{durationLabel}</span>
            </div>
            <div className="interview-camera-footer">
              <strong className="interview-camera-candidate-name">{candidateName}</strong>
              <span className="interview-camera-mic-status">
                <span aria-hidden="true" className="material-symbols-outlined">
                  {micIcon}
                </span>
                <span>{micStatusLabel}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="interview-self-tile-content">
          <div className="interview-self-avatar" aria-hidden="true">
            {avatarUrl && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover rounded-full"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <strong className="interview-self-name">{candidateName}</strong>
          <div className="interview-self-subtle-status">
            {onToggleCamera ? (
              <button
                type="button"
                onClick={onToggleCamera}
                className="interview-camera-chip cursor-pointer hover:text-white transition-colors"
                title="Nhấn để bật camera"
                aria-label="Nhấn để bật camera"
              >
                <span aria-hidden="true" className="material-symbols-outlined">
                  videocam_off
                </span>
                <span>Camera tắt</span>
              </button>
            ) : (
              <span className="interview-camera-chip" title="Camera đang tắt">
                <span aria-hidden="true" className="material-symbols-outlined">
                  videocam_off
                </span>
                <span>Camera tắt</span>
              </span>
            )}
          </div>
          <p className="interview-self-mic-status">
            <span aria-hidden="true" className="material-symbols-outlined">
              {micIcon}
            </span>
            <span>{micStatusLabel}</span>
          </p>
          <span className="interview-answer-duration">{durationLabel}</span>
        </div>
      )}
    </aside>
  );
};
