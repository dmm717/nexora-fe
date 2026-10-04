import React, { useEffect, useRef } from 'react';
import { MascotVisual } from '@/components/brand/MascotVisual';

export type InterviewPresenceState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'error';

const PRESENCE_LABELS: Record<InterviewPresenceState, string> = {
  idle: 'Sẵn sàng cho câu trả lời của bạn',
  speaking: 'AI đang hỏi',
  listening: 'Đang lắng nghe bạn',
  thinking: 'Đang phân tích câu trả lời...',
  error: 'Cần kiểm tra lại trước khi tiếp tục',
};

export interface AiInterviewerPresenceProps {
  state: InterviewPresenceState;
  interviewerName?: string;
  roleLabel?: string;
  statusLabel?: string;
}

export const AiInterviewerPresence: React.FC<AiInterviewerPresenceProps> = ({
  state,
  interviewerName = 'Nexora AI',
  roleLabel = 'Người phỏng vấn của bạn',
  statusLabel,
}) => {
  const presence = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = presence.current;
    if (!element) return;
    let inView = true;
    const update = () => { element.dataset.visualActive = String(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return (
    <div ref={presence} className="ai-presence" data-state={state}>
      <div className="ai-mascot">
        <MascotVisual state={state} sizes="(max-width: 600px) 112px, 220px" priority />
      </div>
      <div className="ai-presence-bars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
      </div>
      <h1 className="text-xl font-bold">{interviewerName}</h1>
      <p className="ai-participant-role">{roleLabel}</p>
      <p className="ai-presence-status" role="status" aria-live="polite">
        <span />
        {statusLabel ?? PRESENCE_LABELS[state]}
      </p>
    </div>
  );
};

export default AiInterviewerPresence;
