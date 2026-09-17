import React from 'react';
import { RubricScore } from '@/services/interviewContract';

export interface CoachingRubricCardProps {
  scores: RubricScore[];
  className?: string;
}

const CRITERION_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  correctness: {
    label: 'Tính chính xác (Correctness)',
    desc: 'Kiến thức kỹ thuật, tính xác thực và không bịa đặt sự thật.',
    icon: 'check_circle',
  },
  structure: {
    label: 'Cấu trúc & Mạch lạc (Structure)',
    desc: 'Bố cục mở - thân - kết, logic mạch lạc, có phương pháp.',
    icon: 'format_list_bulleted',
  },
  completeness: {
    label: 'Độ trọn vẹn (Completeness)',
    desc: 'Bao quát trọn vẹn các vế câu hỏi và khía cạnh nghiệp vụ.',
    icon: 'task_alt',
  },
  clarity: {
    label: 'Độ rõ ràng & Tự tin (Clarity)',
    desc: 'Ngôn từ cô đọng, chuyên nghiệp, không vòng vo.',
    icon: 'record_voice_over',
  },
};

export const CoachingRubricCard: React.FC<CoachingRubricCardProps> = ({ scores, className = '' }) => {
  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (score >= 65) {
      return { bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    return { bg: 'bg-amber-100 text-amber-800 border-amber-300' };
  };

  return (
    <div className={`coaching-rubric-card space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-on-surface">Đánh giá theo 4 tiêu chuẩn Rubric</h4>
        <span className="text-xs text-on-surface-variant">Thang điểm 0 - 100</span>
      </div>

      {scores.length === 0 ? (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant">
          Chưa có điểm rubric cho câu trả lời này.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scores.map((s) => {
            const meta = CRITERION_LABELS[s.criterion] || {
              label: s.criterion,
              desc: '',
              icon: 'analytics',
            };
            const badge = getScoreBadge(s.score);

            return (
              <div
                key={s.criterion}
                className="coaching-rubric-item p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {meta.icon}
                      </span>
                      <span>{meta.label}</span>
                    </div>
                    <span
                      className={`coaching-rubric-score px-2 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      {s.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        s.score >= 80 ? 'bg-emerald-600' : s.score >= 65 ? 'bg-blue-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, s.score))}%` }}
                    />
                  </div>
                </div>

                {s.evidence && (
                  <div className="coaching-rubric-evidence p-2 rounded bg-white/80 border border-outline-variant/30 text-[11px] text-on-surface-variant leading-relaxed">
                    <span className="font-semibold text-on-surface">Bằng chứng: </span>
                    <em>&quot;{s.evidence}&quot;</em>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoachingRubricCard;
