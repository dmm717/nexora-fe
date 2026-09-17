'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { usePlans } from '@/hooks/queries/useBilling';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import type { PlanView, PlanPrice } from '@/services/billingApi';
import {
  AuthIntent,
  resolveSafeReturnUrl,
  isValidInternalPath,
  isInterviewRoute,
} from '@/utils/authIntent';
import { Check, ArrowUpRight } from 'lucide-react';
import { describePlanFeature } from '@/services/billingPresentation';
import { formatPriceMinor } from '@/utils/formatters';

export default function PricingCards() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get('returnTo');

  // Validate returnTo once: fail closed if invalid
  const safeReturnTo = rawReturnTo && isValidInternalPath(rawReturnTo)
    ? resolveSafeReturnUrl(rawReturnTo, '/overview')
    : null;

  // Contextual upgrade copy only appears if return route is a validated interview route
  const isInterviewUpgrade = Boolean(safeReturnTo && isInterviewRoute(safeReturnTo));

  const { isAuthenticated, authReady } = useAuth();
  const { data: plans = [], isLoading: loadingPlans } = usePlans();
  const { data: user } = useCurrentUser();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);

  const currentPlanCode = user?.billing?.entitlement?.planCode?.toLowerCase() || null;

  const handleSelectPlan = (plan: PlanView, price: PlanPrice) => {
    // Defense-in-depth: do not trigger premature auth modals or checkout while auth is bootstrapping
    if (!authReady) return;

    if (isAuthenticated) {
      if (price.amountMinor === 0) {
        // Free plan navigation: return to safeReturnTo or /overview
        router.push(safeReturnTo || '/overview');
        return;
      }
      // Authenticated user selecting a paid plan: redirect to canonical checkout entry
      const checkoutUrl = safeReturnTo
        ? `/billing?selectedPriceId=${encodeURIComponent(price.id)}&returnTo=${encodeURIComponent(safeReturnTo)}`
        : `/billing?selectedPriceId=${encodeURIComponent(price.id)}`;
      router.push(checkoutUrl);
    } else {
      if (price.amountMinor === 0) {
        setPendingIntent({
          action: 'navigation',
          targetUrl: safeReturnTo || '/overview',
        });
        setAuthModalOpen(true);
        return;
      }
      // Anonymous user selecting a paid plan: intent carries exact planPriceId and returnTo
      const targetUrl = safeReturnTo
        ? `/billing?selectedPriceId=${encodeURIComponent(price.id)}&returnTo=${encodeURIComponent(safeReturnTo)}`
        : `/billing?selectedPriceId=${encodeURIComponent(price.id)}`;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <ProductPageHero
        feature="pricing"
        title="Chọn gói đồng hành tối ưu cho hành trình nghề nghiệp của bạn"
        description="Không ép buộc thanh toán sớm. Bắt đầu với gói Miễn phí để kiểm chứng phương pháp của Nexora, sau đó nâng cấp khi cần tăng tốc độ luyện tập."
      />

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

      {loadingPlans ? (
        <div className="text-center py-16 text-on-surface-variant">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p>Đang tải thông tin các gói cước...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const price = plan.prices && plan.prices.length > 0 ? plan.prices[0] : null;
            if (!price) return null;

            const isCurrentPlan = currentPlanCode === plan.code.toLowerCase();
            const isHighlight = plan.isHighlighted;
            const featureDescriptions = price.features.map(describePlanFeature).filter(Boolean) as string[];

            return (
              <Card
                key={plan.id}
                variant={isHighlight ? 'interactive' : 'elevated'}
                padding="lg"
                className={`flex flex-col justify-between transition-all relative ${
                  isHighlight
                    ? 'border-2 border-primary shadow-floating scale-[1.02] bg-white ring-4 ring-primary-fixed/20'
                    : 'border border-outline-variant/50 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {isHighlight && (
                      <Badge variant="primary" size="sm">
                        PHỔ BIẾN NHẤT
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge variant="secondary" size="sm">
                        Gói hiện tại
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-on-surface">{plan.name}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 min-h-[36px] leading-relaxed">
                      {plan.description || 'Thông tin quyền lợi được cung cấp trực tiếp từ cấu hình gói.'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <div className="text-2xl sm:text-3xl font-black text-on-surface">
                      {formatPrice(price.amountMinor, price.currency)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {price.durationDays ? `Thời hạn ${price.durationDays} ngày` : 'Sử dụng linh hoạt'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/30 space-y-2">
                    <div className="text-[11px] font-bold text-on-surface-variant uppercase">
                      Tính năng bao gồm:
                    </div>
                    <div className="text-xs font-semibold text-primary">
                      Hạn mức phỏng vấn: {price.interviewQuota !== null ? `${price.interviewQuota} lượt` : 'Chưa có thông tin'}
                    </div>
                    {featureDescriptions.map((description) => (
                      <div key={description} className="flex items-start gap-2 text-xs">
                        <Check size={16} className="text-emerald-700 mt-0.5 flex-shrink-0" />
                        <span className="text-on-surface">{description}</span>
                      </div>
                    ))}
                    {featureDescriptions.length === 0 && (
                      <div className="text-xs text-on-surface-variant">Chưa có thông tin tính năng cho mức giá này.</div>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    variant={isHighlight ? 'primary' : 'outline'}
                    fullWidth
                    size="sm"
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan, price)}
                    icon={price.amountMinor > 0 ? <ArrowUpRight size={16} /> : undefined}
                  >
                    {isCurrentPlan
                      ? 'Đang sử dụng'
                      : price.amountMinor === 0
                        ? 'Bắt đầu miễn phí'
                        : 'Chọn gói này'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
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
  );
}
