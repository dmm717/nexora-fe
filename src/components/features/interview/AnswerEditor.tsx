'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface AnswerEditorProps {
  isOpen: boolean;
  content: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  listening?: boolean;
}

export const AnswerEditor: React.FC<AnswerEditorProps> = ({
  isOpen,
  content,
  onChange,
  onClose,
  onSubmit,
  disabled = false,
  listening = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (isOpen) {
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        previousActiveElement.current = document.activeElement;
      }
      if (!el.open) {
        el.showModal();
        const textarea = el.querySelector('textarea');
        textarea?.focus({ preventScroll: true });
      }
    } else {
      if (el.open) {
        el.close();
      }
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      if (el.open) el.close();
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="interview-answer-editor"
      aria-labelledby="interview-editor-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="interview-editor-heading">
        <h2 id="interview-editor-title">Phụ đề câu trả lời của bạn · {words} từ</h2>
        <button
          type="button"
          className="interview-call-button"
          onClick={onClose}
          aria-label="Đóng trình chỉnh sửa"
        >
          Đóng
        </button>
      </div>

      <label htmlFor="interview-answer-draft">Câu trả lời hiện tại</label>
      <textarea
        id="interview-answer-draft"
        value={content}
        readOnly={listening}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập câu trả lời thực tế của bạn..."
      />

      <div className="interview-editor-footer">
        <p>
          {listening
            ? 'Dừng nói để chỉnh sửa trước khi nộp.'
            : 'Có thể sửa trước khi nộp. Đóng vẫn giữ bản nháp.'}
        </p>
        <button
          type="button"
          className="interview-call-button"
          disabled={!content.trim() || disabled || listening}
          onClick={onSubmit}
          aria-label="Nộp câu trả lời"
        >
          Nộp câu trả lời
        </button>
      </div>
    </dialog>,
    document.body
  );
};

export default AnswerEditor;
