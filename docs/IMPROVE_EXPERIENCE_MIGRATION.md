# Nexora Improvement Experience Migration (Competency, Progress & Learning Path)

## 1. Production Starting HEAD
- `ccaa2d64859a6516db62a58789f0ec51b704a9f4` (origin/main)

## 2. Prototype Reference HEAD
- `b5ce405dc6a83acc2e5231c6e6f44f4aa71fb8fc` (qbao0111/nexora-prototype)

## 3. Backend Reference HEAD
- `ac6ecb8e2b10ee411be33659b15bfda2a8415abb` (qbao0111/nexora-backend)

## 4. Route Map
- `/overview`: Primary B13 Progress Dashboard consuming `GET /api/v1/progress/dashboard`, integrating readiness score, weakest competencies, recent improvements, weekly activity summary, next recommendation card, and career profile overview.
- `/analytics`: Dedicated Progress Analytics page consuming `GET /api/v1/progress`, displaying completed interviews/scenarios/STAR attempts, average scores, STAR dimension breakdowns, recent score history, and recent activity timeline.
- `/skill-profile`: B10 Skill Profile view consuming `GET /api/v1/skill-profile`, presenting candidate competencies, evidence provenance breakdown, and qualitative weakness signals.
- `/learning-path`: B11 Learning Path page consuming `GET /api/v1/learning-path`, displaying milestones, activities, priority ratings, completion actions, refresh/generation actions, and next recommended practice.
- `/practice`: Practice hub with canonical sub-routes:
  - `/practice/scenarios`: Scenario catalogue.
  - `/practice/scenarios/[slug]`: Direct scenario attempt and review.
  - `/practice/star`: STAR Drill practice room.
- `/interviews/new`: Canonical entry point for interview creation.
- `/resumes`: Canonical CV upload, analysis, and management workspace.

## 5. Skill / Competency Endpoint Mapping
- Endpoint: `GET /api/v1/skill-profile`
- Backend Service: `ISkillProfileService.GetAsync(userId, ct)`
- Backend DTO: `SkillProfileResponse(competencies, weaknessSignals)`
  - Competency: `SkillProfileCompetencyResponse(code, name, category, score, evidenceCount, latestEvidenceAt, sources)`
  - Source: `SkillProfileSourceResponse(sourceType, evidenceCount, latestEvidenceAt)`
  - Weakness: `SkillProfileWeaknessSignalResponse(sourceType, label, latestEvidenceAt)`
- Frontend Service: `skillProfileApi.get()`, `useSkillProfile()` in `src/hooks/queries/useSkillProfile.ts`
- Normalizer: `normalizeSkillProfileResponse` in `src/services/skillProfileContract.ts`

## 6. Competency Data Semantics
- Authoritative scores and taxonomy are backend-controlled; the frontend never computes scores from keyword matches or local heuristics.
- Scores are integer scales [0, 100].
- If score is `null` / undefined, it indicates insufficient assessment evidence and is rendered as "Chưa có điểm" (never coerced to 0).
- If score is `0`, it represents a genuine zero evaluation.
- Levels and tiers are not fabricated client-side (no artificial "Beginner" / "Junior" mappings without backend definitions).

## 7. Evidence Provenance
- Every assessed competency includes candidate-generated sources:
  - `cv_analysis`: derived from uploaded resume analysis.
  - `interview`: derived from AI interview question performance.
  - `scenario`: derived from evaluated situational scenarios.
  - `star_attempt`: derived from completed STAR behavioral drills.
- Only backend-supported source types are rendered; no synthetic source types or mock data are introduced.

