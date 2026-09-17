# Prototype UI parity audit

## References

- Production FE base: `71bb0d6063fc537fe3d1b48bbcdf87d065a39d9c`
- Prototype UI/UX: `46711620c8f184adcf3fab63b932823eade4a841`
- Backend contracts: `f4e60b4e709ce34a552632a9957c2321121e5056`

Prototype owns presentation. Production frontend and backend own runtime behavior, wire values, persistence, entitlement, and error semantics.

## Evidence labels

- `STATIC_REVIEW_ONLY`: production and prototype source were compared, but an authenticated render was not available.
- `RENDERED_MATCH`: production was rendered and checked at the recorded viewport.
- `MINOR_DEVIATION`: rendered structure is correct with a recorded non-blocking visual difference.
- `HYBRID`: legacy and prototype shells remain mixed. None are knowingly accepted in this corrective.
- `NOT_PORTED`: the prototype presentation is absent. None are knowingly accepted in this corrective.

`FULL_PARITY` is intentionally not used. Similar component names or Tailwind classes are not rendered evidence.

## Surface matrix

| Surface | Prototype source | Production route / implementation | Production data source | Status | Viewports actually checked | Remaining deviation |
| --- | --- | --- | --- | --- | --- | --- |
| Authenticated shell | `AuthenticatedMasterShell`, `AuthenticatedHeader` | `/(dashboard)/*`, `DashboardLayout`, `AuthenticatedHeader` | `/me`, career profile | `STATIC_REVIEW_ONLY` | None; authenticated runtime unavailable | Render confirmation pending |
| Focused practice shell | `(focused)/layout`, `FocusedPracticeShell` | `/interviews/[id]`, `/practice/star`, `/practice/scenarios/[slug]` | session, scenario, STAR query state | `STATIC_REVIEW_ONLY` | None; authenticated runtime unavailable | Render confirmation pending |
| Overview | `OverviewScreen` | `/overview` | dashboard, progress, career profile, learning path, recommendation | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Career goals / account | `CareerProfileScreen` | `/career-goals`, `/account` | career goals, `/me`, resumes | `STATIC_REVIEW_ONLY` | None | Separate production forms retained; no claim of pixel identity |
| CV library / launch | `CareerProfileScreen`, `CvAnalysisLaunchScreen` | `/resumes`, `/resume-analyses` | resumes, analyses, JD, entitlement | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| CV analysis result | `CvAnalysisResultScreen` | `/resume-analyses/[id]` | resume-analysis polling and persisted result | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Interview preflight | `InterviewPreflightScreen` | `/interviews/new` | goals, ready resumes, persisted JD, entitlement | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Interview room | `InterviewRoomScreen` | `/interviews/[id]` | interview session, question, answer, continuation | `STATIC_REVIEW_ONLY` | None | Render confirmation pending; source confirms focused shell replaces global header |
| Interview report | `InterviewReportScreen` | `/interviews/[id]/report` | interview report and retry/practice-again APIs | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Practice hub | `PracticeHubScreen` | `/practice` | interview, scenario and STAR histories | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Scenario catalogue | `ScenarioLibraryScreen` | `/practice/scenarios` | scenarios, categories, entitlement | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Scenario runner | `ScenarioRoomScreen` | `/practice/scenarios/[slug]` | persisted attempts, evaluation, history | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| STAR practice | `StarPracticeRoomScreen` | `/practice/star` | persisted STAR attempts and evaluation | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Skill profile | `ProgressScreen`, `CareerProfileScreen` | `/skill-profile` | skill profile | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Learning path | `LearningPathScreen` | `/learning-path` | learning path and activity mutations | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Analytics | `ProgressScreen` | `/analytics` | progress dashboard and skill profile | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Billing | `BillingScreen` | `/billing` | `/me` entitlement, plans, checkout and orders | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |
| Pricing | `PricingScreen` | `/pricing` | public plans endpoint | `STATIC_REVIEW_ONLY` | None | Render confirmation pending |

## Corrective contract evidence

- Focused routes are matched exactly. Reports, history, catalogues and ordinary dashboard routes retain the global authenticated header.
- Focused headers receive real session/exercise context. Missing subtitle or step data is omitted. Interview numbering is natural and does not hardcode `/3` after Q3.
- Preflight exposes all seven backend interview types. `cv_targeted` requires a visible ready resume. `jd_targeted` selects a persisted JD or creates one from an explicit title and content. Career-goal mode omits hidden role and seniority overrides.
- Learning Path treats only `pending` as actionable. `completed`, `obsolete`, and unknown statuses cannot launch or complete. Missing deep links never trigger a mutation. Obsolete/unknown activities are excluded from the active denominator.
- Analytics and Skill Profile preserve `null` separately from a genuine zero and do not invent a fixed competency denominator or personalized seniority threshold.
- Analytics recommendation actions use the canonical recommendation deep link, readiness scores stay numeric and source-neutral, and missing weakness evidence is not presented as proof that no weakness exists.
- Overview recent activity uses only server-owned timestamps; entries without a trustworthy timestamp are omitted instead of being dated as the current time.
- Progress Dashboard locked/error states stay distinct from canonical insufficient evidence; historical totals never impersonate weekly metrics, and readiness visuals use a neutral score tone.
- Recommendation destinations come exclusively from `recommendationContract.ts`; `star_drill` is the STAR machine value.
- Billing resolves `interview`, `cv_analysis`, and `interview_question_limit` by exact code. Plan capability copy is built from server-returned price features.
- Practice history differentiates loading, error, and confirmed-empty states. Practice-again identity uses source IDs/reason, never role text.
- Reduced-motion mode removes looping orb, ring, ripple, and waveform animation while leaving static state and text visible.
- The authenticated header does not fabricate an email and does not route Privacy to System Status.

## Runtime evidence limitation

Local browser verification was attempted on 2026-09-18. `/overview` reached the recoverable auth-bootstrap error state because the local backend session endpoint was unavailable, so no protected product surface could be inspected. `/pricing` rendered its public shell but remained in the plan-loading state without the public plans endpoint. The available in-app browser also did not expose viewport resizing, so none of the required target widths were claimed as checked.

The corrective must not be called rendered parity until an authenticated environment can load the protected routes and the public plans endpoint can settle. When that environment is available, capture one batched round at `1440`, `1024`, `820`, `390`, and `390x700`, then replace only the supported `STATIC_REVIEW_ONLY` labels with `RENDERED_MATCH` or `MINOR_DEVIATION` and record the screenshot paths. Source review alone is not promotion evidence.
