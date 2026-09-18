import React from 'react';
import {
  normalizeSampleInterviewAnswer,
  type SampleAnswerFramework,
  type SampleInterviewAnswer,
} from '@/services/interviewContract';

export interface SampleAnswerCardProps {
  sample: SampleInterviewAnswer;
}

const FRAMEWORK_LABELS: Record<SampleAnswerFramework, string> = {
  star: 'STAR',
  self_intro: 'Giới thiệu bản thân',
  technical: 'Kỹ thuật',
  direct: 'Trả lời trực tiếp',
};

const STAR_SECTIONS = [
  { key: 'situation', label: 'S — Situation / Bối cảnh' },
  { key: 'task', label: 'T — Task / Nhiệm vụ' },
  { key: 'action', label: 'A — Action / Hành động' },
  { key: 'result', label: 'R — Result / Kết quả' },
] as const;

export const SampleAnswerCard: React.FC<SampleAnswerCardProps> = ({ sample }) => {
  const normalizedSample = normalizeSampleInterviewAnswer(sample);
  if (!normalizedSample) return null;

  return (
    <section
      className="coaching-sample-answer rounded-xl border border-indigo-200 bg-white p-4 sm:p-5 space-y-4"
      aria-label="Ví dụ câu trả lời tốt"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h4 className="coaching-sample-answer-title text-sm sm:text-base font-bold text-indigo-950">
            Ví dụ câu trả lời tốt
          </h4>
          <span className="coaching-sample-answer-framework inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-indigo-100 text-indigo-800">
            {FRAMEWORK_LABELS[normalizedSample.framework]}
          </span>
        </div>

        <p className="coaching-sample-answer-disclaimer rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
          Ví dụ minh họa — không phải kinh nghiệm thực tế của bạn.
        </p>
      </div>

      {normalizedSample.framework === 'star' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Cấu trúc STAR minh họa">
            {STAR_SECTIONS.map(({ key, label }) => (
              <div
                key={key}
                className={`coaching-sample-answer-section rounded-lg border p-3.5 bg-slate-50 border-slate-200 ${
                  key === 'action' ? 'coaching-sample-answer-section--action bg-indigo-50 border-indigo-200' : ''
                }`}
              >
                <h5 className="coaching-sample-answer-section-title mb-1.5 text-xs font-bold text-slate-900">
                  {label}
                </h5>
                <p className="coaching-sample-answer-section-copy whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {normalizedSample[key]}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h5 className="coaching-sample-answer-full-answer-title text-xs font-bold text-slate-800">Câu trả lời mẫu hoàn chỉnh</h5>
            <p className="coaching-sample-answer-full-answer whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800">
              {normalizedSample.fullAnswer}
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <h5 className="coaching-sample-answer-full-answer-title text-xs font-bold text-slate-800">Câu trả lời mẫu</h5>
          <p className="coaching-sample-answer-full-answer whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800">
            {normalizedSample.fullAnswer}
          </p>
        </div>
      )}
    </section>
  );
};

export default SampleAnswerCard;
