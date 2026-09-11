# Manual E2E checklist — B7 Scenario / B8 STAR / B9 Career Goals

Backend main under test: `5fb57dddc09d84649211b85b30e67f8583e51057`.
Backend is authoritative. All endpoints require auth; errors surface `code` and `requestId`.

## B7 — Scenario practice
1. Log in, open `/dashboard/scenarios`.
2. Confirm the progress overview and the scenario grid load (or a clear error/empty state).
3. Filter by category / difficulty / competency / search; confirm pagination resets to page 1.
4. Open a scenario (`/dashboard/scenarios/{slug}`).
5. Confirm the briefing content and meta (category, difficulty, competency, estimated minutes) render.
6. In the answer box, type a response and click `Nộp bài & Chấm điểm AI`. Confirm no auto-submit.
7. Confirm the attempt moves to `queued`/`processing`, polling updates it, then `completed`.
8. Confirm the evaluation renders actual backend fields: overall score, dimensions (criterion/score/evidence/feedback), strengths, gaps, recommended approach, feedback.
9. Refresh the page; confirm history loads with attempt number, score, delta and the attempt persists.
10. On a completed attempt, click `Thử lại tình huống`; confirm a new draft attempt is created for the SAME scenario (no new scenario) with a fresh idempotency key.

## B8 — STAR story practice
1. Open `/dashboard/star-builder`.
2. Enter a question and a full STAR answer; submit. Confirm status polling `queued -> processing -> completed`.
3. Confirm all four components render with: detected state, score, grounded evidence, and feedback.
4. Confirm the score scale shows `0-100` and the overall score is the backend value (not recomputed).
5. Submit a weak/non-STAR answer; confirm `applicable=false` shows the neutral non-STAR message and no fabricated components.
6. If a scenario is opened via `?scenario=...`, confirm the scenario question is used and the scenario attempt evaluation path renders.
7. Confirm `missingElements`, `strengths`, and `coachingTips` render when present.

## B9 — Career goals
1. Open `/dashboard/career-goals`.
2. Confirm empty state when there are no goals.
3. Create a goal: target role (required), seniority (required), industry, target company, target date. Save.
4. Refresh; confirm the created goal persists.
5. Click `Chỉnh sửa`, change only one field (e.g. target role), save; confirm other fields are unchanged after refresh.
6. Click `Lưu trữ`; confirm the goal becomes inactive (`Tạm dừng`) and persists after refresh.
7. Click `Kích hoạt lại`; confirm it returns to active.
8. Confirm server errors show message and, when present, `Mã lỗi` / `Mã yêu cầu (Request ID)`.

## Cross-cutting
- Unauthenticated: opening any of the three routes while logged out redirects to `/auth` (auth bootstrap), and no protected data is fetched.
- Backend error: force an error (e.g. invalid payload) and confirm the UI shows the backend message; request id is visible where the backend provides one.
- Mobile: check the three pages at a narrow viewport; layout must remain usable (not catastrophic).
- Realtime: completing a scenario/STAR attempt should auto-refresh without manual reload via SignalR `resourceChanged`.
