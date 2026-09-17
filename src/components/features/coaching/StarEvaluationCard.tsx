import React from 'react';
import { StarEvaluation } from '@/services/interviewContract';

export interface StarEvaluationCardProps {
  star: StarEvaluation;
  className?: string;
}

export const StarEvaluationCard: React.FC<StarEvaluationCardProps> = ({ star, className = '' }) => {
  const components = [
    { key: 'situation', name: 'S — Situation (Bối cảnh)', comp: star.situation, weight: '20%' },
    { key: 'task', name: 'T — Task (Mục tiêu / Nhiệm vụ)', comp: star.task, weight: '20%' },
    { key: 'action', name: 'A — Action (Hành động thực hiện)', comp: star.action, weight: '35%' },
    { key: 'result', name: 'R — Result (Kết quả đạt được)', comp: star.result, weight: '25%' },
  ];

  return (
    <div className={`coaching-star-card p-4 rounded-xl bg-white border border-outline-variant/50 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <span className="material-symbols-outlined text-[18px]">stars</span>
          </span>
          <div>
            <h4 className="font-semibold text-sm text-on-surface">Mô hình phản xạ STAR</h4>
            <p className="text-[11px] text-on-surface-variant">
              Tự động phân tích 4 thành phần phản xạ hành vi
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-on-surface-variant">Điểm STAR: </span>
          <span className="font-bold text-sm text-primary">
            {star.overallScore !== null && star.overallScore !== undefined ? `${star.overallScore}/100` : 'Chưa có'}
          </span>
        </div>
      </div>

      {/* 4 Components */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {components.map(({ key, name, comp, weight }) => {
          const isDetected = comp?.detected ?? false;
          const score = comp?.score ?? 0;

          return (
            <div
              key={key}
              className={`coaching-star-item p-3 rounded-lg border text-xs ${
                isDetected
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-on-surface">{name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isDetected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isDetected ? `${score}đ (${weight})` : 'Chưa thể hiện rõ'}
                </span>
              </div>

              {isDetected && comp?.evidence ? (
                <p className="coaching-star-evidence text-on-surface-variant text-[11px] italic mt-1 bg-white p-1.5 rounded border border-slate-200 line-clamp-2">
                  &quot;{comp.evidence}&quot;
                </p>
              ) : (
                <p className="coaching-star-feedback text-amber-800 text-[11px] mt-1">
                  {comp?.feedback || 'Không phát hiện thành phần này trong câu trả lời.'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Missing Elements Warning */}
      {star.missingElements && star.missingElements.length > 0 && (
        <div className="coaching-star-missing p-2.5 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-2 text-xs text-amber-900">
          <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0 mt-0.5">
            warning
          </span>
          <div>
            <span className="font-semibold">Điểm khuyết thiếu: </span>
            <span>
              Câu trả lời chưa thể hiện rõ ràng phần{' '}
              <strong>{star.missingElements.map((m) => m.toUpperCase()).join(', ')}</strong>. Bổ sung thêm bối cảnh và kết quả cụ thể để nâng cao điểm số.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarEvaluationCard;
