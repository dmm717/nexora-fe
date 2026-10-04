# Nexora — cinematic redesign, awaiting visual approval

## Local Git and preservation

- Branch: `design/light-editorial-3d-redesign`
- HEAD / verified latest-main merge-base: `d8f9d96f08cca64aa224ceb9d5d4c4a88cb7defd`
- Initial working tree was clean; the feature branch contained exactly four redesign commits and no unrelated commits.
- `git fetch origin` succeeded. Remote refs did not contain the redesign commits; no matching feature branch or tag existed in `git ls-remote --heads --tags origin`.
- Used `git reset --mixed d8f9d96f08cca64aa224ceb9d5d4c4a88cb7defd`. No hard reset, clean, rebase, branch deletion, push, deploy, PR or merge.
- SHA256 comparison of all 662 inventoried source/assets immediately after reset had **zero differences**. Entire committed redesign was preserved as local working changes before intentional visual rework.
- Original Blender prototype, original GLB/script and canonical brand/mascot images are still byte-identical to the inventory: 16 files checked again at delivery.
- Preservation evidence is local/ignored: `.playwright-mcp/logs/pre-reset-hashes.json` and `.playwright-mcp/logs/preserved-redesign.patch`.
- No commits created. Successful checks do not constitute visual approval.

Removed from feature branch ancestry (Git reflog still naturally retains prior objects):

```text
bbdbe6258805d907fb6fe3dfd61d61aaa4dbb278 chore(design): polish responsive motion and accessibility
0d4d0ebe4140e06dff57a5c60ef0d8590306cbd0 feat(branding): prototype animated Nexora 3d mascot
697acfd7305f623ef13dcc8b799d50650008ae39 design(interview): introduce light immersive interview studio
d07ddef64475c37ee2c5dca489563a2740f0dcd2 design(landing): introduce Nexora light editorial experience
```

## Implemented visual direction

1. Full viewport deep-blue/indigo opening. Official SVG emblem is extruded/beveled in Blender, displayed through actual Three.js GLB rendering with reflection environment and two dimensional torus orbits. Vietnamese headline, product explanation, functional original CTA and scroll anchor remain HTML.
2. One demand-rendered WebGL scene covers the opening and AI practice chapter. GSAP ScrollTrigger moves the real camera, emblem and orbit transforms. Separate scoped HTML timelines turn the studio panel in depth and reveal evidence/document panels. Normal scrolling; no pinned/hijacked section. Light evidence and CV chapters, a dark learning chapter, then a luminous final CTA.
3. Interview Studio now has a central ambient-blue stage, responsive official mascot, inset candidate camera, larger question hierarchy, dark sticky control dock and layered transcript. Actual recording/audio/submission/preparation state still drives presence. Speaking bars follow playback state, never a timer. No rendering switch is shown.
4. Actual `/resume-analyses` workspace has document-led heading, step rail, keyboard-accessible upload/drop zone, blue paper surfaces, aligned independent CV/context panels, readable inputs and action block. Actual report summary is separated from score/axis cards, with real data unchanged. Processing has a document surface and distinguishes report loading from real analysis. Public `/cv-analysis` has qualitative report structure, not fabricated scores.
5. Separate Blender refinement improves concave four-point star eyes, white eye reflection, pointing finger, cloth roughness/sheen, restrained Bezier interpolation and camera. **Character still fails the production fidelity gate.** Product uses official 2D art until visual approval of a better character. Thinking/error use appropriate official poses. The old prototype is preserved.

## Actual integrations and lifecycle

- Direct Three.js, GLTFLoader, RoomEnvironment/PMREM; no Spline iframe or R3F dependency is claimed.
- GSAP + ScrollTrigger + scoped React cleanup; client-only WebGL dynamically loaded. Meaningful landing HTML remains prerenderable/SEO-readable.
- Blender 5.2.2 LTS Python scripts: `scripts/blender/create_nexora_emblem.py`, `scripts/blender/refine_nexora_mascot.py`. Both executed successfully and produced `.blend`, `.glb`, review render.
- Enhancement respects reduced motion, save-data, slow connection and low memory. Unsupported renderer/asset failure/context loss keep an official-emblem 2D fallback in the same reserved space.
- ResizeObserver, IntersectionObserver, document visibility, late-load cancellation, context loss handler, geometry/material/environment disposal and forceContextLoss cleanup are implemented. Scene renders on animation/scroll/resize changes; there is no continuously running WebGL loop in each chapter.
- No texture payloads; tiny emblem needs no texture/mesh compressor overhead. Character assets remain review-only and are not fetched by the product.

Actual GLB measurements:

```json
{
  "public/assets/brand/3d/nexora-emblem.glb": {
    "bytes": 5872,
    "meshes": 1,
    "triangles": 156,
    "textures": 0,
    "clips": []
  },
  "public/assets/mascot/3d/nexora-refined.glb": {
    "bytes": 337828,
    "meshes": 39,
    "triangles": 11989,
    "textures": 0,
    "clips": [
      "idle",
      "speaking",
      "listening",
      "thinking",
      "error",
      "wave"
    ]
  }
}
```

