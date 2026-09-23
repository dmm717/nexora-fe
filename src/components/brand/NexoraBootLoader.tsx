import React from 'react';
import { NexoraLogo } from '@/components/brand/NexoraLogo';

interface NexoraBootLoaderProps {
  message?: string;
  className?: string;
}

export function NexoraBootLoader({
  message = 'Đang khởi tạo phiên làm việc...',
  className = '',
}: NexoraBootLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-xs select-none ${className}`}
    >
      <div className="flex flex-col items-center gap-5 max-w-xs text-center px-4 animate-in fade-in duration-300">
        <div className="relative">
          <NexoraLogo variant="horizontal" className="h-9 sm:h-10 w-auto object-contain drop-shadow-xs" />
        </div>

        {/* Indeterminate branded progress track */}
        <div className="w-36 h-1 rounded-full bg-outline-variant/30 overflow-hidden relative">
          <div className="nexora-boot-loader-indicator absolute top-0 bottom-0 rounded-full bg-primary" />
        </div>

        {message && (
          <p className="text-xs font-medium text-on-surface-variant tracking-wide">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default NexoraBootLoader;
