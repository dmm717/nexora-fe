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
2. **Defensive / Leaked Engineering Copy**: Several customer-facing states surfaced technical testing logic, defensive disclaimers, or system jargon (e.g., *"snapshot bất biến"*, *"không suy luận rằng hồ sơ của bạn đang thiếu bằng chứng"*, *"lưu vết trực tiếp tại đây"*, *"Progress Dashboard chưa có trong gói hiện tại. Các đề xuất độc lập vẫn được giữ nguyên khi có dữ liệu máy chủ."*).
3. **Inverted Visual Hierarchy in Pricing**: Highlighted plans (`isHighlight`) stole the active selection border and ring styling, visually overshadowing the user's actual subscribed plan (`isCurrentPlan`).
4. **Unlocalized Billing Statuses**: Raw English backend order statuses (such as `processing`) bypassed localization in customer transaction tables.
5. **Inline Validation Concatenation Bug**: In CV analysis, adjacent JSX conditional strings concatenated into unformatted runs (e.g., `• Vui lòng bổ sung CV...• Vui lòng nhập tiêu đề...`).
6. **Delayed Value on Landing**: Interactive feature demos required clicking "Xem thử" before showcasing rich outcomes, showing visitors empty or placeholder states by default.

This document formalizes the audit findings and establishes the technical implementation roadmap to make Nexora feel **deliberate, premium, trustworthy, human-written, and unmistakably branded**.

---

## 2. Detailed Audit Findings & Corrective Plan

### 2.1 Brand Identity & Header (`src/components/header/AuthenticatedHeader.tsx`)
- **Current Defect**: Lines 81–89 render a synthetic container:
  ```tsx
  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-primary/90 transition-colors">N</div>
  <div className="flex items-center gap-1.5"><span className="font-bold text-lg text-on-surface tracking-tight">Nexora</span>...</div>
  ```
- **Correction**: Replace synthetic block with canonical `<NexoraLogo variant="horizontal" className="h-7 w-auto object-contain" />`. Preserves responsive badge and active route highlights while maintaining unified brand identity with marketing views.

### 2.2 Design Foundation & Surface Hierarchy (`src/app/globals.css`, `src/styles/product-visual.css`)
- **Current Defect**: Card borders using faint `border-outline-variant/20` or `/30` lack structural definition on modern high-DPI and bright mobile screens, causing surfaces to bleed into page backgrounds.
- **Correction**:
  - Calibrate primary card boundaries to `border-outline-variant/60` (or `border-outline/25` where contrast requires).
  - Define explicit surface tiers: `flat`, `elevated`, `subtle`, `interactive`, and `selected` / `active`.
  - Maintain soft ambient elevation (`--shadow-subtle`, `--shadow-card`, `--shadow-floating`) with low-opacity dark tints.

### 2.3 Shared UI Primitives (`src/components/ui/`)
- **`Card.tsx`**: Add `selected` variant with subtle primary accent ring and border (`border-primary bg-primary-fixed/5 ring-1 ring-primary/20`).
- **`Badge.tsx`**: Standardize variant classes:
  - `success`: emerald container with high-contrast text.
  - `warning`: amber container with high-contrast text.
  - `info`: blue container with high-contrast text.
  - `error`: rose container with high-contrast text.
- **`Alert.tsx` / `EmptyState.tsx`**: Clean, accessible markup with purposeful iconography, clear titles, readable line-heights, and prominent call-to-action buttons.

### 2.4 Landing Page Value Delivery (`src/components/features/landing/MarketingLanding.tsx`)
- **Current Defect**: Visitors initially saw `cvDemoStage === 'empty'` with "Chưa có CV chính" and an action button "Xem thử cách phân tích", concealing the analysis capability until an explicit click.
- **Correction**: Default `cvDemoStage` to `'result'`. Visitors immediately see the 78/100 readiness ring, category scores, and concrete feedback with a subtle "Ví dụ kết quả" badge. The "Xem lại cách phân tích" button remains available to re-run the animation.

