'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { billingApi } from '@/services/billingApi';
import { useBillingPlans } from '@/hooks/queries/useBilling';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/formatters';
import { isValidInternalPath } from '@/utils/authIntent';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  describePlanFeature,
  formatFeatureAvailability,
  formatInterviewQuestionLimit,
  getExactEntitlementFeature,
} from '@/services/billingPresentation';

export default function BillingPage() {
  const [error, setError] = useState<string | null>(null);
  
  const { data: plans = [], isLoading: loadingPlans } = useBillingPlans();
  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const loading = loadingPlans || loadingUser;
  const currentPlanCode = user?.billing?.entitlement?.planCode || null;

  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPriceId = searchParams.get('selectedPriceId');
  const rawReturnTo = searchParams.get('returnTo');
  const safeReturnTo = rawReturnTo && isValidInternalPath(rawReturnTo) ? rawReturnTo : null;

  const autoCheckoutAttemptedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined') {
      const pendingOrderId = sessionStorage.getItem('pendingPaymentOrderId');
      if (pendingOrderId) {
        const currentParams = new URLSearchParams(window.location.search);
        if (currentParams.get('error') || currentParams.get('success')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const checkStatus = async () => {
          try {
            let statusRes = await billingApi.getOrderStatus(pendingOrderId);
            if (statusRes.status === 'pending') {
              await new Promise((r) => setTimeout(r, 2000));
              statusRes = await billingApi.refreshOrderStatus(pendingOrderId);
            }
            if (statusRes.status === 'fulfilled') {
              sessionStorage.removeItem('pendingPaymentOrderId');
              queryClient.invalidateQueries({ queryKey: ['currentUser'] });

              // If a validated post-payment returnTo exists in session storage, navigate there
              const postPaymentReturnTo = sessionStorage.getItem('postPaymentReturnTo');
              if (postPaymentReturnTo && isValidInternalPath(postPaymentReturnTo)) {
                sessionStorage.removeItem('postPaymentReturnTo');
                router.push(postPaymentReturnTo);
                return;
              }
            } else if (statusRes.status === 'failed') {
              sessionStorage.removeItem('pendingPaymentOrderId');
              sessionStorage.removeItem('postPaymentReturnTo');
              if (isMounted) setError('Thanh toán thất bại hoặc đã bị hủy.');
            } else {
              sessionStorage.removeItem('pendingPaymentOrderId');
              sessionStorage.removeItem('postPaymentReturnTo');
              if (isMounted) setError('Thanh toán chưa được xác nhận hoàn tất.');
            }
          } catch {
            sessionStorage.removeItem('pendingPaymentOrderId');
            sessionStorage.removeItem('postPaymentReturnTo');
            if (isMounted) setError('Lỗi khi kiểm tra trạng thái thanh toán.');
          }
        };
        
        checkStatus();
      } else {
        const currentParams = new URLSearchParams(window.location.search);
        const errorParam = currentParams.get('error');
        if (errorParam === 'webhook_error') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setError('Lỗi kết nối máy chủ khi xác nhận thanh toán.');
        } else if (errorParam === 'webhook_failed') {
          setError('Xác nhận thanh toán từ hệ thống thất bại.');
        } else if (errorParam === 'invalid_transaction') {
          setError('Mã giao dịch thanh toán không hợp lệ.');
        }
        if (errorParam || currentParams.get('success')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    return () => { isMounted = false; };
  }, [queryClient, router]);

  const createCheckoutMutation = useMutation({
    mutationFn: (planPriceId: string) => billingApi.createCheckoutSession(planPriceId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billingPlans'] });
      if (res.checkout) {
        sessionStorage.setItem('pendingPaymentOrderId', res.orderId);
        if (safeReturnTo) {
          sessionStorage.setItem('postPaymentReturnTo', safeReturnTo);
        }
        
        const form = document.createElement('form');
        form.method = res.checkout.method;
        form.action = res.checkout.url;
        
        res.checkout.fields.forEach((field) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = field.name;
          input.value = field.value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        setError('Không nhận được thông tin thanh toán từ server.');
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo phiên thanh toán.');
    }
  });

  const handleBuyPlan = (planPriceId: string) => {
    setError(null);
    createCheckoutMutation.mutate(planPriceId);
  };

  // One-shot auto-checkout when selectedPriceId is passed in query
  useEffect(() => {
    if (!selectedPriceId || autoCheckoutAttemptedRef.current || loadingPlans || plans.length === 0) {
      return;
    }

    autoCheckoutAttemptedRef.current = true;

    // Validate selectedPriceId against loaded production plans
    let matchedPrice: { id: string; amountMinor: number } | null = null;
    for (const plan of plans) {
      const found = plan.prices?.find((p) => p.id === selectedPriceId);
      if (found) {
        matchedPrice = found;
        break;
      }
    }

    if (!matchedPrice) {
      // Fail closed: show error and do not call checkout API
      setError('Gói cước đã chọn không tồn tại hoặc không còn hiệu lực.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (matchedPrice.amountMinor <= 0) {
      // Free price does not trigger paid checkout
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Clean up query param so reloads don't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    // Invoke canonical checkout
    setError(null);
    createCheckoutMutation.mutate(matchedPrice.id);
  }, [selectedPriceId, loadingPlans, plans, createCheckoutMutation]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-8 rounded-2xl bg-white border border-outline-variant/60 shadow-subtle text-center text-sm text-on-surface-variant flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin gói cước và hạn mức...</span>
        </div>
      </div>
    );
  }

  const entitlement = user?.billing?.entitlement;
  const orders = user?.billing?.orders || [];
  const planName = entitlement?.planCode ? entitlement.planCode.toUpperCase() : 'Chưa có thông tin gói';
  const expiresAtText = entitlement?.endsAt
    ? new Date(entitlement.endsAt).toLocaleDateString('vi-VN')
    : entitlement
      ? 'Không có ngày hết hạn'
      : 'Chưa có thông tin';

  const interviewFeature = getExactEntitlementFeature(entitlement?.features, 'interview');
  const cvFeature = getExactEntitlementFeature(entitlement?.features, 'cv_analysis');
  const questionLimitFeature = getExactEntitlementFeature(
    entitlement?.features,
    'interview_question_limit'
  );

  const interviewQuotaText = formatFeatureAvailability(interviewFeature, 'phiên');
  const cvAnalysisText = formatFeatureAvailability(cvFeature, 'lần');
  const interviewQuestionLimitText = formatInterviewQuestionLimit(questionLimitFeature);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">credit_card</span>
            <span>Quản lý tài khoản & Gói dịch vụ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Gói dịch vụ & Lịch sử thanh toán
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Theo dõi hạn mức phỏng vấn, thời hạn gói và mở khóa thêm các tính năng phân tích & phỏng vấn AI mạnh mẽ.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="shadow-subtle">
          {error}
        </Alert>
      )}

      {/* Current Entitlement Card */}
      <Card variant="elevated" padding="lg" className="border border-outline-variant/60 shadow-floating space-y-5 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Gói hiện tại</div>
            <div className="text-2xl font-black text-primary mt-1 flex items-center gap-2.5">
              <span>{planName}</span>
              <Badge variant="primary" size="sm">Đang hoạt động</Badge>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-on-surface-variant">Thời hạn sử dụng</div>
            <div className="text-sm font-bold text-on-surface mt-0.5">
              {expiresAtText}
            </div>
          </div>
        </div>

        {/* Quota Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-xs text-on-surface-variant font-medium">Hạn mức phỏng vấn khả dụng</div>
            <div className="text-xl font-extrabold text-on-surface mt-1">
              {interviewQuotaText}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-xs text-on-surface-variant font-medium">Phân tích CV & So khớp JD</div>
            <div className="text-xl font-extrabold text-on-surface mt-1">
              {cvAnalysisText}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-xs text-on-surface-variant font-medium">Giới hạn câu hỏi / phiên</div>
            <div className="text-xl font-extrabold text-on-surface mt-1">
              {interviewQuestionLimitText}
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing / Upgrade Plans Grid */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-outline-variant/30 pb-2">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            Nâng cấp gói dịch vụ
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Chọn gói cước phù hợp với tốc độ luyện tập và mục tiêu chuẩn bị phỏng vấn của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = plan.prices[0];
            if (!price) return null;

            const isCurrentPlan = currentPlanCode === plan.code;
            const isFree = price.amountMinor === 0;
            const isHighlighted = plan.isHighlighted;
            const featureDescriptions = price.features.map(describePlanFeature).filter(Boolean) as string[];

            return (
              <Card
                key={plan.id}
                variant="elevated"
                padding="lg"
                className={`flex flex-col justify-between relative bg-white transition-all ${
                  isHighlighted
                    ? 'border-2 border-primary shadow-card ring-1 ring-primary/20'
                    : 'border border-outline-variant/60 shadow-subtle'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary text-white shadow-sm">
                      Phổ biến nhất
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-on-surface tracking-tight">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge variant="primary" size="sm">Đang dùng</Badge>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant min-h-[32px] leading-relaxed">
                    {plan.description || 'Thông tin quyền lợi chi tiết được máy chủ cung cấp theo từng mức giá.'}
                  </p>
                  <div className="pt-2 pb-2 border-b border-outline-variant/30">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-on-surface">
                        {isFree ? 'Miễn phí' : formatCurrency(price.amountMinor, price.currency)}
                      </span>
                      {!isFree && price.durationDays && (
                        <span className="text-xs text-on-surface-variant font-medium">
                          / {price.durationDays} ngày
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs text-on-surface">
                    {price.interviewQuota !== null && (
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                        <span>Hạn mức giá: {price.interviewQuota} lượt phỏng vấn</span>
                      </li>
                    )}
                    {featureDescriptions.map((description) => (
                      <li key={description} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                        <span>{description}</span>
                      </li>
                    ))}
                    {featureDescriptions.length === 0 && price.interviewQuota === null && (
                      <li className="text-on-surface-variant">Chưa có thông tin tính năng cho mức giá này.</li>
                    )}
                  </ul>
                </div>

                <div className="pt-6 mt-4 border-t border-outline-variant/20">
                  <Button
                    variant={isHighlighted ? 'primary' : 'outline'}
                    size="md"
                    fullWidth
                    onClick={() => handleBuyPlan(price.id)}
                    disabled={createCheckoutMutation.isPending || isCurrentPlan}
                    loading={createCheckoutMutation.isPending && createCheckoutMutation.variables === price.id}
                  >
                    {isCurrentPlan ? 'Gói hiện tại' : isHighlighted ? 'Nâng cấp ngay' : 'Chọn gói này'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Orders History */}
      {orders.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-on-surface">Lịch sử giao dịch</h3>
          <Card variant="elevated" padding="none" className="overflow-hidden bg-white border border-outline-variant/60 shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-semibold border-b border-outline-variant/40">
                  <tr>
                    <th className="p-4">Mã đơn hàng</th>
                    <th className="p-4">Gói dịch vụ</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Số tiền</th>
                    <th className="p-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 font-mono font-semibold text-primary">{o.id.slice(0, 12)}</td>
                      <td className="p-4 font-semibold">{o.planCode}</td>
                      <td className="p-4 text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 font-bold">{formatCurrency(o.amountMinor, o.currency)}</td>
                      <td className="p-4">
                        <Badge
                          variant={o.status === 'fulfilled' ? 'success' : o.status === 'pending' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {o.status === 'fulfilled' ? 'Thành công' : o.status === 'pending' ? 'Đang chờ' : o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