## Character quality limitations

The reference has a tapered/tilted suitcase head, nuanced outline, natural hip stance, cloth folds and expressive hands. The refined asset still has a boxy head, simplified gloves, stiff anatomy/clothing and object-level animation instead of a production rig. It has six playable clips, but no viseme/lip-sync rig. Further work requires sculpted faithful proportions, clean hand topology, tailored clothes/creases, retopology, skeletal rig and authored gesture/face animations before setting `CHARACTER_3D_READY` true. No rough prototype is presented as completed 3D character work.

## Actual validation

- `npm run lint`: exit 0; 0 errors, 193 repository warnings.
- `npx tsc --noEmit`: exit 0.
- `npm test`: 683/683 pass, 0 skipped. Includes interview intent/retry/quota contracts and original + refined GLB clip/transform validation. Only superseded presentation assertions were adjusted for the new direction.
- `npm run build`: exit 0; production compiled and static/dynamic routes generated.
- Playwright: 18/18 pass across cinematic scene/camera, reduced motion, GLB abort, context loss, live preference change, CV public layout/links, route remount, testimonial layout/avatar and five isolated studio visual states at 1440/390/360.
- `git diff --check`: exit 0.
- Real authenticated browser inspection: landing 1440/390 (actual 3D in Playwright), interview 1440/390, CV workspace and existing CV report 1440/390. No auth bypass or fabricated interview/CV API state. Checked initial loading, scroll, question readability, source-mode selection, disabled invalid analysis action, existing report navigation, transcript, text editor opening/closing, and audio stopping.
- No browser console errors/hydration errors observed in real interview/CV views or tested landing/CV introduction. An above-fold logo LCP warning was addressed using eager loading in headers.
- Real browser voice playback became unavailable after navigation in the preview and correctly showed error/retry + readable question. This is a preview audio limitation, not a completed end-to-end audio claim. Microphone/camera capture, new uploads, answer submission and paid actions were not exercised against the user's live records during visual QA.
- Logs in `.playwright-mcp/logs/cinematic-{lint,type,unit,build,e2e}.log`; Blender logs beside them. Earlier failing visual selectors were corrected before the final passing run.

## Preview

- Landing: http://localhost:3000/
- Real Interview Studio: http://localhost:3000/interviews/071c87ec-a9b2-42d7-bc57-7c3f28167838
- CV workspace: http://localhost:3000/resume-analyses
- Public CV introduction: http://localhost:3000/cv-analysis
- Existing real CV report: http://localhost:3000/resume-analyses/1241152b-f29a-4e00-b24e-fa496420055a
- Preview uses existing `.env.local` backend/auth. Local persistent development server listens on port 3000; protected routes require the existing valid user session.

Screenshot evidence (local ignored files, may include private authenticated UI; not published). Browser viewport overrides were 1440/390; IAB JPEG capture excludes its scrollbar/frame area (1434/384 drawable width). Playwright PNG captures use the exact requested widths.

```json
{
  "cinematic-cv-1440.jpg": [
    1434,
    996
  ],
  "cinematic-cv-390.jpg": [
    384,
    831
  ],
  "cinematic-cv-public-1440.png": [
    1440,
    900
  ],
  "cinematic-cv-public-390.png": [
    390,
    900
  ],
  "cinematic-cv-report-1440.jpg": [
    1434,
    996
  ],
  "cinematic-cv-report-390.jpg": [
    384,
    831
  ],
  "cinematic-cv-upload-390.jpg": [
    384,
    831
  ],
  "cinematic-final-cta-1440.jpg": [
    1434,
    996
  ],
  "cinematic-interview-1440.jpg": [
    1434,
    996
  ],
  "cinematic-interview-390.jpg": [
    384,
    831
  ],
  "cinematic-landing-1440.png": [
    1440,
    1000
  ],
  "cinematic-landing-390.png": [
    390,
    1000
  ],
  "cinematic-learning-1440.jpg": [
    1434,
    996
  ],
  "cinematic-scroll-1440.png": [
    1440,
    1000
  ],
  "cinematic-scroll-390.png": [
    390,
    1000
  ]
}
```

## Modified/untracked files at delivery

All files remain uncommitted, including the preserved earlier iteration. Full status:

```text
 M package-lock.json
 M package.json
 M src/app/(dashboard)/interviews/[id]/page.tsx
 M src/app/(dashboard)/resume-analyses/[id]/page.tsx
 M src/app/(dashboard)/resume-analyses/page.tsx
 M src/app/design-system/page.tsx
 M src/app/globals.css
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
?? src/components/features/landing/cinematic.module.css
?? src/styles/nexora-studio-tokens.css
?? tests/e2e/cinematic-redesign.spec.ts
?? tests/e2e/light-editorial-redesign.spec.ts
?? tests/mascotPrototype.test.mjs
```

WAITING_FOR_VISUAL_APPROVAL — NO COMMITS CREATED