### 2.5 Pricing & Billing Architecture (`PricingCards.tsx`, `billing/page.tsx`)
- **Hierarchy Correction in `PricingCards.tsx`**:
  - **Ownership of Selection**: `isCurrentPlan` must own the primary selection boundary (`border-2 border-primary ring-2 ring-primary/20 bg-primary-fixed/5`).
  - **Popular Highlight**: `isHighlight` receives a prominent badge/rail ("PHỔ BIẾN NHẤT") and elevated shadow, but NOT the active selection boundary.
  - **Fallback Copy**: Replace `"Thông tin quyền lợi được cung cấp trực tiếp từ cấu hình gói."` with human, encouraging product copy: `"Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn."`
  - **Typography**: Boost feature descriptions and quota text to clear, comfortable font sizes and weights.
- **Billing Page Status Mapping in `billing/page.tsx`**:
  - Introduce full semantic mapping for order statuses:
    - `fulfilled` -> `"Thành công"` (`variant="success"`)
    - `pending` -> `"Đang chờ thanh toán"` (`variant="warning"`)
    - `processing` -> `"Đang xử lý"` (`variant="info"`)
    - `failed` -> `"Thất bại"` (`variant="error"`)
    - `cancelled` -> `"Đã hủy"` (`variant="neutral"`)

### 2.6 CV Analysis & Realtime Flow (`resume-analyses/page.tsx`, `resume-analyses/[id]/page.tsx`)
- **Fix Inline Validation Concatenation Defect**:
  - Refactor adjacent JSX conditionals in `src/app/(dashboard)/resume-analyses/page.tsx` into a structured message array rendered as discrete list items or clean stacked messages.
- **Remove AI Slop / Machine Jargon**:
  - Replace `"snapshot bất biến"` with `"Báo cáo phân tích chuyên sâu giữ nguyên bối cảnh tại thời điểm đánh giá."`
  - Replace `"Báo cáo phân tích chuyên sâu · Bất biến"` with `"Báo cáo phân tích chuyên sâu · Bản lưu trữ"`.

### 2.7 Overview & Dashboard Experience (`overview/page.tsx`)
- **Hero & Insight Copy**:
  - Remove leaked internal test statements:
    - Replace `"Không thể tải Progress Dashboard lúc này. Nexora không suy luận rằng hồ sơ của bạn đang thiếu bằng chứng."` with `"Chưa thể tải dữ liệu tiến độ lúc này. Bạn có thể làm mới trang để thử lại."`
    - Replace `"Progress Dashboard chưa có trong gói hiện tại. Các đề xuất độc lập vẫn được giữ nguyên khi có dữ liệu máy chủ."` with `"Theo dõi tiến độ là tính năng nâng cao. Bạn có thể nâng cấp gói bất kỳ lúc nào để kích hoạt."`
    - Replace `"Nâng cấp gói để sử dụng Progress Dashboard. Không có điểm số nào được suy luận thay thế."` with `"Nâng cấp gói để mở khóa bảng theo dõi tiến độ và bản đồ năng lực chuyên sâu."`
    - Replace `"Khi Progress Dashboard khả dụng, Nexora sẽ nối bằng chứng mới nhất vào mục tiêu hiện tại mà không tự suy luận trạng thái còn thiếu."` with `"Mỗi lượt phỏng vấn và phân tích CV được hệ thống tổng hợp để cập nhật mức độ sẵn sàng của bạn."`
  - Remove `"lưu vết trực tiếp tại đây"` and replace with `"Lịch sử phân tích CV, mock interview và bài tập phản xạ của bạn sẽ xuất hiện tại đây."`

### 2.8 Practice Hub & Scenario Academy (`PracticeHub.tsx`)
- Replace `"lưu vết đầy đủ tại đây"` with `"Lịch sử các bài tập phỏng vấn giả lập, xử lý tình huống và phản xạ STAR của bạn sẽ xuất hiện tại đây."`
- Maintain high-contrast card outlines and readable progress metrics.

