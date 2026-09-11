# Manual E2E checklist — interview A6–A11 (frontend)

Target: Chrome/Chromium on desktop. Backend main `e25d4022955ad4a097632926ab725044c829cde0`.

Voice input is browser-only (Web Speech API). No audio is ever sent to the backend.
The submitted value is always the final text in the answer textarea.

## CASE 1 — Text answer + per-answer coaching (A6/A8/A9)
1. Go to `/dashboard/interviews/new`, create an interview.
2. Observe `starting` screen, then `active`.
3. Answer Q1 by typing. Submit.
4. Confirm Q1 moves to the history with its AI coaching (rubric scores / feedback / strengths / improvements / improved answer, or STAR table if `applicable=true`).
5. Confirm Q2 appears as the current question and the timer reset.

## CASE 2 — Vietnamese voice
1. Chrome. In the answer box, keep language `Tiếng Việt` (vi-VN).
2. Click `🎤 Bắt đầu nói`. Allow microphone permission.
3. Speak. Confirm `● Đang nghe...` and the `Bản nháp giọng nói` preview update (interim text).
4. Click `⏹ Dừng ghi âm`.
5. Confirm final text is appended to the textarea and remains editable. Fix any recognition error manually.
6. Submit. In the network tab confirm `POST /api/v1/interviews/{id}/answers` body contains only `questionId`, `content` (the final edited text), and optional `durationSeconds`. There must be no audio/blob field.

## CASE 3 — English voice
1. Switch the language select to `English` (en-US).
2. Repeat CASE 2 steps 2–6 speaking English.
3. Confirm the same text-only submission payload.

## CASE 4 — Unsupported / denied microphone
1. Deny microphone permission (or use a browser without Web Speech support).
2. Denied: confirm a clear message "Không thể truy cập microphone..." and that typing/submitting still works.
3. Unsupported: confirm mic controls are hidden and the message "Trình duyệt hiện tại chưa hỗ trợ nhập giọng nói..." appears, while the textarea and submit remain fully functional.

## CASE 5 — Free entitlement boundary (A7)
1. Answer Q1, Q2, Q3.
2. After Q3 confirm: no Q4 is generated client-side; the upgrade-required card appears ("Bạn đã đạt giới hạn câu hỏi của gói hiện tại").
3. Confirm `continuation.state = upgrade_required`, `canFinishNow = true`, `canUpgradeAndContinue = true` in the API response.
4. Confirm two actions are available: finish the interview, or upgrade externally then `Đã nâng cấp? Tiếp tục phỏng vấn`.
5. `Tiếp tục phỏng vấn` must call `POST /interviews/{id}/continue` on the SAME interview id (no new session) and the backend decides the next question.

## CASE 6 — Finish flow (A9)
1. After the server allows finishing (`continuation.canFinishNow = true`), click `Nộp bài & Xem báo cáo`.
2. Confirm `POST /interviews/{id}/complete` and status transition `active -> completing -> completed`.
3. Confirm the report page renders overallScore, rubric, strengths, gaps, actionPlan, STAR summary, question reviews, suggested improved answers, partial sample info, disclaimer.
4. Confirm the report GET is polled slowly/bounded while `completing` and stops when the report is ready.

## CASE 7 — Report failure + explicit retry (A9)
1. Simulate/encounter `INTERVIEW_REPORT_FAILED` (409).
2. Confirm polling stops and an explicit retry card is shown.
3. Click `Thử tạo lại báo cáo ngay`.
4. Confirm `POST /interviews/{id}/report/retry` on the SAME interview id, with a stable idempotency key.
5. Confirm interview/report state refreshes after a successful retry.

## CASE 8 — Accepted-answer reconciliation on completion failure
1. Answer the final question that triggers auto-complete (`isComplete=true`, `nextQuestion=null`, `continuation.state=max_questions_reached`).
2. Force `/complete` to fail (e.g. offline briefly).
3. Confirm: the accepted answer stays in the history, the answered question does NOT reappear as unanswered, and the message "Câu trả lời đã được lưu, nhưng chưa thể kết thúc buổi phỏng vấn..." is shown with a request id.
4. Retry via the finish action. Confirm it reuses the SAME completion idempotency key (inspect `Idempotency-Key` header).

## Notes
- Voice is an optional enhancement; the keyboard path must always work.
- A11 is backend Sentry observability. The frontend intentionally adds no Sentry dependency; it only surfaces backend `code`/`message`/`requestId`.
