# Nexora Product-Wide UI/UX & Copy Redesign Audit

**Date**: September 2026  
**Repository**: `dmm717/nexora-fe`  
**Branch**: `redesign/product-ui-copy-audit`  
**Scope**: Product-wide UI/UX surface hierarchy, design foundation, typography, branding consistency, and human-crafted copywriting across all authenticated and public views.

---

## 1. Executive Summary & Objectives

Nexora is functionally mature, robust, and verified across critical customer paths (authentication, PayOS billing, career profiling, multi-format CV analysis, structured AI interviews, Azure speech integration, and local camera preview). 

However, visual and copywriting audits revealed patterns typical of iterative feature delivery:
1. **Inconsistent Brand Identity**: Authenticated header used an ad-hoc blue square with the letter "N" rather than the official vector `NexoraLogo`.
2. **Defensive / Leaked Engineering Copy**: Several customer-facing states surfaced technical testing logic, defensive disclaimers, or system jargon (e.g., *"máy chủ"*, *"snapshot bất biến"*, *"không suy luận rằng hồ sơ của bạn đang thiếu bằng chứng"*, *"lưu vết trực tiếp tại đây"*, *"Progress Dashboard chưa có trong gói hiện tại"*, *"SignalR / REST"*, *"Immutable Snapshot"*).
3. **Inverted Visual Hierarchy in Pricing**: Highlighted plans (`isHighlight`) stole the active selection border and ring styling, visually overshadowing the user's actual subscribed plan (`isCurrentPlan`). Popular plan badges used 9–10px micro-labels.
4. **Weak Landing Plan Boundaries & Micro-Typography**: The public landing pricing cards lacked visible container boundaries, merging into the page background, with decision-critical features rendered at 9–11px fine print.
5. **Unlocalized Billing Statuses**: Raw English backend order statuses (such as `processing`, `paid`, or unknown codes) bypassed localization or rendered raw enums in customer transaction tables.
6. **Inline Validation Concatenation Bug**: In CV analysis, adjacent JSX conditional strings concatenated into unformatted runs (e.g., `• Vui lòng bổ sung CV...• Vui lòng nhập tiêu đề...`).
7. **Delayed Value on Landing**: Interactive feature demos required clicking "Xem thử" before showcasing rich outcomes, showing visitors empty or placeholder states by default.

This document formalizes the audit findings and establishes the technical implementation roadmap to make Nexora feel **deliberate, premium, trustworthy, human-written, and unmistakably branded**.

---

## 2. Coverage Status Definitions

To ensure complete accuracy, each audited component and route is classified under two explicit axes:

- **Code Status**:
  - `MODIFIED`: Source code modified directly in this PR.
  - `INSPECTED / NO CHANGE NEEDED`: Actual source code inspected and confirmed already compliant with design standards.
- **Visual QA Status**:
  - `VISUALLY QA'D`: Rendered, inspected, and verified across viewports (1440px+, 1024px, 768px, 390px).
  - `SOURCE REVIEW ONLY`: Inspected in code; visual verification relies on underlying shared component primitives.
  - `NOT VERIFIED`: Not visually rendered or confirmed.

---

## 3. Route Family Audit & Inspection Matrix

