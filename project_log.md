# Nexora FE Project Log

## 2026-09-10 - Scenario Academy v2 corrective pass

- Branch: `feat/scenario-academy-v2`
- Baseline: `7f6e192fa4a803358c01f89b770ab4e30daa461d`
- Scope: resumed the existing corrective worktree; hardened Scenario Academy token scoping, terminal-attempt recovery, server-side pagination, catalogue/detail/progress error states, nullable API contracts, realtime invalidation mapping, truthful draft UX, and focused node:test coverage.
- Backend contract checked against `origin/main`: scenario attempt and STAR attempt realtime events, retry endpoint, paginated catalogue, progress response, and nullable attempt fields.
- Provider/route/auth architecture unchanged. No backend or production deployment changes.
- Validation: `npm test` 11 passed; `npx tsc --noEmit` passed; touched-file ESLint passed; `npm run build` passed; `git diff --check` clean. `npx react-doctor@latest --verbose --scope changed` completed with 16 existing maintainability/accessibility/performance warnings in the large Scenario components and controlled filter formatting.
- Repository-wide `npm run lint` still reports 6 pre-existing errors outside this change (`star-builder`, `fake-payments`, `ClientDate`) plus warnings; no Scenario Academy lint errors were introduced.
- Commit: `fix(scenarios): harden academy practice UX` (single corrective commit; SHA is recorded in git history).
- Blockers: none known; branch push is pending. Do not merge this branch.

## 2026-09-11 - CV / Resume Analysis production contract integration (PR 1)

- Branch: `feat/cv-analysis-production-integration`
- Baseline: `7cb7b5cea9c02a5362ae935e9fa28b88b9e4effa` (`origin/main`)
- Backend SHA verified against: `2a8638cff554eea6be7cd8b35001732e656695a9` (`qbao0111/nexora-backend:main`)
- Scope:
  - A2 production upload flow: preserved existing presigned upload flow (`POST /uploads/presign` -> direct PUT with `credentials: 'omit'` -> `POST /resumes` -> `GET /resumes/{id}` with SignalR + fallback polling). Aligned `ResumeView` type with backend schema (removed required `uploadToken` & `originalFileName`).
  - A4 CV Analysis v2 modes: implemented first-class support for `job_targeted` and `field_benchmark` modes.
    - Removed client-side prompt engineering (`REPORT_LANGUAGE_INSTRUCTION` deletion); raw JD is passed cleanly.
    - `job_targeted` mode payload: `{ resumeId, mode: 'job_targeted', jobDescriptionId }`. Results map `matchScore` (0-100), 5 canonical breakdown dimensions (`technicalSkillMatch`, `experienceRelevance`, `impactEvidence`, `clarity`, `structure`), and matched/missing skill badges.
    - `field_benchmark` mode payload: `{ resumeId, mode: 'field_benchmark', industry, targetRole, seniority }`. Bypasses Job Description creation entirely. Results map `readinessScore` (0-100) and 6 canonical breakdown dimensions (`technicalFoundation`, `projectEvidence`, `experiencePresentation`, `impactAchievements`, `clarity`, `roleAlignment`).
    - Stale inputs from inactive modes are stripped before dispatch.
  - A5 Free CV Analysis quota UX: handled `FEATURE_QUOTA_EXCEEDED` and `FEATURE_NOT_AVAILABLE` (403) deterministically. Non-retried, non-persisted user message banner with server `requestId` and upgrade CTA linking to `/dashboard/billing`, preserving user form inputs.
- Backward-compatible migration:
  - `useResumeAnalysisHistory` transparently migrates un-moded legacy pending records (`jdTitle` + `jdContent`) to `mode: 'job_targeted'`, prunes expired records (> 1 hour) and invalid user records, and persists back cleanly.
  - `AnalysisHistoryItem` records mode and metadata (`targetRole`, `seniority`, `industry`) for faithful rendering without mislabeling benchmark items as job descriptions.
- Test coverage added:
  - `tests/cvAnalysisProductionContract.test.mjs`: 12 pure contract tests verifying mode dispatch payloads, JD bypass for benchmark, JD reuse for targeted recovery, idempotency key replay, legacy schema migration, expiration handling, 5-dimension and 6-dimension score extraction, quota non-bypass, deterministic error handling, and inactive form field stripping.
