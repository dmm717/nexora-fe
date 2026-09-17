import React from 'react';

export interface CurrentAnswerCaptionProps {
  content: string;
  listening: boolean;
  onEdit: () => void;
  disabled?: boolean;
}

export const CurrentAnswerCaption: React.FC<CurrentAnswerCaptionProps> = ({
  content,
  listening,
  onEdit,
  disabled = false,
}) => {
  if (!content.trim()) return null;

  return (
    <div className="interview-current-answer" aria-label="Câu trả lời hiện tại chưa nộp">
      <div>
        <strong>Bạn đang trả lời</strong>
        <span>{listening ? 'Đang nghe bạn...' : 'Bản nháp · chưa nộp'}</span>
      </div>
      <p>{content}</p>
      <button
        type="button"
        className="interview-call-button"
        onClick={onEdit}
        disabled={disabled || listening}
        aria-label="Chỉnh sửa câu trả lời nháp bằng bàn phím"
      >
        Chỉnh sửa câu trả lời
      </button>
    </div>
  );
};

export default CurrentAnswerCaption;
