'use client';

import React from 'react';
import type { CameraState } from '@/hooks/useLocalCamera';
import { MorphIcon } from 'morphicons/react';
import { Video, VideoOff } from 'lucide';

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
          className="functional-spinner inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          aria-hidden="true"
        />
      ) : (
        <MorphIcon
          icon={isOn ? Video : VideoOff}
          spring="snappy"
          reducedMotion="user"
          size={20}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

