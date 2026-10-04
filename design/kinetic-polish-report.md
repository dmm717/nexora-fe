# Nexora kinetic intro and product polish — visual review

Date: 2026-10-04. All redesign changes remain uncommitted.

## Git and preservation

- Branch: `design/light-editorial-3d-redesign`
- HEAD: `d8f9d96f08cca64aa224ceb9d5d4c4a88cb7defd`
- No commits, resets, pushes, deployments, merges or PRs were created in this iteration.
- The preceding history correction removed these local redesign commits from feature-branch ancestry while preserving their source as working-tree changes:
  - `d07ddef64475c37ee2c5dca489563a2740f0dcd2`
  - `697acfd7305f623ef13dcc8b799d50650008ae39`
  - `0d4d0ebe4140e06dff57a5c60ef0d8590306cbd0`
  - `bbdbe6258805d907fb6fe3dfd61d61aaa4dbb278`
- All 662 paths in the pre-reset preservation manifest still exist. All 16 canonical artwork/model asset files checked against that manifest retain identical SHA-256 hashes. The mascot README was updated during the preceding redesign to document its quality limitations. Source edits are intentional; sources and Blender/model assets were not discarded.

## Implemented

### Interview Studio

The desktop stage now combines a compact AI column, a prominent question, candidate preview and a dock immediately beneath them. Long questions scroll within their reading area. The mobile dock stays reachable above the safe area, with room padding for the remaining content. Transcript access and text input remain available.

Official character artwork has a perspective stage, grounded light/shadow and state-specific presentation. Speaking movement depends on the existing actual audio state; stopping playback returns the character to idle. Hidden/offscreen visuals pause. Reduced motion disables character transforms. No rendering toggle or timer-generated interview states were added. Recording, audio, answer intent, retries, entitlement, authentication and billing semantics were preserved.

### Homepage kinetic sequence

The actual BEEWISE reference video was inspected before implementation. Its establish/deconstruct/stagger/reassemble rhythm informed the Nexora motion, without copying its artwork.

One GSAP intro timeline coordinates DOM typography and the existing Three.js scene through `brandMotion.ts`. The official wordmark is segmented from the canonical image; the overlapping XO geometry stays together. The sequence establishes the emblem, deconstructs the wordmark, returns its groups, reveals the Vietnamese slogan, then settles the supporting copy and CTA. It runs for approximately 2.7 seconds, once per entry, and user interaction immediately settles it.

ScrollTrigger moves the same emblem/camera into the first product chapter. Later chapters use coordinated horizontal text reveals, panel perspective and restrained stagger. Scrolling remains native, without pinned page sections or scroll hijacking. Reduced motion keeps meaningful content static, with a brief opacity-only wordmark sequence. A scoped no-JavaScript enhancement makes the streamed public homepage and a real primary navigation link visible without JavaScript.

### Fonts, CV and shared navigation

Plus Jakarta Sans is served through Next/font with Vietnamese glyphs. Competing font imports were removed. Headline tracking, action sizing and spacing were aligned. The CV workspace's current direction was retained, with a small typography adjustment. Shared studio tokens and the authenticated header now use the same blue surfaces, borders, typography and focus treatment as CV; the landing header uses their inverse atmospheric treatment.

## Actual 3D and remaining character work

- The opening emblem is a real Three.js WebGL scene using the existing Blender-generated official Nexora emblem GLB. Camera, object pose and light intensity actually change with the timeline and scroll.
- No Blender sources or model geometry were edited in this polish iteration.
- The character is still the official 2D fallback with spatial CSS presentation. `CHARACTER_3D_READY` remains false. This is not a finished 3D character.
- The existing refined character needs further work on head silhouette, star eyes, glove anatomy, clothing folds, posture and rig/animation before the gate can open. Its existing Blender sources and GLBs remain available.
- Automatic rendering policy, asset failure, context loss, reduced motion and lifecycle cleanup retain the fallback without changing the hero layout.

## Validation

