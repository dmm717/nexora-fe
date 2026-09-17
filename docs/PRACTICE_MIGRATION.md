# Practice experience migration

## Source references

- Production starting HEAD: `fc9ecc6309401e6d640324063a41ba5ad7cdca39`
- Approved interview ancestor: `2fd15dea1d6b5b2d172893c3198ca9cfe5317955`
- Prototype reference HEAD: `46711620c8f184adcf3fab63b932823eade4a841`
- Backend reference HEAD: `f4e60b4e709ce34a552632a9957c2321121e5056`
- Production branch: `feat/practice-experience`

The prototype is a visual and interaction reference only. Production API clients,
React Query, authentication, billing, and SignalR remain authoritative at runtime.

## Migration map

| Prototype screen | Production route | Backend endpoint | Visual port | Contract adaptation | Mock behavior rejected |
| --- | --- | --- | --- | --- | --- |
| `PracticeHubScreen` | `/practice` | `GET /me`, `GET /scenario-attempts`, `GET /star-attempts` | Hero, three distinct modes, honest recent activity | Feature availability comes from entitlement feature codes; history uses persisted attempts only | Prototype persona, readiness, recommendation, streak, progress and sample attempts |
| Interview card | `/interviews/new` | Existing interview contract | Clear primary entry card | Link only; no duplicate interview flow | Prototype `/practice/interview/*` flow |
| `ScenarioLibraryScreen` | `/practice/scenarios` | `GET /scenarios`, `/scenarios/categories`, `/scenarios/progress` | Catalogue, filters, server progress, empty/error/loading states | Existing production DTOs and pagination | Mock scenarios, scores, categories and recommendations |
| `ScenarioRoomScreen` | `/practice/scenarios/[slug]` | `POST /scenario-attempts`, `POST /scenario-attempts/{id}/submit`, `GET /scenario-attempts/{id}`, `GET /scenarios/{slugOrId}/attempts`, `POST /scenarios/{scenarioId}/retry` | Context, answer workspace, evaluation, retry, history | Completed attempts are read-only; retry returns a fresh persisted attempt; score `null` stays unavailable | Prefilled answer, client evaluation, fake progress and copied results |
| `StarPracticeRoomScreen` | `/practice/star` | `POST /star-attempts`, `GET /star-attempts/{id}`, `GET /star-attempts` | Natural answer editor, component breakdown, coaching, retry, history | One question plus one natural answer; backend owns detection, score, evidence and missing elements | Mock question bank, sample answers, client evaluator and timeout |

Legacy `/scenarios`, `/scenarios/[slug]`, and `/star-builder` routes remain available
for existing links. Practice navigation uses the canonical `/practice/*` routes.

## Practice Hub behavior

The hub presents Interview, Scenario, and STAR as separate practice modes. The
Interview card links directly to `/interviews/new`. Recent activity is rendered
only from persisted Interview, Scenario, and STAR attempts returned by the backend. No
readiness score, streak, practice count, or learning recommendation is inferred.

Feature availability is matched by backend feature codes `scenario` and
`star_builder`. UI availability is advisory; mutation rejection from the backend
is canonical. Upgrade actions reuse `/billing` with a validated, internal
`returnTo` query value.

## Scenario contract

The production mapping is:

- catalogue: `GET /scenarios`
- categories: `GET /scenarios/categories`
- detail: `GET /scenarios/{slugOrId}`
- create draft: `POST /scenario-attempts`
- submit answer: `POST /scenario-attempts/{id}/submit`
- canonical attempt state: `GET /scenario-attempts/{id}`
- recent attempts: `GET /scenario-attempts`
- scenario history: `GET /scenarios/{slugOrId}/attempts`
- progress: `GET /scenarios/progress`
- completed/failed retry: `POST /scenarios/{scenarioId}/retry`

Lifecycle is `draft -> queued -> processing -> completed|failed`. Draft is the
only editable state. Submitting freezes the candidate answer on that attempt.
Evaluation, dimensions, evidence, strengths, gaps, and recommended approach are
rendered only when returned by the server.

Retry uses the backend retry endpoint and selects the new attempt ID. It never
clears or overwrites the source attempt and does not copy the source evaluation.
A retry begins with an empty answer. Network retry of the same create or submit
intent reuses the same idempotency key; a deliberate new retry gets a new intent.

`overallScore: 0` is a genuine score. `overallScore: null` or a missing
evaluation is displayed as unavailable/pending and is never coerced to zero.

## STAR contract

The production mapping is:

- create and queue evaluation: `POST /star-attempts`
- canonical attempt state: `GET /star-attempts/{id}`
- persisted recent history: `GET /star-attempts`

Each mutation sends one question and one natural free-text answer. Every submit
creates a new persisted attempt; there is no backend relation field for
`sourceAttemptId` or a dedicated retry endpoint, so Practice Again is a new
`POST /star-attempts` user intent and leaves the original attempt immutable.

The API boundary normalizer preserves backend semantics:

- `detected === false` forces score `0` and evidence `""`; server feedback may remain.
- `detected === true` uses the server score and evidence.
- a missing/nullable component remains absent instead of being fabricated.
- `missingElements` is rendered from the server and is not inferred from score.
- `overallScore: null` means unavailable; `0` remains a genuine zero.
- candidate evidence is shown only from a returned component evidence field.
- the current backend STAR attempt DTO has no improved-answer field; none is invented.

## Realtime and polling

SignalR `resourceChanged` notifications invalidate the exact
`['scenarioAttempt', id]` or `['starAttempt', id]` query. REST remains canonical.
Bounded-interval React Query polling remains a fallback while an attempt is
non-terminal and stops at `completed` or `failed`. Scenario history and progress
are invalidated after Scenario events; STAR history is invalidated after a STAR
submission and terminal refresh.

Persisted active Scenario attempts recover through scenario history after a page
refresh. STAR history is persisted, while an unsaved editor draft is intentionally
local. The backend does not expose a dedicated current-STAR-attempt pointer; a
fresh page therefore shows history and starts a new user intent on submit.

## Responsive and accessibility implementation

The migrated surfaces use the existing Design Foundation `Button`, `Card`,
`Badge`, `Alert`, `EmptyState`, and `RadialScore` primitives. Layouts collapse at
tablet/mobile widths without horizontal-scrolling card rows. Text areas retain a
usable minimum height at 390 px, controls wrap, and evidence uses normal wrapping.

Headings, labels, status regions, alerts, buttons, and links remain semantic.
Loading uses announced indeterminate status; scores and STAR detection include
text labels rather than color alone. Global focus-visible treatment and reduced
motion support are reused.

## Prototype behavior explicitly rejected

- `PrototypeContext`, mock personas, mock entitlement and mock recommendation
- `MOCK_SCENARIOS`, `MOCK_STAR_BANK`, sample completed attempts and fake history
- client-side Scenario or STAR evaluation
- seeded/prefilled candidate answers
- fake percentage progress, delays, countdowns, scores, evidence, and trends
- localStorage attempt history

## Known backend gaps

- No single backend endpoint currently returns unified Interview, Scenario, and
  STAR history with display metadata. The hub merges the three existing list
  endpoints client-side and sorts only their real timestamps; it does not infer
  scores or source relations that those summaries omit.
- STAR attempts have no dedicated retry relation or improved-answer field.
- Scenario list attempts omit candidate answers by contract; detailed answer and
  evaluation are fetched only for a selected attempt.
