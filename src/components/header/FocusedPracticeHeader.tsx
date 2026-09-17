'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface FocusedPracticeHeaderProps {
  title?: string;
  subtitle?: string;
  stepInfo?: string;
  statusLabel?: string;
  onExit: () => void;
}

export const FocusedPracticeHeader: React.FC<FocusedPracticeHeaderProps> = ({
  title,
  subtitle,
  stepInfo,
  statusLabel,
  onExit,
}) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-outline-variant/40 shadow-[0_1px_6px_rgba(15,23,42,0.02)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Exit button & Brand */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Thoát phiên luyện"
              onClick={() => setShowExitConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Thoát phiên luyện</span>
            </button>

            <div className="h-4 w-px bg-outline-variant/40 hidden sm:block" />

            <div>
              <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span>{title}</span>
                {stepInfo && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
                    {stepInfo}
                  </span>
                )}
              </div>
              {subtitle && (
                <div className="text-xs text-on-surface-variant">{subtitle}</div>
              )}
            </div>
          </div>

          {/* Right: AI Coaching Indicator */}
          {statusLabel && <div className="flex items-center gap-3">
            <div role="status" aria-live="polite" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="hidden sm:inline font-medium">{statusLabel}</span>
            </div>
          </div>}
        </div>
      </header>

      {/* Exit confirmation modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Rời phòng phỏng vấn?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Bạn đang trong phiên luyện tập tập trung. Tiến trình câu trả lời của các câu trước đã được lưu an toàn. Bạn có muốn quay về màn hình chính?
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowExitConfirm(false)}>
              Ở lại luyện tập
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowExitConfirm(false);
                onExit();
              }}
            >
              Xác nhận rời phòng
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