| Check | Actual result |
| --- | --- |
| `npm run lint` | 0 errors, 192 warnings |
| `npx tsc --noEmit` | Passed; rerun after final source edits |
| `npm test` | 683 passed, 0 failed |
| `npm run build` | Passed, 55 pages generated |
| Relevant Playwright suites | 27 passed, 0 failed |
| Browser breakpoints | Landing, real Interview Studio and real CV workspace inspected at 1440, 1280, 768 and 390 widths |
| Real interview controls | Dock bottom 657.5px at 1440×900; 646.64px at 1280×720; mobile dock bottom 834px at 390×844 |
| Real audio state | Actual question replay entered speaking; Stop returned it to idle. The in-app browser had reduced motion enabled, so its character motion correctly stayed reduced. Normal-motion transform changes were separately verified in the explicit studio fixture. |
| Motion capture | Recorded and inspected the actual wordmark deconstruction/recomposition, slogan reveal and first scroll transition |
| Accessibility/fallback | Keyboard interruption, responsive no-replay, no-JavaScript content, reduced motion, asset/context failure and remount cleanup covered |
| Runtime | No page errors or hydration/GSAP target warnings in the kinetic motion test. An existing image LCP recommendation remained in the browser console. |

Playwright command:

```text
npx playwright test tests/e2e/kinetic-polish.spec.ts tests/e2e/cinematic-redesign.spec.ts tests/e2e/light-editorial-redesign.spec.ts tests/e2e/landing-motion.spec.ts tests/e2e/landing-testimonials-scroll.spec.ts --workers=1
```

Raw validation logs: `.playwright-mcp/logs/polish-{lint,unit,build,e2e}.log`.

The real interview and CV screens were inspected through the existing signed-in browser session and configured development backend. No authentication bypass, fake report scores, resume upload, answer submission or session termination was performed. Live microphone/camera permission and capture were not exercised in this pass.

## Preview and evidence

- Landing: http://localhost:3000/
- Interview setup: http://localhost:3000/interviews/new
- Existing interview: http://localhost:3000/interviews/071c87ec-a9b2-42d7-bc57-7c3f28167838
- CV workspace: http://localhost:3000/resume-analyses
- Development server listening on 127.0.0.1:3000, PID 7436; homepage HTTP 200 verified after validation.
- Motion video: `.playwright-mcp/nexora-kinetic-preview.webm`
- Motion contact sheet: `.playwright-mcp/kinetic-motion-frames.jpg`
- Normal WebGL hero and transition: `.playwright-mcp/kinetic-{settled,continuation,studio}.png`
- Real Interview screenshots: `.playwright-mcp/polish-interview-{1440,1280,390}.jpg`
- Real CV screenshots: `.playwright-mcp/polish-cv-{1440,1280,768,390}.jpg`

## Main files touched in this polish pass

`src/styles/interview-stage.css`, `AiInterviewerPresence.tsx`, `CinematicHero.tsx`, `NexoraBrandScene.tsx`, `brandMotion.ts`, `useLandingMotion.ts`, `MarketingLanding.tsx`, `cinematic.module.css`, `landing.module.css`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/loading.tsx`, `AuthenticatedHeader.tsx`, `nexora-studio-tokens.css`, `CvWorkspace.module.css`, `tests/e2e/kinetic-polish.spec.ts`, `tests/landingMotion.test.mjs`.

The complete current working-tree manifest below includes preserved changes from earlier iterations.

WAITING_FOR_VISUAL_APPROVAL — NO COMMITS CREATED


## Current modified and untracked files

```text
 M package-lock.json
 M package.json
 M src/app/(dashboard)/interviews/[id]/page.tsx
 M src/app/(dashboard)/resume-analyses/[id]/page.tsx
 M src/app/(dashboard)/resume-analyses/page.tsx
 M src/app/design-system/page.tsx
 M src/app/globals.css
 M src/app/layout.tsx
 M src/app/loading.tsx
 M src/app/page.tsx
 M src/components/brand/NexoraLogo.tsx
 M src/components/features/cv-analysis/CvAnalysisHero.tsx
 M src/components/features/interview/AiInterviewerPresence.tsx
 M src/components/features/interview/QuestionSpeaker.tsx
 M src/components/features/landing/MarketingLanding.tsx
 M src/components/features/landing/landing.module.css
 M src/components/features/landing/useLandingMotion.ts
 M src/components/header/AuthenticatedHeader.tsx
 M src/components/layouts/Header.tsx
 M src/styles/interview-stage.css
 M tests/e2e/landing-motion.spec.ts
 M tests/e2e/landing-testimonials-scroll.spec.ts
 M tests/feedbackModerationAndPublic.test.mjs
 M tests/interviewDirectSubmit.test.mjs
 M tests/landingMotion.test.mjs
 M tests/productRedesignAudit.test.mjs
 M tests/productUiPolishRound2.test.mjs
 M tests/publicAuthPolish.test.mjs
 M tests/runtimeMotionAccessibility.test.mjs