| Route Family / Surface | Actual Component Path(s) | Code Status | Visual QA Status | Key Improvements / Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Global Branding & Header** | `src/components/header/AuthenticatedHeader.tsx` | **MODIFIED** | **VISUALLY QA'D** | Replaced synthetic blue `[N]` square with official `<NexoraLogo variant="horizontal" />`. Cleaned responsive nav spacing and active route indicators. |
| **Design Tokens & Primitives** | `src/components/ui/Card.tsx`<br>`src/app/design-system/page.tsx` | **MODIFIED** | **VISUALLY QA'D** | Added `selected` variant to `Card.tsx` (`border-2 border-primary shadow-subtle ring-2 ring-primary-fixed/30 bg-primary-fixed/10`). Updated design system showcase. |
| **Global Styles & Primitives** | `src/app/globals.css`<br>`src/components/ui/Badge.tsx` | **INSPECTED / NO CHANGE NEEDED** | **VISUALLY QA'D** | Tokens and badge variants (`primary`, `secondary`, `tertiary`, `error`, `neutral`, `outline`, `warning`, `success`, `info`) were inspected and confirmed complete. |
| **Landing & Public Marketing** | `src/components/features/landing/MarketingLanding.tsx`<br>`src/components/features/landing/LandingPlanCard.tsx`<br>`src/components/features/landing/landing.module.css` | **MODIFIED** | **VISUALLY QA'D** | Defaulted `cvDemoStage` to `'result'` for instant outcome demonstration. Replaced weak plan cards with distinct white surfaces, restrained `1px solid #dce0f2` boundary, prominent detached recommendation badge with Sparkles (`text-xs font-bold`), and upgraded readable typography (13–14px). |
| **Pricing** | `src/components/features/pricing/PricingCards.tsx` | **MODIFIED** | **VISUALLY QA'D** | Transferred selection border strictly to `isCurrentPlan`. Upgraded popular plan marker to prominent detached badge with Sparkles icon (`text-xs font-bold`). Replaced technical config copy with human candidate phrasing. |
| **Billing & Transactions** | `src/app/(dashboard)/billing/page.tsx`<br>`src/services/billingPresentation.ts` | **MODIFIED** | **VISUALLY QA'D** | Added shared `getOrderStatusPresentation` mapping all statuses (`fulfilled`, `success`, `completed`, `paid`, `pending`, `processing`, `failed`, `cancelled`, `canceled`), safely falling back to `"Đang cập nhật"` (`neutral`). Upgraded popular badge to detached top marker. Removed duplicate presenter from page. Removed "máy chủ" from webhook error banner. |
| **Account & Subscription** | `src/components/features/account/PlanUsageCard.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Integrated shared `getOrderStatusPresentation` for order status column instead of raw `{order.status}` strings. Upgraded `text-[11px]` labels to `text-xs font-semibold`. |
| **Dashboard Overview** | `src/app/(dashboard)/overview/page.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Eliminated all occurrences of "máy chủ", "suy luận", "lưu vết", and "Progress Dashboard" system references. Replaced defensive fallback statements with clear guidance. Upgraded micro-labels (`text-[10px]`, `text-[11px]`) to `text-xs`. |
| **CV / Resume Analysis** | `src/app/(dashboard)/resume-analyses/page.tsx`<br>`src/app/(dashboard)/resume-analyses/[id]/page.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Fixed inline validation concatenation bug with structured list. Replaced "snapshot bất biến" and "Bất biến" with "Báo cáo phân tích chuyên sâu · Bản lưu trữ". Removed "phản hồi máy chủ" and upgraded micro-text. |
| **AI Interview Room & Setup** | `src/app/(dashboard)/interviews/[id]/page.tsx`<br>`src/app/(dashboard)/interviews/new/page.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed "máy chủ xác nhận" and "máy chủ quyết định" in room access and startup copy. Preserved ephemeral local camera feature (PR #43) with zero regressions. |
| **Interview Report** | `src/app/(dashboard)/interviews/[id]/report/page.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Replaced "Bản chụp bối cảnh lịch sử", "snapshot năng lực", and "Immutable Snapshot" with "Bối cảnh của báo cáo" and `<Badge variant="outline" size="sm">Bản lưu trữ</Badge>`. |
| **Analytics & Progress** | `src/app/(dashboard)/analytics/page.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed all occurrences of "Progress Dashboard" system object and "máy chủ". Replaced technical error copy with natural Vietnamese candidate phrasing. Upgraded `text-[11px]` to `text-xs`. |
| **Practice Hub** | `src/components/features/practice/PracticeHub.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Replaced "Q1-Q3 thuộc phạm vi miễn phí; quyền tiếp tục do máy chủ xác nhận", "lấy trực tiếp từ máy chủ", and "backend trả về" with clear candidate value bullets. |
| **STAR Practice** | `src/components/features/practice/StarPractice.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed all occurrences of "máy chủ", "SignalR", "REST", and "component STAR". Replaced with clear, polite progress states and evaluation feedback. |
| **Scenario Practice** | `src/components/features/scenarios/ScenarioPractice.tsx`<br>`src/components/features/scenarios/ScenarioEvaluationView.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed "máy chủ chưa trả về" and "Điểm số không được suy đoán". Replaced with clean user-facing evaluation fallback copy. |
| **Payment Verification** | `src/components/features/payment/PaymentResultPage.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Replaced "đối chiếu giao dịch với máy chủ" and "nhận được xác nhận thanh toán từ máy chủ" with reassuring, secure customer messaging. |
| **Session & Auth Recovery** | `src/components/providers/RequireAuth.tsx`<br>`src/utils/errorTranslator.ts`<br>`src/services/apiClient.ts`<br>`src/services/cvAnalysisApi.ts` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed "máy chủ" from network/session error fallbacks, standardizing on human-friendly connection error copy. |
| **Admin Dashboard** | `src/components/features/admin/dashboard/AdminDashboardScreen.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Added safe fallback to `"Đang cập nhật"` for unknown transaction statuses in `StatusBadge`. |
| **Authentication Screen** | `src/app/auth/page.tsx`<br>`src/app/verify-email/page.tsx` | **INSPECTED / NO CHANGE NEEDED** | **SOURCE REVIEW ONLY** | Multi-mode authentication view handling both login and register modes, with clean tabbed navigation, official brand assets, and proper error handling. |
| **Career Profile & Goals** | `src/components/features/career-profile/CareerGoalsSection.tsx`<br>`src/components/features/career-profile/ResumeManagementSection.tsx` | **INSPECTED / NO CHANGE NEEDED** | **SOURCE REVIEW ONLY** | Inspected and confirmed using standard Card primitives, clear modal dialogs, and proper empty states. |
| **Skill Profile Breakdown** | `src/components/features/skill-profile/SkillProfile.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed English jargon `(Weakness Signals)` and "máy chủ chưa trả về" in weakness signals section. |
| **Learning Path View** | `src/components/features/learning-path/LearningPathView.tsx` | **MODIFIED** | **SOURCE REVIEW ONLY** | Removed defensive engineer phrasing "Đây là lỗi kết nối hoặc máy chủ, không phải trạng thái 'chưa tạo'". |
| **Live Speech Audio Dock** | `src/components/features/interview/AudioSpeechDock.tsx` | **INSPECTED / NO CHANGE NEEDED** | **SOURCE REVIEW ONLY** | Retains full audio level meter, STT/TTS toggle, clean responsive layout, and seamless interview integration. |

---

## 4. Product Copywriting & Anti-Slop Matrix

| Location | Previous / Flawed Text | Redesigned Human-Crafted Text | Rationale |
| :--- | :--- | :--- | :--- |
| `AuthenticatedHeader.tsx` | Blue `[N]` square + text | `<NexoraLogo variant="horizontal" />` | Official brand asset replaces placeholder initials. |
| `LandingPlanCard.tsx` | `.planCard` no border, 9px badge, 10–11px text | Visible `1px solid #dce0f2` border, detached `text-xs font-bold` recommendation badge with Sparkles, readable 13–14px typography | Eliminates card blending, delivers clear recommendation marker, and treats pricing as primary decision content. |
| `PricingCards.tsx` | `"Thông tin quyền lợi được cung cấp trực tiếp từ cấu hình gói."` | `"Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn."` | Removes raw technical config phrasing. |
| `PricingCards.tsx` | Selection border on `isHighlight` | Selection border on `isCurrentPlan`; `isHighlight` has detached prominent top badge | Eliminates confusion regarding which plan is actually active. |
| `billing/page.tsx` | `{o.status}` (`processing`, `failed`, `cancelled`) | `"Đang xử lý"`, `"Thất bại"`, `"Đã hủy"`, `"Đang cập nhật"` | 100% localized transaction table using shared presenter. |
| `PlanUsageCard.tsx` | `{order.status}` raw enum string | `getOrderStatusPresentation(order.status).label` | Safe localization for all transaction statuses. |
| `resume-analyses/page.tsx` | `• Vui lòng bổ sung CV...• Vui lòng nhập JD...` | Clean structured list with individual items | Eliminates unformatted inline string concatenation bug. |
| `resume-analyses/page.tsx` | `"snapshot bất biến"` | `"kết quả lưu trữ cố định"` / `"giữ nguyên bối cảnh"` | Replaces database/snapshot jargon with clear candidate language. |
| `interviews/[id]/report/page.tsx` | `"Bản chụp bối cảnh lịch sử"` / `"Immutable Snapshot"` | `"Bối cảnh của báo cáo"` / `<Badge variant="outline">Bản lưu trữ</Badge>` | Eliminates developer jargon in evaluation report. |
| `overview/page.tsx` | `"không suy luận rằng hồ sơ của bạn đang thiếu bằng chứng"` | `"Chưa thể tải dữ liệu tiến độ lúc này. Bạn có thể làm mới trang để thử lại."` | Removes defensive engineering disclaimer. |
| `overview/page.tsx` | `"lưu vết trực tiếp tại đây"` | `"Lịch sử phân tích và luyện tập sẽ xuất hiện tại đây."` | Human, encouraging phrasing. |
| `PracticeHub.tsx` | `"quyền tiếp tục do máy chủ xác nhận"` | `"3 câu hỏi trải nghiệm miễn phí; mở rộng toàn diện theo gói dịch vụ"` | Replaces backend authorization jargon with candidate value. |
| `StarPractice.tsx` | `"SignalR"`, `"REST"`, `"máy chủ"` | Polite loading, clear analysis status, human fallback alerts | Eliminates all architecture terminology from candidate view. |
| `PaymentResultPage.tsx` | `"đối chiếu giao dịch với máy chủ"` | `"Nexora đang xác thực giao dịch thanh toán của bạn một cách an toàn."` | Reassuring, secure payment message. |
| `MarketingLanding.tsx` | Default `cvDemoStage: 'empty'` | Default `cvDemoStage: 'result'` | Showcases immediate value on first visit without requiring clicks. |

---

## 5. Architectural Invariants & Non-Regressions

Throughout this redesign:
1. **Session & Auth Invariants**: Zero changes to memory-only access tokens, token refresh locks, or `AuthBootstrapProvider`.
2. **Billing & PayOS Invariants**: Zero changes to query parameters, canonical checkout redirects, return paths, or price database IDs.
3. **Speech & Interview Invariants**: Azure DragonHD TTS and Web Speech STT flows remain untouched.
4. **Camera Invariants (PR #43)**: Ephemeral client-only local camera preview tile, hooks, and clean unmount lifecycles remain completely intact.
5. **Motion Invariants**: GSAP animations and `@media (prefers-reduced-motion: reduce)` guards are preserved.
6. **No Fake Data**: No mocked metrics, hardcoded pricing numbers, or synthetic testimonials in authenticated views.

---

## 6. Verification & Test Plan

1. **Automated Unit & Contract Tests**:
   - `node --test tests/productRedesignAudit.test.mjs` (All assertions passing)
   - `npm test` (all suites passing)
2. **Type Checking & Linting**:
   - `npx tsc --noEmit`
   - `npm run lint`
3. **Production Build**:
   - `npm run build`
4. **Visual QA Verifications**:
   - Executed across Desktop (1440px+), Laptop/Tablet landscape (1024px), Tablet portrait (768px), and Mobile (390px).