---

## 3. Product Copywriting & Anti-Slop Matrix

| Location | Previous / Flawed Text | Redesigned Human-Crafted Text | Rationale |
| :--- | :--- | :--- | :--- |
| `AuthenticatedHeader.tsx` | Blue `[N]` square + text | `<NexoraLogo variant="horizontal" />` | Official brand asset replaces placeholder initials. |
| `PricingCards.tsx` | `"Thông tin quyền lợi được cung cấp trực tiếp từ cấu hình gói."` | `"Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn."` | Removes raw technical config phrasing. |
| `PricingCards.tsx` | Selection border on `isHighlight` | Selection border on `isCurrentPlan`; `isHighlight` has prominent badge only | Eliminates confusion regarding which plan is actually active. |
| `billing/page.tsx` | `{o.status}` (`processing`, `failed`, `cancelled`) | `"Đang xử lý"`, `"Thất bại"`, `"Đã hủy"` | 100% localized transaction table. |
| `resume-analyses/page.tsx` | `• Vui lòng bổ sung CV...• Vui lòng nhập JD...` | Clean structured list with individual items | Eliminates unformatted inline string concatenation bug. |
| `resume-analyses/page.tsx` | `"snapshot bất biến"` | `"kết quả lưu trữ cố định"` / `"giữ nguyên bối cảnh"` | Replaces database/snapshot jargon with clear candidate language. |
| `overview/page.tsx` | `"không suy luận rằng hồ sơ của bạn đang thiếu bằng chứng"` | `"Chưa thể tải dữ liệu tiến độ lúc này. Bạn có thể làm mới trang để thử lại."` | Removes defensive engineering disclaimer. |
| `overview/page.tsx` | `"lưu vết trực tiếp tại đây"` | `"Lịch sử phân tích và luyện tập sẽ xuất hiện tại đây."` | Human, encouraging phrasing. |
| `PracticeHub.tsx` | `"lưu vết đầy đủ tại đây"` | `"Lịch sử luyện tập của bạn sẽ xuất hiện tại đây."` | Human, encouraging phrasing. |
| `MarketingLanding.tsx` | Default `cvDemoStage: 'empty'` | Default `cvDemoStage: 'result'` | Showcases immediate value on first visit without requiring clicks. |

---

## 4. Architectural Invariants & Non-Regressions

Throughout this redesign:
1. **Session & Auth Invariants**: Zero changes to memory-only access tokens, token refresh locks, or `AuthBootstrapProvider`.
2. **Billing & PayOS Invariants**: Zero changes to query parameters, canonical checkout redirects, return paths, or price database IDs.
3. **Speech & Interview Invariants**: Azure DragonHD TTS and Web Speech STT flows remain untouched.
4. **Camera Invariants (PR #43)**: Ephemeral client-only local camera preview tile, hooks, and clean unmount lifecycles remain completely intact.
5. **Motion Invariants**: GSAP animations and `@media (prefers-reduced-motion: reduce)` guards are preserved.
6. **No Fake Data**: No mocked metrics, hardcoded pricing numbers, or synthetic testimonials in authenticated views.

---

## 5. Verification & Test Plan

1. **Automated Unit & Contract Tests**:
   - Run `npm test` verifying all 559+ tests pass without failure.
   - Add new test suite `tests/productRedesignAudit.test.mjs` verifying:
     - AuthenticatedHeader renders `NexoraLogo`.
     - Pricing card selection border is owned by `isCurrentPlan`.
     - Billing order status localization handles `processing`, `fulfilled`, `pending`, `failed`, `cancelled`.
     - CV analysis validation messages render cleanly without concatenated bullet points.
     - Banned AI-slop phrases (`"snapshot bất biến"`, `"suy luận rằng hồ sơ"`, `"lưu vết trực tiếp"`) are absent from target files.
2. **Type Checking & Linting**:
   - `npx tsc --noEmit`
   - `npm run lint`
3. **Production Build**:
   - `npm run build`
