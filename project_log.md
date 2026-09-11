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
