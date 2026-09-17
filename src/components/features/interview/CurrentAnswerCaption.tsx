import React from 'react';

export interface CurrentAnswerCaptionProps {
  content: string;
  listening: boolean;
  onEdit: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
  submitDisabled?: boolean;
}

export const CurrentAnswerCaption: React.FC<CurrentAnswerCaptionProps> = ({
  content,
  listening,
  onEdit,
  onSubmit,
  disabled = false,
  submitDisabled = false,
}) => {
  if (!content.trim()) return null;

  const isSubmitBlocked = disabled || submitDisabled || listening;

  return (
    <div className="interview-current-answer" aria-label="Câu trả lời hiện tại chưa nộp">
      <div>
        <strong>Bạn đang trả lời</strong>
        <span>{listening ? 'Đang nghe bạn...' : 'Bản nháp · chưa nộp'}</span>
      </div>
      <p>{content}</p>
      <div className="interview-current-answer-actions">
        <button
          type="button"
          className="interview-call-button"
          onClick={onEdit}
          disabled={disabled || listening}
          aria-label="Chỉnh sửa câu trả lời nháp bằng bàn phím"
        >
          Chỉnh sửa câu trả lời
        </button>
        {onSubmit && (
          <button
            type="button"
            className="interview-call-button interview-submit-button"
            onClick={onSubmit}
            disabled={isSubmitBlocked}
            aria-label="Nộp câu trả lời trực tiếp"
          >
            Nộp câu trả lời
          </button>
        )}
      </div>
    </div>
  );
};

export default CurrentAnswerCaption;
