import React from 'react';

export type InterviewPresenceState = 'idle' | 'speaking' | 'listening' | 'thinking';

const PRESENCE_LABELS: Record<InterviewPresenceState, string> = {
  idle: 'Sẵn sàng cho câu trả lời của bạn',
  speaking: 'AI đang hỏi',
  listening: 'Đang lắng nghe bạn',
  thinking: 'Đang phân tích câu trả lời...',
};

export interface AiInterviewerPresenceProps {
  state: InterviewPresenceState;
  interviewerName?: string;
  roleLabel?: string;
}

export const AiInterviewerPresence: React.FC<AiInterviewerPresenceProps> = ({
  state,
  interviewerName = 'Nexora AI',
  roleLabel = 'Người phỏng vấn của bạn',
}) => {
  return (
    <div className="ai-presence" data-state={state}>
      <div className="ai-orb" aria-hidden="true">
        <span className="ai-orb-ring" />
        <span className="material-symbols-outlined ai-orb-symbol">auto_awesome</span>
        <div className="ai-presence-bars">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <h1 className="text-xl font-bold">{interviewerName}</h1>
      <p className="ai-participant-role">{roleLabel}</p>
      <p className="ai-presence-status" role="status" aria-live="polite">
        <span />
        {PRESENCE_LABELS[state]}
      </p>
    </div>
  );
};

export default AiInterviewerPresence;
