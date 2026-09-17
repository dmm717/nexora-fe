import React from 'react';
import { AnswerEvaluation } from '@/services/interviewContract';
import { CoachingRubricCard } from './CoachingRubricCard';
import { StarEvaluationCard } from './StarEvaluationCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface QuickCoachingDrawerProps {
  isOpen: boolean;
  coaching: AnswerEvaluation;
  questionSequence: number;
  totalQuestions?: number | null;
  canContinueQuestion?: boolean;
  onContinue: () => void;
  onFinishEarly?: () => void;
  finishEarlyLabel?: string;
  onClose?: () => void;
}

export const QuickCoachingDrawer: React.FC<QuickCoachingDrawerProps> = ({
  isOpen,
  coaching,
  questionSequence,
  totalQuestions = 3,
  canContinueQuestion = true,
  onContinue,
  onFinishEarly,
  finishEarlyLabel,
  onClose = () => {},
}) => {
  // Question progression labels
  let primaryActionLabel = `Tiếp tục Câu ${questionSequence + 1}`;
  if (questionSequence === 1) {
    primaryActionLabel = 'Tiếp tục Câu 2';
  } else if (questionSequence === 2) {
    primaryActionLabel = 'Tiếp tục Câu 3';
  } else if (questionSequence === 3) {
    primaryActionLabel = 'Xem kết quả & Tổng kết phiên 3 câu';
  } else if (!canContinueQuestion) {
    primaryActionLabel = 'Hoàn thành phiên & Xem báo cáo';
  }

  const scores = coaching.scores || [];
  const strengths = coaching.strengths || [];
  const improvements = coaching.improvements || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="coaching-dialog flex flex-col text-slate-900 -m-6 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="coaching-dialog-header px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="coaching-dialog-icon w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="coaching-dialog-title font-bold text-base text-slate-900">
                  Nhận xét nhanh từ Nexora AI
                </h3>
                <span className="coaching-dialog-badge px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Đã đánh giá Câu {questionSequence}
                </span>
              </div>
              <p className="coaching-dialog-subtitle text-xs text-slate-500">
                Phản hồi tức thì giúp bạn nhận diện điểm sáng và cải thiện ngay cho câu tiếp theo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="coaching-dialog-close p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Đóng nhận xét"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="coaching-dialog-body p-6 overflow-y-auto space-y-5">
          {/* Rubric Breakdown */}
          <CoachingRubricCard scores={scores} />

          {coaching.feedback && (
            <div className="coaching-dialog-feedback-note p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              {coaching.feedback}
            </div>
          )}

          {/* STAR Breakdown if applicable */}
          {coaching.star && coaching.star.applicable && (
            <StarEvaluationCard star={coaching.star} />
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="coaching-dialog-strengths p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="coaching-dialog-strengths-title flex items-center gap-2 font-semibold text-xs text-emerald-900 mb-2">
                <span className="coaching-dialog-strengths-icon material-symbols-outlined text-[18px] text-emerald-600">
                  thumb_up
                </span>
                <span>Điểm sáng nổi bật</span>
              </div>
              {strengths.length > 0 ? (
                <ul className="coaching-dialog-strengths-list space-y-1.5 text-xs text-slate-800 leading-relaxed list-disc list-inside">
                  {strengths.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              ) : (
                <p className="coaching-dialog-strengths-empty text-xs text-slate-500">
                  Chưa ghi nhận điểm mạnh có bằng chứng.
                </p>
              )}
            </div>

            {/* Improvements */}
            <div className="coaching-dialog-improvements p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="coaching-dialog-improvements-title flex items-center gap-2 font-semibold text-xs text-amber-900 mb-2">
                <span className="coaching-dialog-improvements-icon material-symbols-outlined text-[18px] text-amber-600">
                  lightbulb
                </span>
                <span>Điểm cần cải thiện</span>
              </div>
              {improvements.length > 0 ? (
                <ul className="coaching-dialog-improvements-list space-y-1.5 text-xs text-slate-800 leading-relaxed list-disc list-inside">
                  {improvements.map((im, i) => (
                    <li key={i}>{im}</li>
                  ))}
                </ul>
              ) : (
                <p className="coaching-dialog-improvements-empty text-xs text-slate-500">
                  Chưa có đề xuất từ bằng chứng hiện có.
                </p>
              )}
            </div>
          </div>

          {/* Suggested Improved Answer */}
          {coaching.improvedAnswer && (
            <div className="coaching-dialog-improved-answer p-4 rounded-xl bg-indigo-50/50 border border-indigo-200">
              <div className="coaching-dialog-improved-answer-title flex items-center gap-2 font-semibold text-xs text-indigo-900 mb-2">
                <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                <span>Gợi ý cách trả lời hoàn thiện hơn (Grounded Coaching)</span>
              </div>
              <p className="coaching-dialog-improved-answer-copy text-xs sm:text-sm text-slate-800 leading-relaxed italic bg-white p-3.5 rounded-lg border border-slate-200">
                &quot;{coaching.improvedAnswer}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="coaching-dialog-footer px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="coaching-dialog-progress text-xs text-slate-500 w-full sm:w-auto text-left">
            {totalQuestions ? (
              <span>Tiến độ: Câu {questionSequence}/{totalQuestions}</span>
            ) : (
              <span>Tiến độ: Câu {questionSequence}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
            {onFinishEarly && (
              <Button
                variant="outline"
                size="md"
                onClick={onFinishEarly}
                className="w-full sm:w-auto text-xs"
              >
                {finishEarlyLabel || 'Kết thúc sớm & nhận báo cáo'}
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={onContinue}
              className="w-full sm:w-auto font-semibold shadow-sm"
              icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              iconPosition="right"
            >
              {primaryActionLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickCoachingDrawer;
