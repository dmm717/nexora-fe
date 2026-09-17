import React from 'react';

export interface AudioWaveformProps {
  isRecording: boolean;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 h-8 px-2 ${className}`}>
      {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 35, 80].map((height, idx) => (
        <span
          key={idx}
          className={`w-1 rounded-full transition-all duration-200 ${
            isRecording ? 'bg-primary animate-pulse' : 'bg-outline-variant/50'
          }`}
          style={{
            height: isRecording ? `${Math.max(15, height * 0.8)}%` : '20%',
            animationDelay: `${idx * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
};