## 8. Null vs. Zero Behavior
- Strict adherence to `NULL != ZERO` across all models:
  - `competency.score`: `0` displays "0/100"; `null` displays "Chưa có điểm".
  - `readiness.score`: `0` displays "0/100"; `null` displays "Chưa đủ dữ liệu".
  - `historicalStats.averageInterviewScore`: `null` displays "Chưa có điểm".
  - `historicalStats.averageScenarioScore`: `null` displays "Chưa có điểm".
  - `historicalStats.starAverages`: `null` renders honest empty STAR state with link to `/practice/star`.
  - Missing or sparse data points are never converted into zeros to fake completed charts.

## 9. Progress Endpoint Mapping
- Dashboard Endpoint: `GET /api/v1/progress/dashboard`
  - Controller: `ProgressController.GetDashboard`
  - Service: `IProgressDashboardService.GetAsync(userId, ct)`
  - Response: `ProgressDashboardResponse(readiness, weakestCompetencies, recentImprovements, weeklyCompletedActivities, nextRecommendedPractice, historicalStats)`
- Historical Progress Endpoint: `GET /api/v1/progress`
  - Controller: `ProgressController.Get`
  - Service: `IProgressService.GetAsync(userId, ct)`
  - Response: `ProgressResponse(completedInterviews, recentInterviewScores, averageInterviewScore, starAverages, completedScenarios, averageScenarioScore, completedStarAttempts, recentActivity)`
- Normalizers: `normalizeProgressDashboardResponse` and `normalizeProgressHistoricalStats` in `src/services/progressDashboardContract.ts`.

## 10. Progress Metric Semantics
- Displays only server-backed counts:
  - Total completed interviews
  - Total completed scenarios
  - Total completed STAR drills
  - Weekly activity breakdown in UTC
- Banned fabricated metrics:
  - No fake daily or weekly streaks
  - No synthetic percentile claims ("Bạn hơn 70% người dùng")
  - No XP, levels, or predictive success percentages

## 11. Chart & Trend Rules
- Trends require real chronological data points:
  - If `recentInterviewScores.length >= 2`: displays historical score list with actual completed timestamps.
  - If `recentInterviewScores.length === 1`: displays single score and explicitly informs user that at least 2 sessions are required to evaluate progress trends.
  - If `recentInterviewScores.length === 0`: displays honest empty state.
- Radar charts require at least 3 distinct competencies to form a 2D polygon; if 1 or 2 competencies exist, clean progress bars are rendered without fabricating 0-filled dimensions.

## 12. Learning Path Endpoint Mapping
- Endpoints:
  - `GET /api/v1/learning-path`: retrieves current active learning path.
  - `POST /api/v1/learning-path`: generates initial learning path based on career goals and skill profile.
  - `POST /api/v1/learning-path/refresh`: refreshes path with updated evidence.
  - `PATCH /api/v1/learning-path/activities/{activityId}`: updates activity status to `completed`.
- Normalizer: `normalizeLearningPathResponse` in `src/services/learningPathContract.ts`.

## 13. Learning Path Activity Model
- Activity Types:
  - `scenario`: situational exercise.
  - `star_drill`: STAR structured behavioral drill.
  - `interview`: AI mock interview.
  - `resume_improvement`: CV update and keyword optimization.
  - `external_learning`: reference documentation or external link.
- Priority:
  - Priority 1: Critical skill gaps (`score < 60`).
  - Priority 2: Developing skills (`60 <= score < 75`).
  - Priority 3: Supporting improvements.

## 14. Completion Semantics
- Completion is server-owned via `PATCH /api/v1/learning-path/activities/{id}` with payload `{ status: "completed" }`.
- The frontend does not mark activities complete simply because a CTA was clicked or a page was visited.
- Stale or obsolete activities (`LEARNING_PATH_ACTIVITY_OBSOLETE`) trigger explanatory user notifications.

## 15. Regeneration Semantics
- Learning path generation and refresh are initiated strictly by explicit user action (button click).
- Automatic regeneration on page mount is avoided to prevent quota burn, duplicate AI tasks, and endless loops.

