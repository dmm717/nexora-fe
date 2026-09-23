'use client';

import React, { useCallback, useRef, useState } from 'react';
import gsap from 'gsap';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';
import { ProductMotionBoundary } from '@/components/product-motion/ProductMotionBoundary';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePlans } from '@/hooks/queries/useBilling';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import type { PlanView, PlanPrice } from '@/services/billingApi';
import { billingApi } from '@/services/billingApi';
import { startPayOSCheckout } from '@/services/payOSCheckout';
import {
  AuthIntent,
  resolveSafeReturnUrl,
  resolveCheckoutDestination,
  isValidInternalPath,
  isInterviewRoute,
} from '@/utils/authIntent';
import { Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { describePlanFeature } from '@/services/billingPresentation';
import { formatPriceMinor } from '@/utils/formatters';
import { getQueryPresentation } from '@/utils/queryPresentation';

function PricingPlanGridSkeleton() {
  return (
    <div role="status" aria-label="Đang tải các gói dịch vụ">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="min-h-[360px] rounded-2xl border border-outline-variant/50 bg-white p-6 space-y-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-1/2" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <span className="sr-only">Đang tải thông tin bảng giá...</span>
    </div>
  );
}

export function PricingCardsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12" aria-busy="true">
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 sm:h-10 w-4/5 max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-5/6 max-w-xl" />
      </div>
      <PricingPlanGridSkeleton />
    </div>
  );
}

