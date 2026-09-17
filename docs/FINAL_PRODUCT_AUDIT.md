# Nexora Final Product Regression & Contract Audit

## 1. Exact References
- **Production FE Starting Main SHA**: `e8374d3cbb46590edb62a34ef19137337a926d40` (includes PR #17 @ `e168ff9aa2500b5d721dd01028cb064085e7ae6e`)
- **Backend Reference SHA**: `f4e60b4e709ce34a552632a9957c2321121e5056` (`qbao0111/nexora-backend` main)
- **Prototype Reference SHA**: `46711620c8f184adcf3fab63b932823eade4a841` (remote `origin/main`, local HEAD `b5ce405dc6a83acc2e5231c6e6f44f4aa71fb8fc`)
- **Audit Branch**: `chore/final-product-audit`

---

## 2. Audited Surfaces
1. **Design Foundation**: Typography, spacing, colors, badges, buttons, cards, modals, and design tokens.
2. **Public / Auth Shell**: / , /pricing, /auth, /forgot-password, /reset-password, navbar, mobile navigation drawer, and session persistence.
3. **Prepare / CV Analysis**: Upload flow (presign -> S3 raw byte PUT -> create resume), extraction status polling, job_targeted vs field_benchmark, quota handling (402 / 429), and reload recovery.
4. **Interview Experience**: Preflight setup (career goal, manual, CV-targeted, JD-targeted), real-time answering, Speech recognition (vi-VN), TTS playback, evaluation progress, 3-question free boundary continuation, and report generation/polling.
5. **Practice Hub**: Practice landing (/practice), mode cards (Interview, Scenario, STAR), recent attempts, and honest zero-state presentation.
6. **Scenario Academy**: Paginated catalogue, filter preservation, scenario attempt runner, evaluation breakdown, retry immutability, and terminal attempt recovery.
7. **STAR Method Drill**: Single natural-language input drill, 4-component backend extraction, detected=false zeroing, improved answer drill, and retry handling.
8. **Competency / Skill Profile**: 13 competencies across 4 categories, server-provided scores and evidence counts, evidence provenance (CV, Interview, Scenario, STAR), and sparse radar safety.
9. **Progress Analytics**: Real-time progress counters, averages preservation (null != 0), recent activities deep-linking, and truthful trend visualizations.
10. **Learning Path**: Milestones, activities, server-generated ordering, status lifecycle (pending, completed, obsolete), safe external links, and manual regeneration.
11. **Next Practice Recommendation**: Server-canonical recommendation, action execution, and fail-closed navigation.
12. **Billing / Entitlements**: Plans, pricing table, fake payments integration, post-payment state refresh, and feature entitlement gating.
13. **Cross-Feature Integration**: Deep links, returnTo path safety, SignalR cache invalidation, and React Query cache hygiene.

---

## 3. Complete Route Inventory

| Route | Classification | Notes & Canonical Destination |
|---|---|---|
| / | ACTIVE_CANONICAL | Public landing page |
| /auth | ACTIVE_CANONICAL | Authentication & login/register |
| /forgot-password | ACTIVE_CANONICAL | Password recovery request |
| /reset-password | ACTIVE_CANONICAL | Password reset token verification |
| /verify-email | ACTIVE_CANONICAL | Email verification handler |
| /pricing | ACTIVE_CANONICAL | Public pricing overview |
| /plans | ACTIVE_CANONICAL | Gated plans selection |
| /public | ACTIVE_CANONICAL | Free tier public dashboard |
| /overview | ACTIVE_CANONICAL | Authenticated user home dashboard |
| /resumes | ACTIVE_CANONICAL | CV management and upload |
| /resume-analyses | ACTIVE_CANONICAL | CV analysis history and launch |
| /resume-analyses/[id] | ACTIVE_CANONICAL | CV analysis detailed report |
| /interviews | ACTIVE_CANONICAL | Interview history list |
| /interviews/new | ACTIVE_CANONICAL | Interview preflight configuration |
| /interviews/[id] | ACTIVE_CANONICAL | Active interview session room |
| /interviews/[id]/report | ACTIVE_CANONICAL | Interview report & feedback |
| /interviews/history | ACTIVE_CANONICAL | Legacy/compat interview list view |
| /practice | ACTIVE_CANONICAL | Practice hub landing |
| /practice/scenarios | ACTIVE_CANONICAL | Scenario catalogue |
| /practice/scenarios/[slug] | ACTIVE_CANONICAL | Scenario workspace & runner |
| /practice/star | ACTIVE_CANONICAL | STAR method drill runner |
| /skill-profile | ACTIVE_CANONICAL | Competency profile & evidence breakdown |
| /learning-path | ACTIVE_CANONICAL | Learning path milestones & activities |
| /analytics | ACTIVE_CANONICAL | Progress & historical analytics |
| /career-goals | ACTIVE_CANONICAL | Career goal configuration |
| /account | ACTIVE_CANONICAL | Profile settings & account details |
| /billing | ACTIVE_CANONICAL | Subscription & billing management |
| /job-descriptions | ACTIVE_CANONICAL | User-created JD history |
| /job-descriptions/[id] | ACTIVE_CANONICAL | Detailed view of saved JD |
| /status | ACTIVE_CANONICAL | System status page |
| /scenarios | LEGACY_REDIRECT | Compatibility re-export -> /practice/scenarios |
| /scenarios/[slug] | LEGACY_REDIRECT | Compatibility re-export -> /practice/scenarios/[slug] |
| /star-builder | LEGACY_REDIRECT | Compatibility wrapper -> /practice/star |
| /interview | LEGACY_REDIRECT | Compatibility re-export -> /interviews/new |
| /interview/room | LEGACY_REDIRECT | Compatibility re-export -> /interviews |
| /cv-analysis | LEGACY_REDIRECT | Compatibility re-export -> /resume-analyses |
| /settings | DEAD | Replaced by canonical /account |
| /job-descriptions/new | DEAD | Non-existent; resolved to /interviews/new with JD context |

---

## 4. Contract Matrix

| Frontend Service / Hook | FE Route | Backend Controller / Route | Backend DTO | Status |
|---|---|---|---|---|
| authApi.login / register | /auth | POST /api/v1/auth/login / register | AuthResponse | MATCH |
| authApi.bootstrap | Root / Layout | GET /api/v1/auth/me | CurrentUserResponse | MATCH |
| cvAnalysisApi.presignUpload | /resumes | POST /api/v1/resumes/presign | PresignUploadResponse | MATCH |
| cvAnalysisApi.createResume | /resumes | POST /api/v1/resumes | ResumeView | MATCH |
| cvAnalysisApi.analyzeResume | /resume-analyses | POST /api/v1/cv-analysis/analyze | AnalyzeResumeResponse | MATCH |
| cvAnalysisApi.getAnalysis | /resume-analyses/[id] | GET /api/v1/cv-analysis/{id} | ResumeAnalysisDetailResponse | MATCH |
| interviewApi.startSession | /interviews/new | POST /api/v1/interviews/start | InterviewSessionStartResponse | MATCH |
| interviewApi.submitAnswer | /interviews/[id] | POST /api/v1/interviews/{id}/answer | AnswerResponse | MATCH |
| interviewApi.continueSession | /interviews/[id] | POST /api/v1/interviews/{id}/continue | ContinueResponse | MATCH |
| interviewApi.getReport | /interviews/[id]/report | GET /api/v1/interviews/{id}/report | InterviewReportResponse | MATCH |
| scenariosApi.list | /practice/scenarios | GET /api/v1/scenarios | PaginatedList<ScenarioSummaryResponse> | MATCH |
| scenariosApi.getDetail | /practice/scenarios/[slug] | GET /api/v1/scenarios/{idOrSlug} | ScenarioDetailResponse | MATCH |
| scenariosApi.startAttempt | /practice/scenarios/[slug] | POST /api/v1/scenarios/{id}/attempts | ScenarioAttemptResponse | MATCH |
| starApi.startAttempt | /practice/star | POST /api/v1/star/attempts | StarAttemptResponse | MATCH |
| skillProfileApi.getProfile | /skill-profile | GET /api/v1/competencies/profile | CompetencyProfileResponse | MATCH |
| learningPathApi.getPath | /learning-path | GET /api/v1/learning-paths/current | LearningPathResponse | MATCH |
| learningPathApi.completeActivity | /learning-path | PATCH /api/v1/learning-paths/activities/{id} | LearningPathActivityResponse | MATCH |
| recommendationsApi.getNextPractice | /practice, /analytics | GET /api/v1/recommendations/next-practice | NextPracticeRecommendationResponse | MATCH |
| progressApi.getDashboard | /analytics, /overview | GET /api/v1/progress/dashboard | ProgressDashboardResponse | MATCH |
| careerProfileApi.getProfile | /career-goals | GET /api/v1/career-profile | CareerProfileResponse | MATCH |
| billingApi.getPlans | /billing, /pricing | GET /api/v1/billing/plans | SubscriptionPlanResponse[] | MATCH |

---

## 5. Cross-Feature Deep-Link Matrix

| Source Surface | Target Surface | Resolver / Deep Link | Verification Result |
|---|---|---|---|
| CV Analysis Detail | Interview Preflight | /interviews/new?resumeId={id} | MATCH & Verified |
| Interview Report | Practice Hub | /practice | MATCH & Verified |
| Interview Report | Practice Again (New Session) | /interviews/new?retryFrom={id} | MATCH & Verified |
| Practice Hub Cards | Interview / Scenario / STAR | /interviews/new, /practice/scenarios, /practice/star | MATCH & Verified |
| Scenario Complete | Scenario Catalogue / Retry | /practice/scenarios, fresh attempt POST | MATCH & Verified |
| STAR Complete | STAR Practice Again | Reset attempt state -> /practice/star | MATCH & Verified |
| Skill Profile Evidence | CV / Interview / Scenario / STAR | Direct links to canonical routes | MATCH & Verified |
| Learning Path Activity | Scenario | /practice/scenarios/{resourceId} or /practice/scenarios | MATCH & Verified |
| Learning Path Activity | STAR Drill | /practice/star | MATCH & Verified |
| Learning Path Activity | Interview | /interviews/new | MATCH & Verified |
| Learning Path Activity | Resume Improvement | /resumes | MATCH & Verified |
| Learning Path Activity | External Learning | activity.externalUrl (or null if missing) | MATCH & Verified |
| Progress Recent Activity | Interview | /interviews/{resourceId} | MATCH & Verified |
| Progress Recent Activity | Scenario | /practice/scenarios (attemptId not slug) | MATCH & Verified |
| Progress Recent Activity | STAR | /practice/star?attempt={resourceId} | MATCH & Verified |
| Career Onboarding Banner | Profile Settings | /account (fixed dead link to /settings) | RESOLVED |
| Job Descriptions Index | New JD Creation | /interviews/new (fixed dead link to /job-descriptions/new) | RESOLVED |

---

## 6. Findings by Severity & Resolutions

### Total Findings:
- **BLOCKER**: 0
- **HIGH**: 0
- **MEDIUM**: 2 (2 Fixed)
- **LOW / NIT**: 4 (Documented / Verified)

### Medium Findings (Fixed):
1. **Broken Link to /settings in Career Profile Onboarding**:
   - *Issue*: In src/components/features/career/CareerProfileSection.tsx, a CTA navigated to /settings, which is a 404.
   - *Resolution*: Updated to canonical route /account.
2. **Dead Button + Thêm JD mới in Job Descriptions Index**:
   - *Issue*: In src/app/(dashboard)/job-descriptions/page.tsx, clicking the button routed to non-existent /job-descriptions/new.
   - *Resolution*: Updated to route to /interviews/new with label + Tạo phỏng vấn với JD.

### Low / Nit Items (Maintained / Deferred):
1. **Compatibility Routes Maintained**:
   - /scenarios, /scenarios/[slug], and /star-builder are retained as thin compatibility wrappers to prevent bookmark breakage.
2. **Tailwind / ESLint Warnings**:
   - 192 pre-existing unused expressions in generated animation/Tailwind chunks; zero lint errors introduced.
3. **Typeless package.json Warning in node:test**:
   - Warning regarding MODULE_TYPELESS_PACKAGE_JSON emitted by Node v25; non-breaking and tests pass cleanly.

---

## 7. Domain Verdicts
- **Auth**: VERIFIED — HttpOnly refresh tokens, silent refresh, open-redirect protection with isValidInternalPath.
- **Billing**: VERIFIED — Authoritative backend plans, entitlement checks via backend error codes, fake payment sandbox callback.
- **CV Analysis**: VERIFIED — S3 direct upload, job_targeted and field_benchmark workflows, reload and retry idempotency preserved.
- **Interview**: VERIFIED — Same-session continuation on upgrade, speech recognition (vi-VN), TTS fallback, immutable completed attempts.
- **Practice Hub**: VERIFIED — Honest empty states for zero-data users, no mock stats, clean route handoffs.
- **Scenario Academy**: VERIFIED — Server pagination, attempt state machine adherence, immutable source attempts on retry.
- **STAR Method Drill**: VERIFIED — Single natural text input, 4-component backend extraction, detected=false zeroing.
- **Competency / Skill Profile**: VERIFIED — 13 backend competencies, score ranges 0-100 preserved, null scores not collapsed to zero.
- **Progress Analytics**: VERIFIED — Real historical trends only when >= 2 data points exist, null averages preserved.
- **Learning Path**: VERIFIED — Server-ordered milestones, status lifecycle (pending, completed, obsolete), safe external links.
- **Next Recommendation**: VERIFIED — Server-driven recommendation, fail-closed deep links, neutral fallback on empty.
- **SignalR**: VERIFIED — SignalR events trigger React Query REST refetches; REST remains canonical state.
- **React Query**: VERIFIED — Scoped cache keys with resource IDs, bounded retry logic, no infinite refetch loops.
- **Idempotency**: VERIFIED — Deterministic key reuse on transport retry, key regeneration on explicit intent change.
- **Null vs Zero**: VERIFIED — Genuine zero (0) distinct from unassessed/missing (null) across all models.
- **Responsive Web**: VERIFIED — Fluid layouts from 390px to 1440px+, internal modal scrolling for 390x700 mobile viewports.
- **Accessibility**: VERIFIED — Native buttons, aria-live for polling/progress, keyboard navigation, and prefers-reduced-motion support.
- **Mock / Dead Code**: VERIFIED — No prototype mocks in runtime paths, zero fake delays or simulated user data.
- **Security-Adjacent**: VERIFIED — All external links use rel="noopener noreferrer", strict internal redirect whitelist, zero client-side secret exposure.

---

## 8. Verification & Test Execution
- **Unit & Contract Tests**: 248 passed across 13 test files (0 failures, 0 skipped).
- **TypeScript Typecheck**: npx tsc --noEmit PASSED with zero errors.
- **Linting**: 0 errors, 192 pre-existing style warnings.
- **Next.js Production Build**: npm run build PASSED with all 40 routes rendered successfully.
- **Git Diff Hygiene**: git diff --check completely clean.

---

## 9. Residual Product Risks & Backend Gaps
1. **Backend Gap — Scenario Attempt ID vs Slug**:
   - In ProgressDashboardResponse.historicalStats.recentActivity, resourceId for scenario activity is ScenarioAttempt.Id, which cannot be used directly in /practice/scenarios/[slug]. The FE safely maps this to /practice/scenarios.
2. **Backend Gap — Recommendation External URLs**:
   - NextPracticeRecommendationResponse currently omits an externalUrl field for external learning activities. The FE safely fails closed by returning null instead of synthesizing speculative URLs.

---

## 10. Final Recommendation
**READY_FOR_PRODUCTION** (Pending reviewer sign-off on PR; DO NOT MERGE).
