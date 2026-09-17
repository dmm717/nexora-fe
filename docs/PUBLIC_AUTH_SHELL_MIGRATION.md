# Public / Auth Shell Migration Report

## 1. Verified Starting HEADs
- **Production FE starting HEAD**: `8ead2489af11123466a4f650c71d9044c70e4cbf` (Ancestor check verified for Design Foundation PR #12: `0e3ad75bb2123935173d601e0a22578c7a896108`).
- **Prototype Reference HEAD**: `46711620c8f184adcf3fab63b932823eade4a841`.

## 2. Route & Component Migration Mapping

### Navigation & Route Mapping
| Prototype Reference | Production Route | Behavior & Auth Intent |
| :--- | :--- | :--- |
| **Phân tích CV** (`/#cv-analysis`) | `/#cv-analysis` (Landing) / `/cv-analysis` | Smooth scroll on landing; direct link to `/cv-analysis` on inner pages. |
| **Phỏng vấn AI** (`/#ai-interview`) | `/#ai-interview` (Landing) / `/interview` | Smooth scroll on landing; directs to interview setup/wizard. |
| **Luyện tập** (`/#practice`) | `/#practice` | Smooth scroll to Practice section (links to `/scenarios` and `/star-builder`). |
| **Năng lực** (`/#capabilities`) | `/#capabilities` | Smooth scroll to Capabilities section (links to `/overview` / `/analytics`). |
| **Bảng giá** (`/pricing`) | `/pricing` | Public pricing page displaying real plans from `billingApi.getPlans()`. |
| **Vào Dashboard** (Auth CTA) | `/overview` | Direct access for authenticated visitors; preserved in Header. |

### Component Architecture
| Prototype Component | Production Target | Implementation Details |
| :--- | :--- | :--- |
| `PublicMarketingShell` | `src/components/layouts/Header.tsx` & `Footer.tsx` | Reusable responsive public header with canonical navigation, mobile hamburger dropdown, accessible focus states, and shared public footer. |
| `MarketingLanding` | `src/components/features/landing/MarketingLanding.tsx` | Complete 5-step preparation loop, interactive sample CV analysis demo island, animated waveform interview preview card, practice cards, capability progression toggle, and public pricing preview. |
| `LandingPlanCard` | `src/components/features/landing/LandingPlanCard.tsx` | Adapts production `PlanView` and `PlanPrice` contracts with clear entitlement copy (3 questions free, continuous session Q4+ paid continuation). |
| `AuthGateModal` | `src/components/auth/AuthGateModal.tsx` | Built using Foundation `Modal` and `Button`, contextual banner for pending intent, keyboard trapped, Escape dismissible. |
| `PricingCards` | `src/components/features/pricing/PricingCards.tsx` | Uses production `usePlans()` and `useCurrentUser()` queries; triggers production checkout redirection or auth gate with safe intent. |
| Auth Shell | `src/components/features/auth/Auth.tsx` | Aligned with Foundation design tokens while strictly retaining `authApi.login`, `authApi.register`, email verification and resend cooldowns. |

## 3. Production Auth Logic Preserved
- **Authoritative API**: 100% powered by `authApi.login`, `authApi.register`, `authApi.resendVerification`.
- **Validation**: Strict Zod schemas (`loginSchema`, `registerSchema`) with react-hook-form.
- **Verification Flow**: `EMAIL_NOT_VERIFIED` error interceptor, resend cooldown timer, and unverified notification banner fully preserved.
- **Token Security**: Tokens remain exclusively in memory / HTTP cookies; no local storage or URL query exposures.

## 4. Protected Intent Preservation & Restoration Design
- Implemented in `src/utils/authIntent.ts`.
- **Open-Redirect Prevention**: All candidate target URLs are strictly validated via `isValidInternalPath()`. Only internal, non-protocol-relative, whitelisted route paths are permitted (`/`, `/overview`, `/cv-analysis`, `/interview`, `/pricing`, `/plans`, `/scenarios`, `/star-builder`, `/analytics`, `/billing`, `/account`, `/career-goals`, etc.).
- **URL & Session Storage**: On protected CTA click by an anonymous user, intent is packaged as `AuthIntent` and encoded into `returnTo` and `intentAction` query params when navigating to `/auth`.
- **Post-Login Handling**: Upon successful authentication in `Auth.tsx`, `resolveSafeReturnUrl` parses the return target and routes the user back to their intended workflow (or forwards `planPriceId` for checkout).

## 5. Pricing Data Source & Checkout Behavior
- **Data Source**: Fetched authoritatively via `billingApi.getPlans()` (`usePlans()` hook). No mock plans (`MOCK_PLANS`) are imported or created.
- **Entitlement Copy**: Free tier clearly communicates 3-question checkpoint; paid plans state continuous Q4+ continuation in the same interview session without fabricated question limits.
- **Checkout Flow**: Authenticated users clicking a paid plan navigate directly to `/billing?selectedPriceId=...` for production checkout creation. Anonymous users encounter `AuthGateModal` which preserves their selected plan ID into `/auth?returnTo=/pricing&planPriceId=...`.

## 6. Prototype Items Intentionally NOT Ported
- `PrototypeContext` and simulated mock users (`active` / `new` / `MOCK_PERSONA`).
- `CheckoutSimulationModal` / fake SePay checkout simulation.
- Hardcoded mock analytics, mock competency networks, and fabricated test scores.
- Prototype-only dev state switchers.

## 7. Responsive & Accessibility Verification
- **1440px Desktop**: Header aligns brand, canonical nav, and auth buttons. Hero visual displays floating cards and orbit art with GSAP parallax.
- **820px Tablet**: Navigation collapses gracefully, grid structures adjust to 2 columns, section spacing remains proportional.
- **390px Mobile**: Mobile hamburger menu opens with accessible `aria-expanded` and `aria-controls` attributes; forms and buttons maintain touch targets >= 44px; no horizontal page scroll. Tested short viewport (390x700) for auth forms with centered layout and vertical overflow scroll.
- **Accessibility**: Full keyboard focus visibility (`focus-visible` rings), semantic buttons and links, ARIA labels, and `prefers-reduced-motion: reduce` compliance across all animations.
