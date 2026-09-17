# Nexora Interview Experience Migration

## 1. Production Starting HEAD
- Production FE Starting HEAD: `7f13c418ea71ddcf28d578f79204bedd97bba928`
- Approved Design Foundation ancestor: `0e3ad75bb2123935173d601e0a22578c7a896108` (PR #12)
- Approved Public/Auth ancestor: `3717cd6e45e027b3e742d3405fa2361cbf97cb72` (PR #13)
- Approved Prepare/CV ancestor: `dd1ca97b13138e19b6b91c19b6b88d58623cfe21` (PR #14)

## 2. Prototype Reference HEAD
- Repository: `qbao0111/nexora-prototype`
- Reference HEAD: `b5ce405dc6a83acc2e5231c6e6f44f4aa71fb8fc`

## 3. Backend Reference HEAD
- Repository: `qbao0111/nexora-backend`
- Reference HEAD: `ac6ecb8e2b10ee411be33659b15bfda2a8415abb`

## 4. Route Mapping
| Prototype Screen | Production Route | Description |
|---|---|---|
| `InterviewPreflightScreen.tsx` | `/interviews/new` | Session setup, career goal selector, CV/JD picker, mic tester |
| `InterviewRoomScreen.tsx` | `/interviews/[id]` | Scoped dark Meet-style room, AI presence avatar, answer dock |
| `InterviewQ2CheckpointScreen.tsx` | `/interviews/[id]` (embedded) | Q2 transition CTA: Primary "Tiếp tục Câu 3", Secondary "Kết thúc sớm" |
| `InterviewQ3BoundaryScreen.tsx` | `/interviews/[id]` (Modal) | Q3 boundary modal: Primary "Nhận báo cáo miễn phí", Secondary "Tiếp tục chuyên sâu" |
| `InterviewReportScreen.tsx` | `/interviews/[id]/report` | Full interview report, radial score, 4 rubric axes, STAR breakdown, verbatim answers |
| — | `/interviews/history` | Infinite query history of interview sessions |

## 5. Endpoint Mapping
| Feature / Action | Backend Endpoint | Method | Idempotency |
|---|---|---|---|
| Create / Start Session | `/api/v1/interviews` | POST | `Idempotency-Key` header |
| Fetch Session State | `/api/v1/interviews/{id}` | GET | — |
| Submit Text Answer | `/api/v1/interviews/{id}/answers` | POST | `Idempotency-Key` header |
| Continue Session (Q4+) | `/api/v1/interviews/{id}/continue` | POST | `Idempotency-Key` header |
| Complete / Finish Session | `/api/v1/interviews/{id}/complete` | POST | `Idempotency-Key` header |
| Retry Report Generation | `/api/v1/interviews/{id}/report/retry` | POST | `Idempotency-Key` header |
| Practice Again | `/api/v1/interviews/{id}/practice-again` | POST | `Idempotency-Key` header |
| Fetch Report Data | `/api/v1/interviews/{id}/report` | GET | — |
| List Interviews History | `/api/v1/interviews` | GET | — |

## 6. Interview Type Mapping
The system strictly supports the 7 backend-supported interview types:
1. `technical` — Technical & In-depth domain knowledge
2. `behavioral` — Behavioral scenarios with STAR evaluation
3. `scenario` — Real-world situational response
4. `cv_targeted` — Tailored to uploaded candidate resume
5. `jd_targeted` — Tailored to provided Job Description
6. `motivation_role_fit` — Culture and motivation assessment
7. `self_introduction` — Candidate introductory elevator pitch

## 7. Preflight Semantics
- Preflight configures **this specific session snapshot only**.
- Career Goal and CV-targeted selectors use canonical saved data; manual role/seniority remain visible session inputs.
- Career Goal mode submits only `careerGoalId`; role and seniority are resolved from the selected server snapshot and are never overridden by hidden form defaults.
- Non-CV interview types do not attach a frontend-selected resume. Career Goal mode delegates Primary Resume fallback to the backend, while manual mode sends no resume unless the visible CV-targeted selector is active.
- For `cv_targeted`, the visible selector prefers a ready Primary Resume, otherwise the first ready resume, and submission revalidates that the selected ID is still ready.
- Default difficulty is set to `Medium`.
- Honest validation:
  - `cv_targeted` requires a ready resume (`status === 'ready'`).
  - `jd_targeted` requires a persisted Job Description ID. Users may select an existing JD or create one from title + content before the interview starts.
  - Manual mode requires a non-empty role title.
- Double-click protection is enforced through `getOrCreateStartIntent`.

## 8. Career Goal Mutation Policy
- Editing values in Preflight is **session-scoped by default**.
- It does **NOT** silently mutate the user's persistent Career Profile or Career Goal.
- This migration does not expose a "Save as default" control; preflight edits remain session-only and never mutate Career Goals.

## 9. Session Creation Contract
- Initiated via `POST /api/v1/interviews` with the applicable subset of `{ role, seniority, interviewType, difficulty, resumeId, jobDescriptionId, careerGoalId }`.
- Protected by `Idempotency-Key` header generated via crypto UUID. Retrying unchanged payloads reuses the key; changing inputs mints a new key.
- Server returns canonical `InterviewView` containing unique session ID.

## 10. Answer Submission Contract
- Answers are submitted as **pure trimmed text strings** to `POST /api/v1/interviews/{id}/answers`.
- Payload: `{ questionId: string, content: string, durationSeconds?: number }`.
- Protected by `Idempotency-Key` header.
- Duration is frozen upon first submission attempt so retries do not distort answer metrics.
- Empty content is strictly blocked from submission.
- Duplicate submission is locked while in flight (`submitting || isEvaluating`).

## 11. Speech / STT Architecture
- Speech Recognition is strictly a **client-side UX layer** powered by browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- Default speech language is strictly Vietnamese (`vi-VN`).
- Canonical answer flow: Audio -> Client-side STT -> Editable transcript draft -> User reviews/edits -> Submits plain text to backend.
- No audio blobs, sample arrays, or raw mic streams are transmitted to the backend.
- Switching between Voice and Text modes preserves draft content without clearing.
- Submission is disabled while microphone is actively recording to avoid partial/in-flight clobbering.

## 12. TTS Architecture
- Text-to-Speech is an optional client-side enhancement using browser `window.speechSynthesis` in `vi-VN`.
- No backend TTS endpoint is called.
- If TTS fails or is unsupported, the question text **remains fully visible and readable on screen at all times**.
- Starting microphone capture immediately cancels any active speech synthesis to prevent AI audio from interfering with user speech.

## 13. Q1-Q3 Free Boundary
- Questions 1, 2, and 3 are 100% free for all users.
- Q1 -> Q2: evaluated immediately with Quick Coaching drawer, primary CTA "Tiếp tục Câu 2".
- Q2 -> Q3: evaluated immediately, primary CTA "Tiếp tục Câu 3", secondary "Kết thúc sớm & nhận báo cáo". Q2 does **NOT** paywall Q3.
- After Q3 answer submission & evaluation:
  - Free report is 100% free and ready to view ("Nhận báo cáo miễn phí").
  - Free report is never locked or paywalled.
  - Secondary action offers "Tiếp tục phỏng vấn chuyên sâu".

## 14. Paid Q4+ Continuation
- For users continuing into deep interview questions (Q4+):
  - Continuation operates within the **SAME session ID** via `interviewApi.continue(id)`.
  - No duplicate sessions or cloned database entities are created.
  - If user upgrades, the return marker is consumed once and removed from the URL before the frontend refetches canonical interview state. `/continue` is called at most once, and only when the fresh state is `in_progress` with no pending question.
  - Continuation is gated on server-verified entitlement, never client-only state.

## 15. Entitlement Source
- Derived from server `InterviewContinuationView` (`canFinishNow`, `canUpgradeAndContinue`, `state`). `canUpgradeAndContinue` means the user may upgrade; only `state === 'in_progress'` authorizes `/continue`.
- Does not rely on hardcoded plan codes (`PRO`, `FREE`).

## 16. Unlimited Presentation Behavior
- Q4+ displays a natural count ("Câu hỏi 4", "Câu hỏi 5", etc.) without claiming unlimited entitlement.
- Never displays artificial caps like "4/10" when the entitlement is unlimited.

## 17. Early Finish
- When eligible (`canFinishNow === true`), candidate can finish early after Q2 or during Q4+.
- Calls `POST /api/v1/interviews/{id}/complete`.
- The resulting report only scores answered questions. Unanswered questions are not fabricated with fake 0 scores.
- `max_questions_reached` never calls `/continue`; the room exposes an idempotent completion/report action even after a reload with no active question.

## 18. Retry Semantics
- Transport/network retries reuse the frozen `AnswerIntent` (same `idempotencyKey`, same `durationSeconds`, same trimmed content).
- Retries do not consume extra quota or create duplicate question slots.
- Confirmed `INTERVIEW_REPORT_FAILED` may call report retry. Local polling exhaustion only offers a canonical state refetch and never enqueues a new report job.
- Polling exhaustion takes precedence over a stale local `INTERVIEW_REPORT_PROCESSING` error, so the bounded check-status action remains reachable.

## 19. Report Semantics
- `null != 0` is strictly respected:
  - If a metric or `overallScore` is null / unavailable, the UI renders 'Chưa có điểm' or 'Chưa đủ dữ liệu'. It is **never converted to 0**.
  - A genuine score of 0 renders as 0.
- Report includes candidate's verbatim answer alongside suggested AI improvements.

## 20. Practice Again Semantics
- Triggers `POST /api/v1/interviews/{id}/practice-again` with `{ focus, reason: 'repeat_question' | 'manual', questionId? }`.
- Returns a **NEW linked interview session ID** (`/interviews/${res.id}`).
- The original source interview session remains immutable and untouched.

## 21. Realtime Strategy
- SignalR triggers invalidation of REST queries (`interview`, `interviewReport`) on resource updates.
- REST API is the canonical source of truth for entity state.
- Bounded fallback polling at the configured interval prevents infinite background loops.

## 22. Prototype Mock Behaviors Intentionally Rejected
- `PrototypeContext` was completely rejected.
- Mock question arrays and local timer countdowns were rejected.
- Local client-side scoring simulation was rejected.
- Fake AI delays (`setTimeout(..., 2500)`) were rejected.
- Mock entitlement overrides were rejected in favor of real billing/entitlement API.

## 23. Responsive Implementation Targets
- Desktop (1440px): full dual-tile layout with center AI avatar, candidate status tile, full controls tray.
- Tablet (1024px, 820px): adapted stage center padding, resized candidate tile, responsive drawer.
- Mobile (390px, 390x700): candidate tile rests inline above controls tray, buttons in 2-column grid, controls remain in reachable viewport area without overflowing.
- Safe area inset support: `env(safe-area-inset-bottom)` used for modal dialogs and fixed containers.

## 24. Accessibility Implementation
- Semantic HTML tags (`<main>`, `<section>`, `<aside>`, `<details>`) plus the Foundation Modal's `role="dialog"` and `aria-modal="true"` contract.
- Live regions (`role="status"`, `aria-live="polite"`) on AI presence avatar and answer dock.
- Accessible names and states on microphone button (`aria-label`, `aria-pressed`).
- Keyboard navigation: Full Tab/Shift+Tab trapping, Escape key closing for modals and drawers.
- Focus restoration upon dialog close.
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables orb pulsing, breathing animations, and waveform bouncing.
- These behaviors were verified through source review, automated tests, lint, typecheck, and production build in this corrective; no manual browser verification is claimed.

## 25. Known Gaps
- Web Speech API support varies on non-Chromium browsers (Firefox, Safari); graceful keyboard fallback is provided and indicated in UI.
- Browser `speechSynthesis` voices vary by platform; if no Vietnamese voice is installed locally, text remains displayed on screen without erroring.