- Validation:
  - `npm test`: 23 passed (12 new CV contract tests + 11 scenario tests).
  - `npx tsc --noEmit`: passed with 0 errors.
  - Touched files ESLint (`src/services/cvAnalysisApi.ts`, `src/services/resumeAnalysisCoordinator.ts`, `src/hooks/useResumeAnalysisHistory.ts`, `src/app/dashboard/resumes/page.tsx`, `src/app/dashboard/resume-analyses/[id]/page.tsx`): 0 errors, 0 warnings.
  - `npm run build`: compiled successfully with Turbopack, all 33 static/dynamic routes generated.
  - `git diff --check`: clean.
- Commit: `feat(cv): integrate production analysis modes`
- Blockers: none. Backend untouched.

### Corrective Pass (Review Blockers 1-4)
- Fixed A5 Quota/Feature UX semantics: removed hardcoded client-side tier assumptions ("1 lượt/tài khoản", "miễn phí"); formatted authoritative plan-neutral titles and messages for `FEATURE_QUOTA_EXCEEDED` ("Đã hết lượt phân tích CV", "Bạn đã sử dụng hết lượt phân tích CV của gói hiện tại.") and `FEATURE_NOT_AVAILABLE` ("Tính năng chưa khả dụng", "Tính năng phân tích CV không khả dụng trong gói hiện tại của bạn.").
- Fixed reload recovery UI: synchronized visible form state (`mode`, `jdTitle`, `jdContent` or `industry`, `targetRole`, `seniority`) to exact persisted user intent before/while resuming; derived displayed analysis stage text and submit label from the active operation's explicit mode.
- Hardened pending record validation: required nonblank trimmed inputs (`jdTitle`/`jdContent` for job_targeted, `industry`/`targetRole`/`seniority` for field_benchmark); safely pruned malformed records.
- Refactored pure contract logic into importable `src/services/cvAnalysisContract.ts`; rewrote `tests/cvAnalysisProductionContract.test.mjs` to test real production functions directly; eliminated fictional local quota boolean test.
- Validation: `npm test` 23 passed, `npx tsc --noEmit` 0 errors, touched files ESLint 0 errors/0 warnings, `npm run build` passed, `git diff --check` clean.

## 2026-09-11 - Interview Production Integration (A6 + A7 + A8 + A9)

