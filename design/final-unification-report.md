# Nexora — cinematic redesign and final unification

Current review snapshot, 4 October 2026. This report supersedes the delivery status in the earlier iteration reports. The user explicitly requested a commit and PR after the local visual work; that later request authorizes publishing this review branch. It does not authorize merging or deployment.

## Implemented experience

- Landing: ambient indigo opening, the official extruded Nexora emblem, kinetic wordmark deconstruction and staggered recomposition into the Vietnamese slogan. GSAP owns the entrance and scroll timeline; Three.js consumes the same motion state to move the camera, emblem and lighting. Interaction can settle the entrance immediately. Meaningful HTML and CTA remain available without JavaScript. Reduced motion and rendering failures retain the consistent visual fallback.
- Storytelling: the five actionable preparation steps use a horizontal connected layout from 1360px and a vertical rail below that. Equal columns, explicit gaps and static card geometry prevent overlaps during entrance. The rail changes its axis with the layout. No scroll hijacking or long pinned section was added.
- Interview Studio: compact desktop character/question/participant composition and reachable control dock. At 1280×720 the dock was measured at approximately y=565–661, inside the initial viewport. Mobile has a fixed dock and extra bottom clearance; long questions stay readable. Recording, editing, submission, retry, camera, entitlement and transcript handlers remain owned by the existing application.
- CV workspace: the approved document-focused blue/lavender direction and native tilted CV paper remain. Upload validation, presigned upload, primary resume selection, processing state and actual report data remain in place. The report retains API-derived scores and recommendations.
- Shared product system: 16px root font, Vietnamese-capable existing Plus Jakarta Sans, consistent blue surfaces, borders, buttons, focus treatment, spacing and restrained utility headers. Pricing no longer leaves a second empty hero column on mobile.
- Navigation: `NavigationFrame` and `NavigationMenu` are shared by landing and authenticated headers. The public menu derives from the same canonical items, with marketing anchors retained where appropriate. Product links retain real application routes. Focused practice keeps its existing guarded exit and compact session header.

## Module artwork

Twelve new transparent 512×512 WebP illustrations follow the user's layered white CV-paper reference, with lavender backing and indigo accents. They are decorative illustrations, not screenshots, scores or purported user results. Combined runtime size: **300,380 bytes**.

| Artwork | Module presentation |
| --- | --- |
| overview | Overview evidence dashboard |
| interview | Interview hub, setup and history |
| practice | Practice hub |
| capabilities | Analytics and skill profile |
| pricing | Pricing access keys |
| scenario | Scenario catalogue and its practice alias |
| star | STAR practice and compatibility builder |
| learning-path | Learning roadmap |
| career-profile | Canonical career goals page |
| profile | Personal profile |
| settings | Account settings |
| archive | CV and payment history |

Runtime files are under `public/assets/features/paper/*-v2.webp`. Generation style, subjects and original image paths are recorded in [paper-heroes-prompts.json](paper-heroes-prompts.json). Images were generated through the built-in imagegen tool, then resized and encoded with alpha preserved. Original generated PNGs remain in the local Codex generated-images directory. Existing brand, mascot and CV artwork were preserved. Decorative module art is hidden on small mobile hero layouts to preserve space for meaningful content and controls.

## Real 3D and character limitations

The landing actually loads `public/assets/brand/3d/nexora-emblem.glb` into Three.js. Blender source and generation script are included. Rendering responds to the shared GSAP entrance/scroll state rather than an unrelated spinning loop. Resize/intersection observers, context loss, document visibility and GPU disposal are handled.

The mascot prototype and refined Blender/GLB files are preserved, including their six state clips. **The character is not approved as production-quality 3D.** `CHARACTER_3D_READY` remains false. The studio displays the official 2D mascot with depth presentation and motion driven by real interview/audio state. Real playback was inspected: speaking state had the speaking animation; stopping question playback restored idle and `animation: none`. There is no visible 2D/3D toggle. Head fidelity, anatomy, clothing and facial/skeletal rigging remain unfinished; see [mascot README](assets/nexora-mascot/README.md).

## Routing audit and compatibility

The old landing CTA used `/interview`, which loaded a local demonstration wizard. The old `/interview/room` demo had no session ID and simulated activity with a timer. Both had sole consumers in their obsolete route files; canonical navigation, resume history and real session logic already use `/interviews`.

The canonical practice entry is now `/interviews/new`. `/interview` redirects there; `/ai-interview` has a compatibility redirect there; `/interview/room` redirects to the real `/interviews` hub, where a valid session can be resumed. Only the two obsolete demo components were removed. No model, Blender source or design asset was removed. Authentication still preserves safe return intent, and actual session/report IDs remain server-owned.

