'use client';

import React from 'react';
import type { CameraState } from '@/hooks/useLocalCamera';

export interface CameraToggleButtonProps {
  state: CameraState;
  onToggle: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  errorMessage?: string | null;
}

export const CameraToggleButton: React.FC<CameraToggleButtonProps> = ({
  state,
  onToggle,
  disabled = false,
  className = '',
  errorMessage,
}) => {
  const isRequesting = state === 'requesting';
  const isOn = state === 'on';

  const label = isRequesting
    ? 'Đang kết nối camera...'
    : isOn
    ? 'Tắt camera'
    : 'Bật camera';

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        className={`interview-call-button interview-camera-button ${
          isOn ? 'is-camera-on' : ''
        } ${className}`}
        aria-label={label}
        aria-pressed={isOn}
        disabled={disabled || isRequesting}
        onClick={() => void onToggle()}
        title={errorMessage || label}
      >
        {isRequesting ? (
          <span
            className="functional-spinner inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full"
            aria-hidden="true"
          />
        ) : (
          <span aria-hidden="true" className="material-symbols-outlined">
            {isOn ? 'videocam' : 'videocam_off'}
          </span>
        )}
        <span>{label}</span>
      </button>
    </div>
  );
};
