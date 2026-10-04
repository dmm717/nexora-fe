# Nexora route inventory and visual-change audit

57 App Router page source owners inspected. Source inventory and dependency review are distinct from real browser verification; the last column states exactly what was changed or left intact. `/ai-interview` is a next.config compatibility redirect, not an additional page source.

| Route | Source owner | Change / verification scope |
| --- | --- | --- |
| `/admin/feedback` | `src/app/(admin)/admin/feedback/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/admin` | `src/app/(admin)/admin/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/admin/plans` | `src/app/(admin)/admin/plans/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/admin/scenarios` | `src/app/(admin)/admin/scenarios/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/admin/site-content` | `src/app/(admin)/admin/site-content/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/admin/transactions` | `src/app/(admin)/admin/transactions/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/admin/users` | `src/app/(admin)/admin/users/page.tsx` | Admin content, role guards and workflows preserved. Root font inherited; no page redesign or real-admin QA. |
| `/account` | `src/app/(dashboard)/account/page.tsx` | Existing redirect to /settings preserved; no account-flow rewrite; compatibility/logout E2E. |
| `/analytics` | `src/app/(dashboard)/analytics/page.tsx` | Shared workspace hero, paper capabilities illustration; data calculations preserved; four-size QA. |
| `/billing` | `src/app/(dashboard)/billing/page.tsx` | Payment recovery compatibility preserved; normal entry forwards safely to pricing; shared styles inherited; source audit, no real payment mutation QA. |
| `/career-goals` | `src/app/(dashboard)/career-goals/page.tsx` | Shared workspace heading and paper career-context illustration; goal actions preserved; four-size QA. |
| `/career-profile` | `src/app/(dashboard)/career-profile/page.tsx` | Existing redirect to /profile or /career-goals preserved; unused old screen not revived; actual redirect inspected. |
| `/cv-analysis/history` | `src/app/(dashboard)/cv-analysis/history/page.tsx` | Shared workspace/archive heading, localized statuses and dense rows; four-size QA. |
| `/interviews/[id]` | `src/app/(dashboard)/interviews/[id]/page.tsx` | Ambient studio, reachable dock, real-state mascot presentation; valid existing session checked at four sizes. |
| `/interviews/[id]/report` | `src/app/(dashboard)/interviews/[id]/report/page.tsx` | Shared navigation/font/ambient inheritance; existing report structure and scores preserved; real report checked at four sizes. |
| `/interviews/history` | `src/app/(dashboard)/interviews/history/page.tsx` | Shared hero/paper interview artwork and history surfaces; four-size QA. |
| `/interviews/new` | `src/app/(dashboard)/interviews/new/page.tsx` | Paper interview hero, compact setup, reachable CTA above microphone panel; four-size QA. |
| `/interviews` | `src/app/(dashboard)/interviews/page.tsx` | Shared interview hub heading and paper interview illustration; real continuation link checked; four-size QA. |
| `/job-descriptions/[id]` | `src/app/(dashboard)/job-descriptions/[id]/page.tsx` | Secondary detail/compatibility page preserved; shared shell/font inherited; source audit only, no content rewrite or four-size browser claim. |
| `/job-descriptions` | `src/app/(dashboard)/job-descriptions/page.tsx` | Existing CV-themed hero and CRUD behavior preserved; inherits shared hero/nav/font/surfaces; source audit only in this pass. |
| `/learning-path` | `src/app/(dashboard)/learning-path/page.tsx` | Shared heading with paper roadmap and existing actions; generation/completion logic preserved; four-size QA. |
| `/overview` | `src/app/(dashboard)/overview/page.tsx` | Shared hero and paper overview illustration; four-size real-account QA. |
| `/payment-history` | `src/app/(dashboard)/payment-history/page.tsx` | Shared archive heading and responsive payment rows; no checkout change; four-size QA. |
| `/practice` | `src/app/(dashboard)/practice/page.tsx` | Shared hero and paper practice illustration; four-size real-account QA. |
| `/practice/scenarios/[slug]` | `src/app/(dashboard)/practice/scenarios/[slug]/page.tsx` | Secondary detail/compatibility page preserved; shared shell/font inherited; source audit only, no content rewrite or four-size browser claim. |
| `/practice/scenarios` | `src/app/(dashboard)/practice/scenarios/page.tsx` | Uses canonical scenario catalogue; shared paper branch illustration; four-size QA. |
| `/practice/star` | `src/app/(dashboard)/practice/star/page.tsx` | Shared heading and paper STAR illustration; real entitlement/attempt logic preserved; four-size QA. |
| `/profile` | `src/app/(dashboard)/profile/page.tsx` | Shared workspace heading, paper identity illustration and wrapping; forms preserved; four-size QA. |
| `/resume-analyses/[id]` | `src/app/(dashboard)/resume-analyses/[id]/page.tsx` | Ambient report layout and readable score panels; real report checked at four sizes. |
| `/resume-analyses` | `src/app/(dashboard)/resume-analyses/page.tsx` | Document-focused blue workspace, native tilted paper CV hero; real upload/analysis logic preserved; four-size QA. |
| `/resumes` | `src/app/(dashboard)/resumes/page.tsx` | Existing CV hero and management actions preserved; inherits shared hero/nav/font/surfaces; source audit only in this pass. |
| `/scenarios/[slug]` | `src/app/(dashboard)/scenarios/[slug]/page.tsx` | Secondary detail/compatibility page preserved; shared shell/font inherited; source audit only, no content rewrite or four-size browser claim. |
| `/scenarios` | `src/app/(dashboard)/scenarios/page.tsx` | Shared heading with paper branch illustration; catalogue filters/recommendations preserved; canonical practice alias checked at four sizes. |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | Shared workspace heading and paper sliders illustration; account actions preserved; four-size QA. |
| `/skill-profile` | `src/app/(dashboard)/skill-profile/page.tsx` | Existing ProductPageHero inherits new paper capabilities artwork, navigation and font; no data rewrite; source audit only in this pass. |
| `/star-builder` | `src/app/(dashboard)/star-builder/page.tsx` | Compatibility builder receives shared paper STAR heading; attempt semantics unchanged; four-size QA. |
| `/about` | `src/app/about/page.tsx` | Existing editorial content preserved; shared navigation/font/ambient shell; desktop/mobile E2E. |
| `/ai` | `src/app/ai/page.tsx` | Old generic AI shell, no canonical navigation dependency; source audit only; deliberately not redesigned or deleted. |
| `/auth` | `src/app/auth/page.tsx` | Authentication/recovery behavior preserved. Root font inherited; no form redesign. Existing login/logout regression coverage retained. |
| `/courses` | `src/app/courses/page.tsx` | Undeveloped legacy placeholder; source audit only; left intact rather than inventing learning functionality. |
| `/cv-analysis` | `src/app/cv-analysis/page.tsx` | Public product intro keeps approved document direction; links to actual /resume-analyses; desktop/mobile E2E. |
| `/design-system` | `src/app/design-system/page.tsx` | Developer-only isolated studio showcase for visual states; no authentication bypass or invented product results. |
| `/fake-payments/[transactionId]` | `src/app/fake-payments/[transactionId]/page.tsx` | Existing payment return/development flow preserved; root font inherited; no real payment action or visual rewrite. |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Authentication/recovery behavior preserved. Root font inherited; no form redesign. Existing login/logout regression coverage retained. |
| `/interview` | `src/app/interview/page.tsx` | Obsolete local demo replaced by server redirect to /interviews/new; intent/compatibility E2E. |
| `/interview/room` | `src/app/interview/room/page.tsx` | Obsolete no-ID simulated room replaced by redirect to real /interviews hub; compatibility E2E. |
| `/` | `src/app/page.tsx` | Cinematic intro, real emblem, five-step journey and shared menu; browser + motion E2E. |
| `/payment/cancel` | `src/app/payment/cancel/page.tsx` | Existing payment return/development flow preserved; root font inherited; no real payment action or visual rewrite. |
| `/payment/success` | `src/app/payment/success/page.tsx` | Existing payment return/development flow preserved; root font inherited; no real payment action or visual rewrite. |
| `/plans` | `src/app/plans/page.tsx` | Old pricing prototype still referenced by PublicLayout; source audit only; deliberately not removed without resolving compatibility. |
| `/pricing` | `src/app/pricing/page.tsx` | Shared navigation, paper access-key hero, mobile column correction; checkout logic preserved; four-size QA and E2E. |
| `/privacy` | `src/app/privacy/page.tsx` | Existing legal body and interactions preserved; shared navigation/font; desktop/mobile E2E. |
| `/public` | `src/app/public/page.tsx` | Old public prototype with legacy resume link; source audit only; left intact, outside canonical product flow. |
| `/reset-password` | `src/app/reset-password/page.tsx` | Authentication/recovery behavior preserved. Root font inherited; no form redesign. Existing login/logout regression coverage retained. |
| `/status` | `src/app/status/page.tsx` | Existing home redirect retained; E2E. |
| `/terms` | `src/app/terms/page.tsx` | Existing legal body and interactions preserved; shared navigation/font; desktop/mobile E2E. |
| `/verify-email` | `src/app/verify-email/page.tsx` | Authentication/recovery behavior preserved. Root font inherited; no form redesign. Existing login/logout regression coverage retained. |
