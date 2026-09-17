import React, { useEffect, useId, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const previousOverflow = useRef('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = previousOverflow.current;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedSize = size ?? maxWidth ?? 'md';
  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : 'Hộp thoại'}
        className={`relative w-full ${maxWidthClasses[resolvedSize]} bg-white rounded-2xl shadow-floating border border-outline-variant/60 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200`}
      >
        {title && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/50">
            <div>
              <h2 id={titleId} className="font-bold text-lg text-on-surface">{title}</h2>
              {description && (
                <p id={descriptionId} className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Đóng hộp thoại"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors shrink-0 ml-3"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
