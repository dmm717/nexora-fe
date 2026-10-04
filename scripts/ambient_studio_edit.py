from pathlib import Path
p=Path('src/styles/interview-stage.css')
s=p.read_text(encoding='utf-8')
start=s.index('.interview-call-room { max-width: 1240px;')
s=s[:start]+'''/* Ambient studio: one central stage, participant inset, reachable control dock. */
.product-focused-surface:has(.interview-call-room) {
  background: radial-gradient(ellipse at 18% 10%, #c8d7f7, transparent 55%), radial-gradient(ellipse at 90% 75%, #dae1fa, transparent 55%), #e8effc;
}
.product-focused-surface:has(.interview-call-room) > header { background: #eaf0fbe8; backdrop-filter: blur(18px); border-color: #c2cfe9; }
.interview-call-room { max-width: 1160px; font-size: 16px; color: #172d53; }
.interview-studio-heading { display: flex; justify-content: space-between; align-items: end; gap: 20px; padding: 20px 8px 24px; }
.interview-studio-heading h2 { font-size: 26px; font-weight: 600; letter-spacing: -.045em; color: #172d53; }
.interview-studio-heading p { font-size: 13px; color: #61779a; margin-top: 8px; }
.interview-studio-heading > span { color: #4a638e; font-size: 12px; border-left: 1px solid #b9cae8; padding-left: 18px; }
.interview-call-stage { display: block; min-height: 0; border: 1px solid #bbcdea; border-radius: 26px; background: radial-gradient(ellipse at 50% 8%, #d4e5ff, transparent 60%), linear-gradient(150deg, #e5eefb, #f4f7ff 58%, #dae5f7); box-shadow: 0 24px 80px -40px #335f9c66, inset 0 1px #fff; }
.interview-stage-meta { padding: 18px 26px; border-bottom: 1px solid #bfd0ec; font-size: 11px; color: #5c7196; gap: 12px; }
.interview-live { color: #377060; }
.interview-stage-center { display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 0; padding: 22px 76px 34px; overflow: visible; }
.ai-presence { display: grid; grid-template-columns: 165px minmax(0, 1fr); align-items: center; text-align: left; width: fit-content; max-width: 460px; margin: 0 auto 18px; position: relative; column-gap: 18px; }
.ai-mascot { width: 165px; height: 188px; grid-column: 1; grid-row: 1 / span 4; position: relative; isolation: isolate; }
.ai-mascot::before { content: ''; position: absolute; z-index: -1; inset: 10px -18px -4px; background: radial-gradient(ellipse, #ffffffa8, #9eb7ec55 50%, transparent 72%); }
.ai-mascot img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 14px 16px #314a8128); animation: none; }
.ai-presence h1 { grid-column: 2; font-size: 19px; font-weight: 600; color: #21395e; margin: 0; align-self: end; }
.ai-participant-role { grid-column: 2; font-size: 11px; color: #647ca1; margin: 8px 0; }
.ai-presence-status { grid-column: 2; font-size: 12px; min-height: 28px; line-height: 1.6; justify-content: flex-start; color: #546a92; align-self: start; }
.ai-presence[data-state="speaking"] .ai-presence-status { color: #435fa8; }
.ai-presence[data-state="error"] .ai-presence-status { color: #a13d48; }
.ai-presence-bars { position: absolute; bottom: 32px; left: 183px; color: #637bb7; }
.ai-presence-bars i { background: #627fba; box-shadow: none; }
.interview-live-caption { text-align: center; margin: 0 auto; width: 100%; max-width: 790px; padding-top: 20px; border-top: 1px solid #c8d8f0; }
.interview-live-caption > span { display: block; color: #617a9f; font-size: 11px; margin-bottom: 18px; font-weight: 500; letter-spacing: .035em; }
.interview-live-caption p { font-size: clamp(20px, 1.85vw, 27px); line-height: 1.65; font-weight: 500; letter-spacing: -.025em; color: #1e365b; }
.interview-coach-tip { align-self: start; margin: 18px auto 0; font-size: 12px; max-width: 640px; color: #5a7093; }
.interview-coach-tip summary { justify-content: center; min-height: 44px; }
.interview-self-tile { position: absolute; top: 80px; right: 28px; bottom: auto; width: 146px; padding: 16px 12px; margin: 0; background: #eef4ffb8; border: 1px solid #bacdea; border-radius: 14px; box-shadow: 0 10px 26px -18px #1d4b94; }
.interview-self-tile.interview-self-tile-camera-on { width: 180px; height: 140px; padding: 0; }
.interview-self-avatar { width: 40px; height: 40px; background: #d6e2f7; color: #23426d; margin-bottom: 10px; }
.interview-self-tile strong, .interview-self-tile p, .interview-camera-chip, .interview-answer-duration { font-size: 11px; }
.interview-camera-chip { min-height: 32px; }
.interview-camera-chip:hover { color: #1b33c7; }
.interview-camera-overlay .interview-answer-duration, .interview-camera-candidate-name { color: #fff; }
.interview-current-answer { margin: 0 38px 30px; padding: 20px; background: #f5f8ffe0; border: 1px solid #b8cceb; }
.interview-current-answer > div span { color: #146653; }
.interview-call-stage:has(.interview-current-answer) .interview-stage-center { padding: 22px 76px; }
.interview-call-stage:has(.interview-current-answer) .interview-live-caption { margin-top: 0; }
.interview-controls { position: sticky; bottom: max(16px, env(safe-area-inset-bottom)); z-index: 3; max-width: 570px; margin-inline: auto; padding: 16px 22px; border-radius: 22px; background: linear-gradient(135deg, #1b335d, #14274d); box-shadow: 0 18px 40px -18px #193a72aa, inset 0 1px #6d84b659; }
.interview-control-tray { gap: 12px; }
.interview-control-tray .interview-call-button, .interview-control-tray .interview-mic-button { color: #e9f1ff; background: #2c456f; border-color: #526993; border-radius: 12px; }
.interview-control-tray .interview-call-button:hover:not(:disabled), .interview-control-tray .interview-mic-button:hover:not(:disabled) { background: #3a5688; border-color: #8da6d1; }
.interview-control-tray .interview-mic-button.is-listening { background: #207c68; border-color: #72c4ae; }
.interview-control-tray .interview-keyboard-button.is-active, .interview-control-tray .interview-keyboard-button[aria-pressed="true"], .interview-control-tray .interview-speaker-button.is-speaking, .interview-control-tray .interview-camera-button.is-camera-on { background: #c7d8ff; color: #1b3767; border-color: #c7d8ff; }
.interview-dock-status { font-size: 11px; color: #bacbea; margin-top: 10px; }
.interview-session-transcript { font-size: 14px; padding: 16px 20px; color: #334f7a; border: 1px solid #c6d4ee; border-radius: 14px; background: #edf3ffc7; }
.interview-answer-editor { background: #f0f5ff; border-color: #a8bedf; box-shadow: 0 24px 80px #122e6555; }
.interview-answer-editor textarea { background: #fff; color: #1e365b; border-color: #b9cbe8; }
.interview-editor-heading h2, .interview-answer-editor label, .interview-editor-footer p { font-size: 14px; }
.interview-editor-footer button { color: white; }
.interview-action-error { display: flex; gap: 12px; padding: 20px; background: #fff1ef; border: 1px solid #edc5c0; border-radius: 14px; color: #87312c; font-size: 14px; }
.interview-action-error small { display: block; font-size: 12px; margin-top: 8px; }
.interview-call-room :is(button, summary, textarea):focus-visible { outline: 3px solid #839edd; outline-offset: 4px; }
@media (max-width: 950px) {
  .interview-self-tile { right: 18px; width: 125px; }
  .interview-stage-center { padding: 20px 34px 28px; }
  .ai-presence { margin-left: 8%; }
  .interview-call-stage:has(.interview-current-answer) .interview-stage-center { padding: 20px 34px; }
}
@media (max-width: 600px) {
  .interview-studio-heading { padding: 12px 8px 18px; }
  .interview-studio-heading h2 { font-size: 21px; }
  .interview-studio-heading > span { display: none; }
  .interview-call-stage { border-radius: 20px; }
  .interview-stage-meta { padding: 14px 18px; font-size: 10px; }
  .interview-stage-meta > :last-child { margin-left: auto; }
  .interview-stage-center { padding: 16px 20px 24px; }
  .ai-presence { grid-template-columns: 132px minmax(0, 1fr); column-gap: 12px; text-align: left; margin: 0 0 18px; width: 100%; }
  .ai-mascot { width: 132px; height: 158px; }
  .ai-presence h1 { font-size: 16px; }
  .ai-presence-bars { bottom: 24px; left: 144px; }
  .ai-participant-role { display: none; }
  .ai-presence-status { font-size: 11px; }
  .interview-live-caption { margin-top: 0; padding-top: 20px; text-align: left; }
  .interview-live-caption p { font-size: 20px; line-height: 1.6; }
  .interview-live-caption > span { font-size: 10px; }
  .interview-coach-tip { margin: 12px 0 0; }
  .interview-coach-tip summary { justify-content: flex-start; }
  .interview-self-tile { position: static; width: auto; margin: 0 20px 20px; padding: 12px; display: block; }
  .interview-self-tile-content { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; text-align: left; gap: 0 10px; }
  .interview-self-avatar { width: 36px; height: 36px; grid-row: 1 / span 3; margin: 0; }
  .interview-self-name, .interview-self-subtle-status, .interview-self-mic-status { grid-column: 2; }
  .interview-answer-duration { grid-column: 3; grid-row: 1 / span 3; }
  .interview-self-tile.interview-self-tile-camera-on { width: calc(100% - 40px); max-width: none; height: 180px; margin: 0 20px 20px; }
  .interview-current-answer { margin: 0 20px 20px; }
  .interview-call-stage:has(.interview-current-answer) .interview-stage-center { padding: 16px 20px 24px; }
  .interview-controls { padding: 14px 10px; border-radius: 18px; }
  .interview-control-tray { gap: 9px; }
  .interview-session-transcript { padding: 14px; font-size: 12px; }
}
'''
p.write_text(s,encoding='utf-8')