## 16. Next Recommendation Contract
- Endpoint: `GET /api/v1/recommendations/next` or embedded in `progress/dashboard`.
- Contract: `NextPracticeRecommendationResponse(reason, activityType, resourceId, estimatedMinutes, priority, action)`.
- If recommendation is `null`, neutral fallback "Hiện chưa có bài luyện tập tiếp theo được đề xuất" is displayed.
- If server provides `action: { type: "practice_again", sourceInterviewId, ... }`, idempotency-keyed practice-again trigger is enabled.

## 17. Canonical Deep-Link Mapping
Centralized resolvers in `learningPathContract.ts` and `recommendationContract.ts`:
- `scenario` with resourceId: `/practice/scenarios/{resourceId}`
- `scenario` without resourceId: `/practice/scenarios`
- `star_drill`: `/practice/star`
- `interview`: `/interviews/new`
- `resume_improvement`: `/resumes`
- `external_learning`: `activity.externalUrl` if present, otherwise no link.
- Unknown activity type: `null` (fails closed, never invents an arbitrary route).

## 18. Entitlement Behavior
- Gated analytics or features returning `FEATURE_NOT_AVAILABLE` (HTTP 403) display a prominent, informative entitlement banner routing to `/billing`.
- No client-side hardcoding of plan tiers; access control relies on server rejection with canonical error codes.

## 19. Realtime / Polling
- Progress and learning path mutations invalidate React Query caches (`["progressDashboard"]`, `["learningPath"]`, `["analytics"]`, `["skillProfile"]`).
- Polling is not run unconditionally; queries use standard stale times (`30s`) to prevent server hammering.

## 20. Empty States
- Skill Profile: "Chưa có đủ dữ liệu để đánh giá năng lực" with 4 canonical action buttons:
  - Phân tích CV (`/resumes`)
  - Luyện phỏng vấn (`/interviews/new`)
  - Luyện tình huống (`/practice/scenarios`)
  - Luyện STAR (`/practice/star`)
- Progress Analytics: "Chưa có dữ liệu tiến bộ" with 4 canonical action links.
- Learning Path:
  - If no active career goal (`ACTIVE_CAREER_GOAL_REQUIRED`): directs to `/career-goals`.
  - If path not generated (`LEARNING_PATH_NOT_FOUND` / 404): "Chưa có lộ trình học" with explicit generation CTA.
- Next Recommendation: "Hiện chưa có bài luyện tập tiếp theo được đề xuất."

## 21. Prototype Mocks Rejected
- Strictly no imports of `PrototypeContext`.
- No mock skill profiles, fake radar coordinate synthesis, fake streaks, fake readiness, or fake XP.
- No `setTimeout` simulation of AI processing.
- No `localStorage` mocking of progress history or completed activities.

## 22. Responsive Behavior
- Verified viewports: 1440px (Desktop), 1024px (Tablet Landscape), 820px (Tablet Portrait), 390px (Mobile Portrait), and 390x700px (Compact Mobile).
- CSS Grid configurations wrap gracefully:
  - `statsGrid`: 1 column on mobile, 2 columns on tablet, 4 columns on desktop.
  - `contentGrid`: single column on mobile/tablet, 2 columns on desktop.
  - Competency and activity cards use fluid layouts with no horizontal scroll overflows.

## 23. Accessibility
- Semantic landmarks (`<header>`, `<section>`, `<main>`, `<ul>`, `<li>`).
- Visible focus rings for interactive elements.
- Accessible aria attributes: `role="alert"` for error and entitlement banners, `role="status"` with `aria-live="polite"` for asynchronous loading indicators.
- Non-color-only indications: scores include quantitative numbers (/100) alongside color classes.
- Date and time formatting uses `<ClientDate />` to eliminate hydration differences across timezones.

## 24. Known Backend Gaps
- Qualitative weakness signals currently return string labels rather than structured taxonomy entities; rendered faithfully as received.
- External learning activities do not provide completion verification webhooks; completed state is user-attested via patch endpoint.