`/account` retains its existing settings redirect. `/career-profile` retains its existing redirect to `/profile`, or `/career-goals` when `section=goals`; the unused old screen was not revived. `/cv-analysis` remains a public product introduction linking to the real CV workspace. `/billing` retains payment-return compatibility logic; it was not replaced with a generic redirect.

The complete source-route inventory and the exact visual-change classification are in [route audit](final-route-audit.md). Core pages were changed directly; secondary pages may inherit shared navigation, font, surfaces and artwork without a content rewrite. Admin, authentication, payment-return flows and ambiguous old prototypes were deliberately not redesigned.

## Actual verification

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors; 192 existing warnings |
| `npx tsc --noEmit` | Passed |
| `npm test` | 686 passed; 0 failed |
| `npx playwright test --workers=2` | 72 passed; 0 failed |
| `npm run build` | Passed; Next.js 16.3.3 production build |
| `git diff --check` | Passed |

Playwright covers real DOM/WebGL intro beats and camera continuation, motion interruption, disabled JavaScript, reduced motion, WebGL asset failure and context loss, cleanup/remount, the five-step layout across seven sizes, safe unauthenticated CTA intent, compatibility routes, menus/focus, pricing mobile layout, avatar upload validation and header sync, and logout/principal-cache invariants. The avatar test now opens canonical `/profile` and supplies a valid career-profile fixture. The principal-switch test logs in through the real form instead of trying to bypass the existing persisted logout barrier.

Separate manual browser QA used the user's existing authenticated Chrome session and real configured backend. No authentication bypass or fabricated analysis data was used. Main routes inspected at 1440×900, 1280×720, 768×1024 and 390×844 include overview, practice, analytics, pricing, profile, settings, CV history, interview history, payment history, interview hub, setup, live studio, CV workspace, CV report, interview report, career goals, learning path, scenario catalogue and STAR. No answer, account form, payment, upload or deletion was submitted during real-account visual QA. Mutation regression tests use isolated mocked fixtures.

Landing preparation journey was also checked at 1920×1080, 1024×768 and 360×800. Captured frames verify stable card geometry during motion, absence of overlap, and unclipped step text. Initial intro, first scroll continuation and reduced motion have actual Playwright video captures under ignored `test-results/kinetic-polish-*/video.webm`.

Local screenshots and comparison boards are under ignored `.playwright-mcp/unification/`; viewport measurements are in `viewport-metrics.json`. These contain real account content and are kept local, not uploaded into the PR. Some Chrome screenshot requests timed out; only files actually captured are present. Chrome runs at the user's existing zoom; the measured CSS viewport sizes above were calibrated without changing that preference.

Chrome reported hydration attribute differences from installed extensions (`bis_skin_checked`, `bis_register`, `__processed_*`, `cz-shortcut-listen`). Clean Playwright intro/journey checks reported no app hydration errors. No suppression was added to hide extension differences. Microphone/camera permission prompts and a fresh paid checkout were not exercised against the real account in this pass.

## Preservation and Git

Review branch: `design/light-editorial-3d-redesign`. Verified base and fetched `origin/main`: `d8f9d96f08cca64aa224ceb9d5d4c4a88cb7defd`. No unrelated commits were rebased or reset in this pass. Prior local unapproved redesign commits removed in the earlier preservation step were `d07ddef64475c37ee2c5dca489563a2740f0dcd2`, `697acfd7305f623ef13dcc8b799d50650008ae39`, `0d4d0ebe4140e06dff57a5c60ef0d8590306cbd0`, and `bbdbe6258805d907fb6fe3dfd61d61aaa4dbb278`.

The preservation manifest contained 662 original paths. All remain except the two intentionally retired demo components described above. All 40 original binary design/brand/model assets still match their recorded SHA-256 hashes; the mascot README was updated to document the fidelity gate. Earlier Blender sources, GLBs, previews, redesign source and scripts remain included.

The complete pre-commit changed/untracked manifest is [file list](final-unification-git-status.txt). The PR contains the cumulative uncommitted redesign in one review commit after the user's explicit commit/PR instruction. No merge or manual deployment was performed.

## Local visual review

Persistent development preview: **http://localhost:3000**.

- Landing: `/`
- Interview entry: `/interviews/new`
- Resume existing sessions: `/interviews`
- CV workspace: `/resume-analyses`
- Core product: `/overview`, `/practice`, `/analytics`, `/pricing`
- Account/history: `/profile`, `/settings`, `/cv-analysis/history`, `/interviews/history`, `/payment-history`
- Extended practice: `/career-goals`, `/learning-path`, `/practice/scenarios`, `/practice/star`

Authenticated routes require the existing session. The server remains running for visual review. Known remaining scope: production-quality mascot character; old `/ai`, `/plans`, `/public` and `/courses` prototypes; no new visual redesign of admin or authentication/payment recovery pages.
