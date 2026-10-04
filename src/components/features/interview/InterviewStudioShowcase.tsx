'use client';

import { useState } from 'react';
import { MicOff, Keyboard, VideoOff, VolumeX, PhoneOff } from 'lucide-react';
import { AiInterviewerPresence, type InterviewPresenceState } from './AiInterviewerPresence';
import { AnswerEditor } from './AnswerEditor';

const states: InterviewPresenceState[] = ['idle', 'speaking', 'listening', 'thinking', 'error'];

/** Development design-system fixture only. No interview IDs, API calls or devices. */
export function InterviewStudioShowcase() {
  const [state, setState] = useState<InterviewPresenceState>('idle');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <section className="space-y-6" aria-label="Kiểm tra giao diện studio">
      <div>
        <h2 className="text-xl font-semibold">9. Nexora Interview Studio · kiểm tra giao diện</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Minh họa tách biệt. Không phải phiên phỏng vấn, không ghi âm, không gửi câu trả lời.</p>
      </div>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Trạng thái minh họa">
        {states.map((value) => <button key={value} type="button" className="rounded-lg px-4 py-3 bg-white border border-outline-variant text-sm" aria-pressed={state === value} onClick={() => setState(value)}>{value}</button>)}
      </div>
      <div className="interview-call-room">
        <section className="interview-call-stage" aria-label="Studio minh họa">
          <div className="interview-stage-meta"><span className="interview-live">Nexora Interview Studio</span><span>Minh họa</span></div>
          <div className="interview-stage-center">
            <AiInterviewerPresence state={state} />
            <div className="interview-live-caption"><span>Câu hỏi minh họa</span><p>Hãy kể về một lần bạn giải quyết vấn đề khó trong dự án. Bạn đã tiếp cận như thế nào?</p></div>
            <details className="interview-coach-tip"><summary>Mẹo trả lời chung</summary><p>Nêu bối cảnh, hành động của bạn và kết quả có thể kiểm chứng.</p></details>
          </div>
          <aside className="interview-self-tile"><strong>Bạn · minh họa</strong><p><VideoOff size={16} /> Camera tắt</p><p><MicOff size={16} /> Microphone tắt</p></aside>
        </section>
        {state === 'error' && <div className="interview-action-error mt-4" role="alert"><div><strong>Chưa thể xử lý yêu cầu · minh họa</strong><p>Bản nháp vẫn được giữ. Chỉ thử lại khi bạn chọn.</p><button type="button" disabled className="interview-call-button mt-3">Thử gửi lại</button></div></div>}
        <div className="interview-controls mt-4">
          <div className="interview-control-tray" role="group" aria-label="Điều khiển minh họa">
            <button type="button" disabled className="interview-mic-button" aria-label="Microphone tắt · minh họa"><MicOff size={20} /></button>
            <button type="button" className="interview-call-button interview-keyboard-button" aria-label="Mở trình nhập minh họa" onClick={() => setEditorOpen(true)}><Keyboard size={20} /></button>
            <button type="button" disabled className="interview-call-button" aria-label="Camera tắt · minh họa"><VideoOff size={20} /></button>
            <button type="button" disabled className="interview-call-button" aria-label="Audio tắt · minh họa"><VolumeX size={20} /></button>
            <button type="button" disabled className="interview-call-button interview-end-button" aria-label="Kết thúc · minh họa"><PhoneOff size={20} /></button>
          </div>
          <p className="interview-dock-status">Các nút thiết bị bị vô hiệu hóa trong bản minh họa.</p>
        </div>
      </div>
      <AnswerEditor isOpen={editorOpen} content={draft} onChange={setDraft} onClose={() => setEditorOpen(false)} onSubmit={() => undefined} disabled />
    </section>
  );
}
