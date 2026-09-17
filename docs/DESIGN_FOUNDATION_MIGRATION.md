# Nexora Design Foundation Migration Documentation

## 1. Production Starting HEAD
- Branch: `feat/design-foundation`
- Starting Commit SHA: `0af254a6324e80edcc33aa9b2cecd0ba76200132` (merged `main` incorporating PRs #1 through #11 plus stabilization commits).


## 2. Prototype Reference HEAD
- Repository: `qbao0111/nexora-prototype`
- Reference Commit SHA: `b5ce405dc6a83acc2e5231c6e6f44f4aa71fb8fc` ("fix: keep interview draft and controls within short viewports").
- Backend Contract Reference: `2a8638cff554eea6be7cd8b35001732e656695a9` (`qbao0111/nexora-backend`).

## 3. Token Mapping

| Category | Canonical Prototype CSS Variable | Value / Usage | Production Status |
| :--- | :--- | :--- | :--- |
| **Surface Base** | `--color-surface` | `#faf8ff` | Defined in `@theme` in `globals.css` |
| **Surface Dim** | `--color-surface-dim` | `#d2d9f4` | Defined in `@theme` in `globals.css` |
| **Surface Bright** | `--color-surface-bright` | `#faf8ff` | Defined in `@theme` in `globals.css` |
| **Surface Low** | `--color-surface-container-low` | `#f2f3ff` | Defined in `@theme` in `globals.css` |
| **Surface Container** | `--color-surface-container` | `#eaedff` | Defined in `@theme` in `globals.css` |
| **Surface High** | `--color-surface-container-high` | `#e2e7ff` | Defined in `@theme` in `globals.css` |
| **Surface Highest** | `--color-surface-container-highest`| `#dae2fd` | Defined in `@theme` in `globals.css` |
| **Text Primary** | `--color-on-surface` | `#131b2e` | Defined in `@theme` in `globals.css` |
| **Text Secondary** | `--color-on-surface-variant` | `#444655` | Defined in `@theme` in `globals.css` |
| **Outline** | `--color-outline` | `#757686` | Defined in `@theme` in `globals.css` |
| **Outline Variant** | `--color-outline-variant` | `#c5c5d7` | Defined in `@theme` in `globals.css` |
| **Primary Brand** | `--color-primary` | `#1b33c7` | Defined in `@theme` in `globals.css` |
| **Primary Container**| `--color-primary-container` | `#3b50df` | Defined in `@theme` in `globals.css` |
| **Primary Fixed** | `--color-primary-fixed` | `#dfe0ff` | Defined in `@theme` in `globals.css` |
| **Primary Fixed Dim**| `--color-primary-fixed-dim` | `#bcc3ff` | Defined in `@theme` in `globals.css` |
| **Secondary** | `--color-secondary` | `#006c49` | Defined in `@theme` in `globals.css` |
| **Secondary Container**| `--color-secondary-container` | `#6cf8bb` | Defined in `@theme` in `globals.css` |
| **Tertiary** | `--color-tertiary` | `#694100` | Defined in `@theme` in `globals.css` |
| **Tertiary Container**| `--color-tertiary-container` | `#ffddb8` | Defined in `@theme` in `globals.css` |
| **Error** | `--color-error` | `#ba1a1a` | Defined in `@theme` in `globals.css` |
| **Error Container**| `--color-error-container` | `#ffdad6` | Defined in `@theme` in `globals.css` |
| **Shadow Subtle** | `--shadow-subtle` | `0 1px 2px 0 rgb(19 27 46 / 0.04), 0 6px 18px -12px rgb(19 27 46 / 0.22)` | Defined in `@theme` |
| **Shadow Card** | `--shadow-card` | `0 10px 26px -16px rgb(19 27 46 / 0.28)` | Defined in `@theme` |
| **Shadow Floating** | `--shadow-floating` | `0 22px 48px -24px rgb(19 27 46 / 0.34)` | Defined in `@theme` |
| **Legacy Compat** | `--color-text-dark`, `--color-bg-light`, etc. | Retained in `:root` | Backward compatibility preserved |

## 4. Primitive Mapping

| Prototype Component | Production Target File | New API / Variants Supported |
| :--- | :--- | :--- |
| `Button.tsx` | `src/components/ui/Button/Button.tsx` & `src/components/ui/Button.tsx` | `variant` (primary, secondary, tonal, outline, ghost, danger), `size` (sm, md, lg), `loading`, `isLoading` (compat), `icon`, `iconPosition`, `fullWidth` |
| `Card.tsx` | `src/components/ui/Card.tsx` | `variant` (elevated, flat, subtle, interactive, selected), `padding` (none, sm, md, lg) |
| `Badge.tsx` | `src/components/ui/Badge.tsx` | `variant` (primary, secondary, tertiary, error, neutral, outline, warning, success, info), `size` (sm, md, lg), `icon` |
| `Input.tsx` | `src/components/ui/Input/Input.tsx` & `src/components/ui/Input.tsx` | `label`, `error`, `type` (password toggle with SVG eye icon), accessibility IDs |
| `Textarea.tsx` | `src/components/ui/Textarea.tsx` | `label`, `helperText`, `error`, full width, focus rings, accessibility ARIA |
| `Select.tsx` | `src/components/ui/Select.tsx` | `label`, `helperText`, `error`, `options`, custom dropdown chevron, native select accessibility |
| `IconButton.tsx` | `src/components/ui/IconButton.tsx` | `icon`, `aria-label` (strictly required), `variant`, `size`, `loading` |
| `Modal.tsx` | `src/components/ui/Modal.tsx` | `isOpen`, `onClose`, `title`, `description`, Escape key handler, body scroll lock, focus/backdrop blur |
| `EmptyState.tsx` | `src/components/ui/EmptyState.tsx` | `icon`, `title`, `description`, `action` CTA, orbit animation |
| `Alert.tsx` | `src/components/ui/Alert.tsx` | `variant` (info, success, warning, error), `title`, `action`, accessible role="alert" |
| `RadialScore.tsx` | `src/components/ui/RadialScore.tsx` | `score` (0-100 or null), `size` (sm, md, lg, number), `label`, `sublabel`, SVG animation |
| `AudioWaveform.tsx`| `src/components/ui/AudioWaveform.tsx`| `isRecording`, animated vertical sound wave bars |
| `ProductFocusedSurface.tsx` | `src/components/ui/ProductFocusedSurface.tsx` | Scoped container with `theme="interview"` dark world encapsulation without global pollution |

## 5. Packages Added / Removed
- **Runtime Packages Added**: None (0 new runtime dependencies).
- **Existing Stack Leveraged**: React 19.2.8, Next.js 16.3.3, Tailwind CSS v4, GSAP 3.15.0, Sonner 2.0.8, Lucide React 1.44.0.
- **Font Integration**: Added Google Fonts `Plus Jakarta Sans` and `Material Symbols Outlined` via `<link rel="stylesheet">` in `src/app/layout.tsx`, while maintaining Next.js `Lexend` font and `Google Sans Flex` fallbacks for diacritics resilience.

## 6. Important Deviations from Prototype
1. **Framer Motion**: Prototype utilizes `framer-motion` for animated score counters and tab layout indicators. In production FE, we avoid adding large new dependencies: motion is implemented via pure CSS transitions, keyframes (`animate-indeterminate`, `animate-scanline`, `animate-float-slow`), and GSAP `matchMedia` hooks (`useGsapScope`, `useProductMotion`).
2. **Backward Compatibility**: Production's existing `Button` component accepted `isLoading` and was imported by multiple admin and auth modules. We created a unified interface supporting both `loading` (prototype convention) and `isLoading` (legacy convention) so no existing screens break.
3. **Typography**: Preserved `Lexend` next/font in `RootLayout` body class as a fallback alongside `Plus Jakarta Sans` to guarantee 100% Vietnamese diacritic coverage.

## 7. Old to New Component Mapping
- Old `src/components/ui/Button/Button.tsx` -> Unified `src/components/ui/Button/Button.tsx` (re-exported at `src/components/ui/Button.tsx` and `src/components/ui/Button/index.ts`).
- Old `src/components/ui/Input/Input.tsx` -> Unified `src/components/ui/Input/Input.tsx` (re-exported at `src/components/ui/Input.tsx` and `src/components/ui/Input/index.ts`).
- Prototype `src/design-system/*` -> Production `src/components/ui/*`.
- Prototype `src/components/product-motion/*` -> Production `src/components/product-motion/*`.
- Prototype `src/components/product-visual/*` -> Production `src/components/product-visual/*`.

## 8. Migration Guidance for Later Feature PRs
When porting screens in future PRs (Public/Auth Shell, Prepare/CV, Interview Room, Practice Hub, Growth/Progress):
1. **Import primitives**: Import from `@/components/ui/<Component>` (e.g. `import { Button } from '@/components/ui/Button';`).
2. **Artwork**: Feature visual artworks are placed in `/assets/features/<feature>/...` and accessed via `<FeatureVisual feature="overview" />`.
3. **Dark Scoped Surface**: In the Interview Room, wrap the call stage in `<ProductFocusedSurface theme="interview">` to automatically adopt the deep navy `#10182f` palette without affecting other dashboard tabs.
4. **Motion**: Use `useProductMotion(rootRef, pathname)` or wrap pages with `<ProductMotionBoundary>` from `@/components/product-motion/ProductMotionBoundary`.

## 9. Screenshots / Verification Notes
- **Dev-Only Showcase**: Created `/design-system` (`src/app/design-system/page.tsx`), guarded with `process.env.NODE_ENV === 'production' && notFound()`.
- **Responsive Breakpoints Tested**:
  - **Desktop (1440px)**: Verified fluid grid layouts, card hover lifts, modal dialog centering, and typography scale.
  - **Tablet (820px)**: Verified grid transitions to 2 columns, button touch targets (min 40px), and horizontal padding safety.
  - **Mobile (390px)**: Verified full-width input controls, responsive 1-column layouts, 32px-48px button heights, and absence of horizontal overflow.
- **Reduced Motion**: Verified that `@media (prefers-reduced-motion: reduce)` sets animation durations to `0.01ms !important` and disables transform/scale decorative loops.

## 10. Known Technical Debt
- Some legacy pages still use local `.module.css` files with hardcoded hex colors (e.g., `DashboardPage.module.css`). These will be refactored to adopt the new primitives during their respective feature PR migrations.
