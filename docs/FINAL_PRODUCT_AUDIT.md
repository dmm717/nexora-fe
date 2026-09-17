# Nexora Technical Baseline Regression & Contract Audit

## 1. Exact References
- **Production FE Starting Main SHA**: `e8374d3cbb46590edb62a34ef19137337a926d40` (includes PR #17 @ `e168ff9aa2500b5d721dd01028cb064085e7ae6e`)
- **Backend Reference SHA**: `f4e60b4e709ce34a552632a9957c2321121e5056` (`qbao0111/nexora-backend` main)
- **Prototype Reference SHA**: `46711620c8f184adcf3fab63b932823eade4a841` (remote `origin/main`, local HEAD `b5ce405dc6a83acc2e5231c6e6f44f4aa71fb8fc`)
- **Audit Branch**: `chore/final-product-audit`

---

## 2. Audited Surfaces
1. **Design Foundation**: Typography, spacing, colors, badges, buttons, cards, modals, and design tokens.
2. **Public / Auth Shell**: / , /pricing, /auth, /forgot-password, /reset-password, navbar, mobile navigation drawer, and session persistence.
3. **Prepare / CV Analysis**: Upload flow (presign -> presigned object-storage raw-byte PUT -> create resume), extraction status polling, job_targeted vs field_benchmark, quota handling (402 / 429), and reload recovery.
4. **Interview Experience**: Preflight setup (career goal, manual, CV-targeted, JD-targeted), real-time answering, Speech recognition (vi-VN), TTS playback, evaluation progress, 3-question free boundary continuation, and report generation/polling.
5. **Practice Hub**: Practice landing (/practice), mode cards (Interview, Scenario, STAR), recent attempts, and honest zero-state presentation.
6. **Scenario Academy**: Paginated catalogue, filter preservation, scenario attempt runner, evaluation breakdown, retry immutability, and terminal attempt recovery.
7. **STAR Method Drill**: Single natural-language input drill, 4-component backend extraction, detected=false zeroing, improved answer drill, and retry handling.
8. **Competency / Skill Profile**: Server-derived competency profile grouped from available evidence, server-provided scores and evidence counts, evidence provenance (CV, Interview, Scenario, STAR), and sparse radar safety.
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

## 4. Contract Matrix (Rechecked against Backend Main)

| Frontend Service / Function | FE Route | Backend Controller & Endpoint | Backend DTO | Status |
|---|---|---|---|---|
| authApi.login / register | /auth | AuthController: POST /api/v1/auth/login, POST /api/v1/auth/register | AuthResponse / RegistrationResponse | MATCH |
| userApi.getCurrentUser | Root Layout / App Shell | MeController: GET /api/v1/me | UserResponse | MATCH |
| authSession.requestRefresh | Auth bootstrap / 401 interceptor | AuthController: POST /api/v1/auth/refresh | AuthSessionResponse | MATCH |
| cvAnalysisApi.presignUpload | /resumes | UploadsController: POST /api/v1/uploads/resumes/presign | PresignUploadResponse | MATCH |
| cvAnalysisApi.createResume | /resumes | ResumesController: POST /api/v1/resumes | ResumeView | MATCH |
| cvAnalysisApi.analyze | /resume-analyses | ResumeAnalysesController: POST /api/v1/resume-analyses | ResumeAnalysisView | MATCH |
| cvAnalysisApi.getAnalysis | /resume-analyses/[id] | ResumeAnalysesController: GET /api/v1/resume-analyses/{id} | ResumeAnalysisView | MATCH |
| cvAnalysisApi.getResumeAnalyses | /resume-analyses | ResumeAnalysesController: GET /api/v1/resume-analyses | ResumeAnalysisHistoryResponse | MATCH |
| cvAnalysisApi.createJobDescription | /job-descriptions | JobDescriptionsController: POST /api/v1/job-descriptions | JdView | MATCH |
| cvAnalysisApi.getJobDescriptions | /job-descriptions | JobDescriptionsController: GET /api/v1/job-descriptions | JdView[] | MATCH |
| cvAnalysisApi.getJobDescriptionDetails | /job-descriptions/[id] | JobDescriptionsController: GET /api/v1/job-descriptions/{id} | JdView | MATCH |
| interviewApi.start | /interviews/new | InterviewsController: POST /api/v1/interviews | InterviewView | MATCH |
| interviewApi.getInterviews | /interviews | InterviewsController: GET /api/v1/interviews | InterviewHistoryResponse | MATCH |
| interviewApi.getById | /interviews/[id] | InterviewsController: GET /api/v1/interviews/{id} | InterviewView | MATCH |
| interviewApi.submitAnswer | /interviews/[id] | InterviewsController: POST /api/v1/interviews/{id}/answers | AnswerResult | MATCH |
| interviewApi.continue | /interviews/[id] | InterviewsController: POST /api/v1/interviews/{id}/continue | InterviewView | MATCH |
| interviewApi.complete | /interviews/[id] | InterviewsController: POST /api/v1/interviews/{id}/complete | InterviewView | MATCH |
| interviewApi.retryReport | /interviews/[id] | InterviewsController: POST /api/v1/interviews/{id}/report/retry | InterviewView | MATCH |
| interviewApi.practiceAgain | /interviews/[id]/report | InterviewsController: POST /api/v1/interviews/{id}/practice-again | InterviewView | MATCH |
| interviewApi.getReport | /interviews/[id]/report | InterviewsController: GET /api/v1/interviews/{id}/report | ReportView | MATCH |
| scenarioApi.getScenarios | /practice/scenarios | ScenariosController: GET /api/v1/scenarios | ScenarioPageResponse | MATCH |
| scenarioApi.getCategories | /practice/scenarios | ScenariosController: GET /api/v1/scenarios/categories | ScenarioCategory[] | MATCH |
| scenarioApi.getScenarioDetails | /practice/scenarios/[slug] | ScenariosController: GET /api/v1/scenarios/{idOrSlug} | ScenarioDetail | MATCH |
| scenarioApi.createAttempt | /practice/scenarios/[slug] | ScenarioAttemptsController: POST /api/v1/scenario-attempts | ScenarioAttempt | MATCH |
| scenarioApi.submitAttempt | /practice/scenarios/[slug] | ScenarioAttemptsController: POST /api/v1/scenario-attempts/{id}/submit | ScenarioAttempt | MATCH |
| scenarioApi.getAttempt | /practice/scenarios/[slug] | ScenarioAttemptsController: GET /api/v1/scenario-attempts/{id} | ScenarioAttempt | MATCH |
| starBuilderApi.submitAttempt | /practice/star | StarAttemptsController: POST /api/v1/star-attempts | StarAttemptResponse | MATCH |
| starBuilderApi.getAttempt | /practice/star | StarAttemptsController: GET /api/v1/star-attempts/{id} | StarAttemptResponse | MATCH |
| starBuilderApi.listRecentAttempts | /practice/star | StarAttemptsController: GET /api/v1/star-attempts | StarAttemptResponse[] | MATCH |
| skillProfileApi.getProfile | /skill-profile | SkillProfileController: GET /api/v1/skill-profile | SkillProfileResponse | MATCH |
| learningPathApi.get | /learning-path | LearningPathController: GET /api/v1/learning-path | LearningPathResponse | MATCH |
| learningPathApi.generate | /learning-path | LearningPathController: POST /api/v1/learning-path | LearningPathResponse | MATCH |
| learningPathApi.refresh | /learning-path | LearningPathController: POST /api/v1/learning-path/refresh | LearningPathResponse | MATCH |
| learningPathApi.completeActivity | /learning-path | LearningPathController: PATCH /api/v1/learning-path/activities/{activityId} | LearningPathResponse | MATCH |
| recommendationsApi.getNext | /practice, /analytics | RecommendationsController: GET /api/v1/recommendations/next | NextPracticeRecommendationResponse | MATCH |
| progressApi.getProgressAnalytics | /analytics | ProgressController: GET /api/v1/progress | ProgressHistoricalStatsResponse | MATCH |
| progressDashboardApi.get | /analytics, /overview | ProgressController: GET /api/v1/progress/dashboard | ProgressDashboardResponse | MATCH |
| careerGoalsApi.list / create | /career-goals | CareerGoalsController: GET /api/v1/career-goals, POST /api/v1/career-goals | CareerGoalResponse | MATCH |
| careerGoalsApi.get / update | /career-goals | CareerGoalsController: GET /api/v1/career-goals/{id}, PATCH /api/v1/career-goals/{id} | CareerGoalResponse | MATCH |
| profileApi.getCareerProfile | /career-goals, /overview | CareerProfileController: GET /api/v1/career-profile | CareerProfileResponse | MATCH |
| billingApi.getPlans | /billing, /pricing | PlansController: GET /api/v1/plans | PlanView[] | MATCH |
| billingApi.createCheckoutSession | /billing | CheckoutController: POST /api/v1/checkout-sessions | CheckoutSessionResponse | MATCH |
| billingApi.getOrderStatus | /billing | CheckoutController: GET /api/v1/checkout-sessions/{orderId} | CheckoutSessionResponse | MATCH |
| billingApi.refreshOrderStatus | /billing | CheckoutController: POST /api/v1/checkout-sessions/{orderId}/refresh | CheckoutSessionResponse | MATCH |

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
- **CV Analysis**: VERIFIED — Presigned object-storage raw-byte PUT upload flow, job_targeted and field_benchmark workflows, reload and retry idempotency preserved.
- **Interview**: VERIFIED — Same-session continuation on upgrade, speech recognition (vi-VN), TTS fallback, immutable completed attempts.
- **Practice Hub**: VERIFIED — Honest empty states for zero-data users, no mock stats, clean route handoffs.
- **Scenario Academy**: VERIFIED — Server pagination, attempt state machine adherence, immutable source attempts on retry.
- **STAR Method Drill**: VERIFIED — Single natural text input, 4-component backend extraction, detected=false zeroing.
- **Competency / Skill Profile**: VERIFIED — Server-derived competency profile grouped dynamically from available evidence, score ranges 0-100 preserved, null scores not collapsed to zero.
- **Progress Analytics**: VERIFIED — Real historical trends only when >= 2 data points exist, null averages preserved.
- **Learning Path**: VERIFIED — Server-ordered milestones, status lifecycle (pending, completed, obsolete), safe external links.
- **Next Recommendation**: VERIFIED — Server-driven recommendation, fail-closed deep links, neutral fallback on empty.
- **SignalR**: VERIFIED — SignalR events trigger React Query REST refetches; REST remains canonical state.
- **React Query**: VERIFIED — Scoped cache keys with resource IDs, bounded retry logic, no infinite refetch loops.
- **Idempotency**: VERIFIED — Deterministic key reuse on transport retry, key regeneration on explicit intent change.
- **Null vs Zero**: VERIFIED — Genuine zero (0) distinct from unassessed/missing (null) across all models.
- **Responsive Web**: STATIC_REVIEW_ONLY (no automated browser/rendered headless viewport run performed in this technical baseline pass; fluid layout tokens and CSS media queries reviewed statically).
- **Accessibility**: STATIC_REVIEW_ONLY for visual/interactive runtime behavior; automated/static semantics (native button tags, aria-live for polling/progress, keyboard navigation handlers, prefers-reduced-motion CSS) verified statically.
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
3. **UI/UX Replatform Required**:
   - As confirmed by product direction, an authenticated Prototype UI/UX replatform is scheduled as the next phase to achieve full design parity. A full product regression audit must be rerun following the UI replatform before production readiness can be declared.

---

## 10. Final Recommendation
**TECHNICAL_BASELINE_READY_FOR_UI_REPLATFORM**
- All underlying backend contracts, route handlers, error mappings, idempotency safeguards, and cross-feature deep links are verified and passing.
- Final production readiness declaration is intentionally deferred until after the Full Prototype UI Parity phase is complete and verified.
- DO NOT MERGE PR #18 without reviewer sign-off.