?? design/assets/nexora-emblem/emblem-preview.png
?? design/assets/nexora-emblem/nexora-emblem.blend
?? design/assets/nexora-mascot/README.md
?? design/assets/nexora-mascot/nexora-prototype.blend
?? design/assets/nexora-mascot/nexora-refined.blend
?? design/assets/nexora-mascot/prototype-preview.png
?? design/assets/nexora-mascot/refined-preview.png
?? design/cinematic-redesign-report.md
?? design/kinetic-polish-report.md
?? design/light-editorial-redesign-report.md
?? public/assets/brand/3d/nexora-emblem.glb
?? public/assets/mascot/3d/nexora-prototype.glb
?? public/assets/mascot/3d/nexora-refined.glb
?? scripts/ambient_studio_edit.py
?? scripts/blender/create_nexora_emblem.py
?? scripts/blender/create_nexora_mascot.py
?? scripts/blender/refine_nexora_mascot.py
?? scripts/cinematic_cv_edit.py
?? scripts/cinematic_delivery_report.py
?? scripts/cinematic_landing_edit.py
?? scripts/cinematic_test_update.py
?? scripts/cv_report_layout.py
?? src/components/brand/MascotCanvas.tsx
?? src/components/brand/MascotVisual.module.css
?? src/components/brand/MascotVisual.tsx
?? src/components/brand/useVisualPolicy.ts
?? src/components/features/cv-analysis/CvWorkspace.module.css
?? src/components/features/cv-analysis/CvWorkspaceHeading.tsx
?? src/components/features/interview/InterviewStudioShowcase.tsx
?? src/components/features/landing/CinematicHero.tsx
?? src/components/features/landing/NexoraBrandScene.tsx
?? src/components/features/landing/brandMotion.ts
?? src/components/features/landing/cinematic.module.css
?? src/styles/nexora-studio-tokens.css
?? tests/e2e/cinematic-redesign.spec.ts
?? tests/e2e/kinetic-polish.spec.ts
?? tests/e2e/light-editorial-redesign.spec.ts
?? tests/mascotPrototype.test.mjs
```


## Follow-up: intro absent in the review browser

The actual in-app browser reported prefers-reduced-motion: reduce, motionMode reduced, introBeat settled and the image fallback. The previous reduced-motion branch skipped the entire intro. It now runs a once-per-entry, interruptible 1.4-second wordmark dissolve/reassembly using opacity only. The headline and CTA remain fully available, with no transforms, WebGL or ScrollTrigger in reduced mode. System/browser motion preferences were not changed.

Modified in this follow-up: src/components/features/landing/useLandingMotion.ts and tests/e2e/kinetic-polish.spec.ts. The full 3D intro stays under the normal-motion policy. Recorded reduced-motion evidence: .playwright-mcp/nexora-reduced-intro.webm and .playwright-mcp/reduced-intro-frames.jpg.

Validation: TypeScript passed; ESLint on both touched files passed; 683 unit tests passed; production build passed. The focused UI run passed 11 of 12 checks initially; the studio fixture detached during hydration. Its assertions now resolve the live DOM with retries, and the isolated failed check passed on rerun. The reduced intro sequence itself passed and its actual video was inspected. Localhost remains HTTP 200. No commits or history changes.