export default function PricingCards() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get('returnTo');
  const checkoutPriceId = searchParams.get('checkoutPriceId');

  // Validate returnTo once: fail closed if invalid
  const safeReturnTo = rawReturnTo && isValidInternalPath(rawReturnTo)
    ? resolveSafeReturnUrl(rawReturnTo, '/overview')
    : null;

  // Contextual upgrade copy only appears if return route is a validated interview route
  const isInterviewUpgrade = Boolean(safeReturnTo && isInterviewRoute(safeReturnTo));

  const { isAuthenticated, authReady } = useAuth();
  const plansQuery = usePlans();
  const {
    data: plans,
    isLoading: loadingPlans,
    isError: plansHaveError,
    isFetching: fetchingPlans,
    refetch: refetchPlans,
  } = plansQuery;
  const currentUserQuery = useCurrentUser();
  const {
    data: user,
    isLoading: loadingUser,
    isError: userHasError,
    isFetching: fetchingUser,
    refetch: refetchUser,
  } = currentUserQuery;
  const hasPlansData = plans !== undefined;
  const hasUserData = user !== undefined;
  const plansPresentation = getQueryPresentation({
    hasData: hasPlansData,
    isLoading: loadingPlans,
    isError: plansHaveError,
    isFetching: fetchingPlans,
  });
  const userPresentation = getQueryPresentation({
    hasData: hasUserData,
    isLoading: loadingUser,
    isError: userHasError,
    isFetching: fetchingUser,
  });
  const pricedPlans = (plans ?? []).flatMap((plan) => {
    const price = plan.prices?.[0];
    return price ? [{ plan, price }] : [];
  });

  const allFeatureMap = React.useMemo(() => {
    const map = new Map<string, string>();
    pricedPlans.forEach(({ price }) => {
      price.features?.forEach((feat) => {
        const key = feat.code || feat.name;
        if (key && !map.has(key)) {
          map.set(key, feat.name || feat.code);
        }
      });
    });
    return map;
  }, [pricedPlans]);

  const comparisonFeatures = React.useMemo(() => {
    return Array.from(allFeatureMap.keys());
  }, [allFeatureMap]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);
  const [checkoutPriceInProgress, setCheckoutPriceInProgress] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const checkoutInProgressRef = useRef(false);
  const autoCheckoutAttemptedRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimatedPricingRef = useRef(false);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !hasPlansData || pricedPlans.length === 0 || hasAnimatedPricingRef.current) return;

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      const heroTitle = container.querySelector('.product-page-hero h1');
      const heroDesc = container.querySelector('.product-page-hero p');
      const cards = container.querySelectorAll<HTMLElement>('[data-pricing-card]');
      const features = container.querySelectorAll<HTMLElement>('[data-feature-item]');
      const badges = container.querySelectorAll<HTMLElement>('[data-popular-badge]');
      gsap.set([heroTitle, heroDesc, ...cards, ...features, ...badges].filter(Boolean), { clearProps: 'all' });
      hasAnimatedPricingRef.current = true;
      return;
    }

    let completed = false;
    try {
      const ctx = gsap.context(() => {
        const heroTitle = container.querySelector('.product-page-hero h1');
        const heroDesc = container.querySelector('.product-page-hero p');
        const cards = container.querySelectorAll<HTMLElement>('[data-pricing-card]');
        const features = container.querySelectorAll<HTMLElement>('[data-feature-item]');
        const badges = container.querySelectorAll<HTMLElement>('[data-popular-badge]');

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            completed = true;
            hasAnimatedPricingRef.current = true;
          },
        });

        // 1. Header Text Animation
        if (heroTitle) {
          tl.fromTo(
            heroTitle,
            { autoAlpha: 0, y: 35 },
            { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
          );
        }
        if (heroDesc) {
          tl.fromTo(
            heroDesc,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
            '-=0.45',
          );
        }

        // 2. Pricing Cards Entrance
        if (cards.length > 0) {
          tl.fromTo(
            cards,
            { autoAlpha: 0, y: 50, scale: 0.96 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.75,
              stagger: 0.12,
              ease: 'power2.out',
              clearProps: 'transform,opacity,visibility',
            },
            '-=0.3',
          );
        }

        // 3. Feature Items inside each card
        if (features.length > 0) {
          tl.fromTo(
            features,
            { autoAlpha: 0, y: 10 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.35,
              stagger: 0.03,
              ease: 'power2.out',
              clearProps: 'transform,opacity,visibility',
            },
            '-=0.4',
          );
        }

        // 4. Popular Badge Pop-in on Highlight card
        if (badges.length > 0) {
          tl.fromTo(
            badges,
            { autoAlpha: 0, scale: 0 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.5,
              ease: 'back.out(1.8)',
              clearProps: 'transform,opacity,visibility',
            },
            '-=0.2',
          );
        }
      }, container);

      return () => {
        ctx.revert();
        if (!completed) hasAnimatedPricingRef.current = false;
      };
    } catch {
      const cards = container.querySelectorAll<HTMLElement>('[data-pricing-card]');
      gsap.set(cards, { clearProps: 'all' });
      hasAnimatedPricingRef.current = true;
    }
  }, [hasPlansData, pricedPlans.length]);

  const beginCheckout = useCallback(async (planPriceId: string) => {
    if (checkoutInProgressRef.current) return;

    const authoritativePriceId = typeof planPriceId === 'string' ? planPriceId.trim() : '';
    const matchedPrice = (plans ?? [])
      .flatMap((plan) => plan.prices ?? [])
      .find((candidate) => candidate.id === authoritativePriceId);

    if (!authoritativePriceId || !matchedPrice || matchedPrice.amountMinor <= 0) {
      setCheckoutError('Gói bạn chọn không còn khả dụng. Vui lòng chọn lại.');
      return;
    }

    checkoutInProgressRef.current = true;
    setCheckoutPriceInProgress(authoritativePriceId);
    setCheckoutError(null);

    try {
      await startPayOSCheckout(
        { planPriceId: authoritativePriceId, returnTo: safeReturnTo },
        {
          createCheckoutSession: billingApi.createCheckoutSession,
          isValidInternalPath,
        },
      );
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Chưa thể tạo phiên thanh toán. Vui lòng thử lại.',
      );
    } finally {
      checkoutInProgressRef.current = false;
      setCheckoutPriceInProgress(null);
    }
  }, [plans, safeReturnTo]);

  // Consume the post-auth Pricing handoff once, only after auth and backend plans are ready.
  React.useEffect(() => {
    if (!checkoutPriceId || !authReady) return;

    const cleanedUrl = safeReturnTo
      ? `/pricing?returnTo=${encodeURIComponent(safeReturnTo)}`
      : '/pricing';

    if (!isAuthenticated) {
      window.history.replaceState(window.history.state, '', cleanedUrl);
      return;
    }

    if (!hasPlansData || fetchingPlans || autoCheckoutAttemptedRef.current === checkoutPriceId) {
      return;
    }

    autoCheckoutAttemptedRef.current = checkoutPriceId;
    window.history.replaceState(window.history.state, '', cleanedUrl);
    void beginCheckout(checkoutPriceId);
  }, [
    authReady,
    beginCheckout,
    checkoutPriceId,
    fetchingPlans,
    hasPlansData,
    isAuthenticated,
    safeReturnTo,
  ]);

  const currentPlanCode = isAuthenticated && hasUserData
    ? user.billing?.entitlement?.planCode?.toLowerCase() || null
    : null;

  const handleSelectPlan = (plan: PlanView, price: PlanPrice) => {
    // Defense-in-depth: do not trigger premature auth modals or checkout while auth is bootstrapping
    if (!authReady) return;

    if (isAuthenticated) {
      if (price.amountMinor <= 0) {
        // Free plan navigation: return to safeReturnTo or /overview
        router.push(safeReturnTo || '/overview');
        return;
      }
      // Use the backend-loaded plan price as the only checkout authority.
      void beginCheckout(price.id);
    } else {
      if (price.amountMinor <= 0) {
        setPendingIntent({
          action: 'navigation',
          targetUrl: safeReturnTo || '/overview',
        });
        setAuthModalOpen(true);
        return;
      }
      // Preserve the authoritative price through auth and return to Pricing for handoff.
      const targetUrl = resolveCheckoutDestination(price.id, safeReturnTo) ?? '/pricing';

      setPendingIntent({
        action: 'checkout',
        targetUrl,
        planPriceId: price.id,
      });
      setAuthModalOpen(true);
    }
  };

  const formatPrice = (amountMinor: number, currency: string) => {
    return formatPriceMinor(amountMinor, currency);
  };

  return (
    <ProductMotionBoundary>
      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        <ProductPageHero
          className="pricing-hero"
          feature="pricing"
          title="Chọn gói đồng hành tối ưu cho hành trình nghề nghiệp của bạn"
          description="Không ép buộc thanh toán sớm. Bắt đầu với gói Miễn phí để kiểm chứng phương pháp của Nexora, sau đó nâng cấp khi cần tăng tốc độ luyện tập."
        />

        {checkoutPriceInProgress && (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary-fixed/30 px-4 py-3 text-sm font-medium text-primary"
          >
            <span
              aria-hidden="true"
              className="functional-spinner inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full flex-shrink-0"
            />
            <span>Đang chuyển đến cổng thanh toán...</span>
          </div>
        )}
        {checkoutError && (
          <div role="alert" className="rounded-xl border border-error/25 bg-error-container/25 px-4 py-3 text-sm text-on-surface">
            {checkoutError}
          </div>
        )}

      {/* Contextual Interview Upgrade Notice */}
      {isInterviewUpgrade && safeReturnTo && (
        <div className="p-5 rounded-2xl bg-primary-fixed/30 border-2 border-primary/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold">
              ★
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base text-on-surface">
                Nâng cấp phiên phỏng vấn đang diễn ra (Mở khóa Câu 4+)
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                Bạn đã hoàn thành các câu hỏi của gói Miễn phí. Chọn một trong các gói dưới đây để tiếp tục ngay câu hỏi số 4 chuyên sâu trong chính phiên phỏng vấn này.
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(safeReturnTo)}
          >
            Quay lại phiên phỏng vấn
          </Button>
        </div>
      )}

      {isAuthenticated && !hasUserData && (
        <div
          role={userPresentation.showBlockingError ? 'alert' : 'status'}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
        >
          <p>
            {userPresentation.showBlockingError
              ? 'Chưa xác nhận được gói hiện tại. Bạn vẫn có thể xem và chọn gói; trạng thái hiện tại sẽ không được đánh dấu.'
              : 'Đang xác nhận gói hiện tại. Bạn vẫn có thể xem và chọn các gói dịch vụ.'}
          </p>
          {userPresentation.showBlockingError && (
            <Button variant="outline" size="sm" loading={fetchingUser} onClick={() => void refetchUser()}>
              Thử tải lại
            </Button>
          )}
        </div>
      )}
      {isAuthenticated && userPresentation.showBackgroundError && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-error/25 bg-error-container/25 px-4 py-3 text-sm text-on-surface">
          <p>Thông tin gói hiện tại chưa cập nhật được. Bảng giá vẫn dùng được; trạng thái đang hiển thị dựa trên dữ liệu đã tải trước đó.</p>
          <Button variant="outline" size="sm" loading={fetchingUser} onClick={() => void refetchUser()}>
            Thử tải lại
          </Button>
        </div>
      )}
      {isAuthenticated && userPresentation.showRefreshing && !userPresentation.showBackgroundError && (
        <p role="status" className="text-xs text-on-surface-variant">Đang cập nhật trạng thái gói hiện tại...</p>
      )}

      {plansPresentation.showInitialLoading ? (
        <PricingPlanGridSkeleton />
      ) : plansPresentation.showBlockingError ? (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-error/30 bg-error-container/25 p-5 text-on-surface">
          <div>
            <h2 className="font-semibold">Chưa tải được bảng giá</h2>
            <p className="text-sm text-on-surface-variant mt-1">Kiểm tra kết nối rồi thử tải lại. Bạn chưa thể chọn gói cho đến khi có thông tin mới nhất.</p>
          </div>
          <Button variant="outline" size="sm" loading={fetchingPlans} onClick={() => void refetchPlans()}>
            Thử tải lại
          </Button>
        </div>
      ) : (
        <>
          {plansPresentation.showBackgroundError && (
            <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-error/25 bg-error-container/25 px-4 py-3 text-sm text-on-surface">
              <p>Chưa cập nhật được bảng giá. Các thông tin đã tải trước đó vẫn được giữ lại.</p>
              <Button variant="outline" size="sm" loading={fetchingPlans} onClick={() => void refetchPlans()}>
                Thử tải lại
              </Button>
            </div>
          )}
          {plansPresentation.showRefreshing && !plansPresentation.showBackgroundError && (
            <p role="status" className="text-xs text-on-surface-variant">Đang cập nhật bảng giá...</p>
          )}
          {hasPlansData && pricedPlans.length === 0 ? (
            <div role="status" className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-8 text-center">
              <h2 className="font-semibold text-on-surface">Chưa có gói giá khả dụng</h2>
              <p className="text-sm text-on-surface-variant mt-2">Bảng giá chưa có lựa chọn khả dụng vào lúc này. Bạn có thể quay lại sau.</p>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                {pricedPlans.map(({ plan, price }) => {
                  const isCurrentPlan = currentPlanCode === plan.code.toLowerCase();
                  const isHighlight = plan.isHighlighted;
                  const featureDescriptions = price.features.map(describePlanFeature).filter(Boolean) as string[];

                  return (
                    <Card
                      key={plan.id}
                      data-pricing-card
                      variant={isCurrentPlan ? 'selected' : 'elevated'}
                      padding="md"
                      data-current={isCurrentPlan}
                      className={`pricing-choice flex flex-col justify-between relative ${
                        isCurrentPlan
                          ? 'border-2 border-primary shadow-floating bg-primary-fixed/5 ring-4 ring-primary-fixed/20'
                          : isHighlight
                          ? 'border-2 border-primary/70 shadow-card bg-white'
                          : 'border border-outline/45 shadow-subtle bg-white'
                      }`}
                    >
                      {isHighlight && (
                        <div data-popular-badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[9px_9px_9px_3px] text-xs font-bold bg-primary text-white shadow-md border border-white/20 whitespace-nowrap">
                            <Sparkles size={13} aria-hidden="true" className="text-amber-300" />
                            Phổ biến nhất
                          </span>
                        </div>
                      )}
                      <div className="space-y-3.5" data-pricing-card-content>
                        <div className="flex items-center justify-between gap-2 flex-wrap min-h-[24px]">
                          {isCurrentPlan && (
                            <Badge variant="secondary" size="md">
                              Gói hiện tại
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-lg text-on-surface">{plan.name}</h3>
                          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 line-clamp-2 min-h-[36px] leading-relaxed">
                            {plan.description || 'Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn.'}
                          </p>
                        </div>

                        <div className="pt-1">
                          <div className="text-2xl sm:text-3xl font-black text-on-surface">
                            {formatPrice(price.amountMinor, price.currency)}
                          </div>
                          <div className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
                            {price.durationDays ? `Thời hạn ${price.durationDays} ngày` : 'Sử dụng linh hoạt'}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-outline-variant/30 space-y-2">
                          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            Tính năng nổi bật:
                          </div>
                          <div data-feature-item className="text-xs sm:text-sm font-bold text-primary">
                            Hạn mức phỏng vấn: {price.interviewQuota !== null ? `${price.interviewQuota} lượt` : 'Chưa có thông tin'}
                          </div>
                          {featureDescriptions.slice(0, 3).map((description) => (
                            <div key={description} data-feature-item className="flex items-start gap-1.5 text-xs sm:text-sm">
                              <Check size={16} className="text-emerald-700 mt-0.5 flex-shrink-0" />
                              <span className="text-on-surface line-clamp-1">{description}</span>
                            </div>
                          ))}
                          {featureDescriptions.length > 3 && (
                            <a
                              href="#feature-comparison"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-0.5"
                            >
                              +{featureDescriptions.length - 3} tính năng chi tiết bên dưới ↓
                            </a>
                          )}
                          {featureDescriptions.length === 0 && (
                            <div className="text-xs text-on-surface-variant">Chưa có thông tin tính năng cho mức giá này.</div>
                          )}
                        </div>
                      </div>

                      <div className="pt-5 mt-auto">
                        <Button
                          variant={isHighlight ? 'primary' : 'outline'}
                          fullWidth
                          size="sm"
                          disabled={!authReady || isCurrentPlan || (checkoutPriceInProgress !== null && price.amountMinor > 0)}
                          loading={checkoutPriceInProgress === price.id}
                          onClick={() => handleSelectPlan(plan, price)}
                          icon={price.amountMinor > 0 ? <ArrowUpRight size={16} /> : undefined}
                        >
                          {isCurrentPlan
                            ? 'Gói hiện tại'
                            : price.amountMinor <= 0
                              ? 'Bắt đầu miễn phí'
                              : 'Chọn gói này'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Level 2: Detailed Feature Comparison Table */}
              <section id="feature-comparison" className="pt-8 sm:pt-10 border-t border-outline-variant/30 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                      So sánh chi tiết quyền lợi các gói
                    </h2>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl">
                      Xem toàn bộ hạn mức phỏng vấn, công cụ đánh giá AI và quyền lợi đi kèm để đưa ra quyết định phù hợp nhất.
                    </p>
                  </div>
                  <div className="text-xs font-medium text-on-surface-variant hidden sm:block">
                    Mọi gói đều hỗ trợ bảo mật dữ liệu và lưu trữ phiên phỏng vấn.
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-outline-variant/40 bg-white shadow-xs">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-low/60">
                        <th scope="col" className="p-4 sm:p-5 font-bold text-sm text-on-surface w-2/5">
                          Tính năng & Quyền lợi
                        </th>
                        {pricedPlans.map(({ plan, price }) => {
                          const isHighlight = plan.isHighlighted;
                          const isCurrentPlan = currentPlanCode === plan.code.toLowerCase();
                          return (
                            <th
                              key={plan.id}
                              scope="col"
                              className={`p-4 sm:p-5 text-center font-bold text-sm ${
                                isHighlight ? 'bg-primary-fixed/20 text-primary' : 'text-on-surface'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>{plan.name}</span>
                                {isCurrentPlan && (
                                  <Badge variant="secondary" size="sm">
                                    Hiện tại
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs font-normal text-on-surface-variant mt-1">
                                {formatPrice(price.amountMinor, price.currency)}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-xs sm:text-sm">
                      {/* Row 1: Interview quota */}
                      <tr className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="p-4 sm:px-5 font-medium text-on-surface">
                          <div>Hạn mức phỏng vấn AI</div>
                          <div className="text-xs text-on-surface-variant">Số phiên thực hành với trợ lý AI</div>
                        </td>
                        {pricedPlans.map(({ plan, price }) => (
                          <td key={plan.id} className="p-4 text-center font-bold text-primary">
                            {price.interviewQuota !== null ? `${price.interviewQuota} lượt` : '—'}
                          </td>
                        ))}
                      </tr>

                      {/* Row 2: Duration */}
                      <tr className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="p-4 sm:px-5 font-medium text-on-surface">
                          <div>Thời hạn sử dụng</div>
                          <div className="text-xs text-on-surface-variant">Thời gian hiệu lực của gói</div>
                        </td>
                        {pricedPlans.map(({ plan, price }) => (
                          <td key={plan.id} className="p-4 text-center text-on-surface-variant font-medium">
                            {price.durationDays ? `${price.durationDays} ngày` : 'Sử dụng linh hoạt'}
                          </td>
                        ))}
                      </tr>

                      {/* Dynamic Feature Rows from distinct features across all plans */}
                      {comparisonFeatures.map((featureKey) => {
                        return (
                          <tr key={featureKey} className="hover:bg-surface-container-low/30 transition-colors">
                            <td className="p-4 sm:px-5 font-medium text-on-surface">
                              {allFeatureMap.get(featureKey) || featureKey}
                            </td>
                            {pricedPlans.map(({ plan, price }) => {
                              const feat = price.features?.find((f) => (f.code || f.name) === featureKey);
                              return (
                                <td key={plan.id} className="p-4 text-center">
                                  {!feat || !feat.enabled ? (
                                    <span className="text-outline-variant/60 font-semibold select-none">—</span>
                                  ) : feat.unlimited ? (
                                    <span className="text-xs font-bold text-secondary">Không giới hạn</span>
                                  ) : feat.limit !== null ? (
                                    <span className="text-xs font-bold text-on-surface">{feat.limit}</span>
                                  ) : (
                                    <Check size={18} className="text-emerald-700 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-outline-variant/30 bg-surface-container-low/40">
                        <td className="p-4 sm:px-5 font-medium text-xs text-on-surface-variant">
                          Lựa chọn gói
                        </td>
                        {pricedPlans.map(({ plan, price }) => {
                          const isCurrentPlan = currentPlanCode === plan.code.toLowerCase();
                          return (
                            <td key={plan.id} className="p-4 text-center">
                              <Button
                                variant={plan.isHighlighted ? 'primary' : 'outline'}
                                size="sm"
                                disabled={!authReady || isCurrentPlan || (checkoutPriceInProgress !== null && price.amountMinor > 0)}
                                loading={checkoutPriceInProgress === price.id}
                                onClick={() => handleSelectPlan(plan, price)}
                                icon={price.amountMinor > 0 ? <ArrowUpRight size={14} /> : undefined}
                              >
                                {isCurrentPlan
                                  ? 'Gói hiện tại'
                                  : price.amountMinor <= 0
                                    ? 'Bắt đầu'
                                    : 'Chọn gói'}
                              </Button>
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* Auth Gate Modal */}
      <AuthGateModal
        isOpen={authModalOpen}
        pendingIntent={pendingIntent}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingIntent(null);
        }}
      />
      </div>
    </ProductMotionBoundary>
  );
}