- Branch: `feat/interview-production-integration`
- Baseline: `277bc1c50df752cf0d7a1e4de4f7805fa905c4e6` (merge commit of PR #4 on `origin/main`)
- Backend SHA verified against: `2a8638cff554eea6be7cd8b35001732e656695a9` (`qbao0111/nexora-backend:main`)
- Scope:
  - A6 interview contract v1: aligned TypeScript models and API client with backend `PracticeContracts.cs` and `InterviewsController.cs`. Integrated canonical lifecycle `draft → starting → active → completing → completed` (plus `failed`/`abandoned`). Added explicit idempotency key support (`idempotencyKey?: string`) across all mutating interview endpoints (`start`, `submitAnswer`, `continue`, `complete`, `retryReport`) with stable intent preservation. Added server-truth question derivation (`getCurrentQuestion`, `getAnsweredQuestions`).
  - A7 free Q1–Q3 + same-session paid continuation: handled backend `InterviewContinuationView` (`in_progress`, `upgrade_required`, `max_questions_reached`). Guaranteed `shouldAutoComplete` returns `false` when `upgrade_required` even if `nextQuestion` is null. Implemented dual-action UX at `upgrade_required`: Finish Now (`complete()`) vs Upgrade & Continue (`continue()`) with plan-neutral copy ("Nâng cấp gói để tiếp tục"). Ensured continuation preserves the same interview session without resetting or creating new sessions.
  - A8 per-answer coaching: rendered structured STAR scorecards (Situation, Task, Action, Result, missing elements, strengths, coaching tips) when `star.applicable === true`, and generic coaching (strengths, improvements, improved answer with escaped quotes, feedback) when `star.applicable === false`. Maintained backend-owned `0-100` score scale. Defensive helpers guarantee non-crashing UI for partial/missing evaluation fields.
  - A9 production report + report recovery/retry: added `interviewApi.retryReport` (`POST /interviews/${id}/report/retry`). Reconciled `INTERVIEW_REPORT_PROCESSING` and `completing` 404s with bounded fallback polling. Rendered failure banner with "Thử tạo lại báo cáo" CTA on `INTERVIEW_REPORT_FAILED` (409) with stable idempotency without consuming extra interview quota. Rendered full production report data (`overallScore`, `rubric`, `strengths`, `gaps`, `actionPlan`, `starSummary`, `questionReviews`, `sample` partial evaluation banner).
- Out of scope:
  - A10 voice/browser microphone STT explicitly excluded.
  - Backend repository untouched.
- Test coverage added:
  - `tests/interviewProductionContract.test.mjs`: 14 contract and regression tests exercising real production helpers covering `in_progress`, `upgrade_required`, `shouldAutoComplete`, `canFinishNow`, `canUpgradeAndContinue`, same-session continue, server question selection, STAR vs generic presentation, `0-100` score scale, report 404 pending filter, report retry API contract, deterministic error classification, defensive evaluation normalization, and idempotency key reuse.
- Validation:
  - `npm test`: 37 passed (14 new interview contract tests + 12 CV contract tests + 11 scenario tests).
  - `npx tsc --noEmit`: passed with 0 errors.
  - Touched files ESLint: 0 errors, 0 warnings on interview files (1 pre-existing warning in `apiClient.ts`).
  - `npm run build`: compiled successfully with Turbopack, all 33 static/dynamic routes generated.
  - `git diff --check`: clean (0 errors).
- Commit: `feat(interview): integrate production interview and report flow`
- Blockers: none. Backend untouched. PR created against `main` without merging.

### Final Corrective Pass (PR #5)

- Corrective source HEAD re-verified: `44c420a403568c3d3974ab3905b0d199a9017e20` (`feat/interview-production-integration`).
- FE main re-verified: `277bc1c50df752cf0d7a1e4de4f7805fa905c4e6` (`origin/main`).
- Backend main re-verified at newer commit: `e25d4022955ad4a097632926ab725044c829cde0` (`qbao0111/nexora-backend:main`); interview lifecycle, continuation, report shape, and canonical error codes were checked against the current source.
- Scope: focused final correction only; backend, A10 voice/STT, and unrelated CV/scenario/auth work were untouched.
- Blocker 1 fixed: replaced React Query `dataUpdateCount` with a production fallback polling tracker. Actual fallback requests increment once per scheduled cycle, polling remains pending-only, the 8-attempt/15-second bound is enforced, retry cycles and successful reports reset the tracker, and exhaustion has explicit truthful UX with manual refresh/list actions.
- Blocker 2 fixed: added production `canSubmitInterviewAnswer()` and used it for answer UI rendering, textarea/button disabled state, and submit guard. Draft, starting, active, completing, completed, failed, abandoned, and unknown lifecycle states now fail closed or show truthful panels.
- Blocker 3 fixed: all complete actions and auto-complete paths require server-authoritative `canFinishInterview(continuation)`. The answer timer pauses during submission, resumes after a failed submission, and preserves frozen duration/key for unchanged retries while edited answers use the newer elapsed duration.
- Cleanup 1 fixed: this final corrective subsection records current HEAD/base, backend verification, validation evidence, Vercel status, and remaining limitation truthfully.
- Cleanup 2 fixed: narrowed `ReportView` collections to typed arrays and added production `normalizeReportView()` at the API boundary; malformed collection values safely normalize to `[]`.
- Contract cleanup: removed unused client authorization constants (`MINIMUM_REPORT_ANSWERS`, `FREE_QUESTION_LIMIT`) and stale interview error aliases (`INVALID_STATE`, feature quota aliases) from the interview contract.
- Tests: `npm test` passed 48/48 (25 interview, 12 CV, 11 scenario tests). Interview coverage includes production answer/lifecycle eligibility, server-authoritative finish gating, bounded pending-only polling/cycle reset, timer recovery/idempotency, and report normalization.
- TypeScript: `npx tsc --noEmit` passed with 0 errors.
- ESLint: targeted interview validation passed with 0 errors and 0 warnings across the required interview pages, hook, API/contract files, and test file.
- Build: `npm run build` passed with Turbopack; all 33 routes generated.
- Diff check: `git diff --check` passed with no whitespace errors.
- Vercel status: Vercel pending; exact-head hosted deployment was not independently verified in this pass.
- Remaining blockers/limitations: no known local blockers; Vercel exact-head status remains pending. PR #5 must remain open for independent review and must not be merged by this pass.
