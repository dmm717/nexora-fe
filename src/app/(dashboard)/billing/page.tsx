'use client';

import React, { useEffect, useState } from 'react';
import styles from './Billing.module.css';
import { billingApi } from '@/services/billingApi';
import { useBillingPlans } from '@/hooks/queries/useBilling';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/formatters';

const CheckIcon = () => (
  <svg className={styles.featureIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function BillingPage() {
  const [error, setError] = useState<string | null>(null);
  
  const { data: plans = [], isLoading: loadingPlans } = useBillingPlans();
  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const loading = loadingPlans || loadingUser;
  const currentPlanCode = user?.billing?.entitlement?.planCode || null;

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined') {
      const pendingOrderId = sessionStorage.getItem('pendingPaymentOrderId');
      if (pendingOrderId) {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('error') || searchParams.get('success')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const checkStatus = async () => {
          try {
            let statusRes = await billingApi.getOrderStatus(pendingOrderId);
            if (statusRes.status === 'pending') {
              await new Promise(r => setTimeout(r, 2000));
              statusRes = await billingApi.refreshOrderStatus(pendingOrderId);
            }
            if (statusRes.status === 'fulfilled') {
              sessionStorage.removeItem('pendingPaymentOrderId');
              queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            } else if (statusRes.status === 'failed') {
              sessionStorage.removeItem('pendingPaymentOrderId');
              if (isMounted) setError('Thanh toán thất bại hoặc đã bị hủy.');
            } else {
              sessionStorage.removeItem('pendingPaymentOrderId');
              if (isMounted) setError('Thanh toán chưa được xác nhận hoàn tất.');
            }
          } catch {
            sessionStorage.removeItem('pendingPaymentOrderId');
            if (isMounted) setError('Lỗi khi kiểm tra trạng thái thanh toán.');
          }
        };
        
        checkStatus();
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = searchParams.get('error');
        if (errorParam === 'webhook_error') {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setError('Lỗi kết nối máy chủ khi xác nhận thanh toán.');
        } else if (errorParam === 'webhook_failed') {
          setError('Xác nhận thanh toán từ hệ thống thất bại.');
        } else if (errorParam === 'invalid_transaction') {
          setError('Mã giao dịch thanh toán không hợp lệ.');
        }
        if (errorParam || searchParams.get('success')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    return () => { isMounted = false; };
  }, [queryClient]);

  const createCheckoutMutation = useMutation({
    mutationFn: (planPriceId: string) => billingApi.createCheckoutSession(planPriceId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billingPlans'] });
      if (res.checkout) {
        sessionStorage.setItem('pendingPaymentOrderId', res.orderId);
        
        const form = document.createElement('form');
        form.method = res.checkout.method;
        form.action = res.checkout.url;
        
        res.checkout.fields.forEach(field => {
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



  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', marginTop: '4rem', fontSize: '1.25rem', color: '#6b7280' }}>
          Đang tải danh sách gói cước...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nâng cấp tài khoản</h1>
        <p className={styles.subtitle}>Chọn gói cước phù hợp để mở khóa thêm các tính năng phân tích và phỏng vấn AI mạnh mẽ.</p>
      </header>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.plansGrid}>
        {plans.map((plan) => {
          // Assume the first price is the default monthly/one-time price
          const price = plan.prices[0];
          if (!price) return null;
          
          const isCurrentPlan = currentPlanCode === plan.code;
          const isFree = price.amountMinor === 0;
          const isPro = plan.code.toLowerCase().includes('pro');

          return (
            <div key={plan.id} className={styles.planCard} style={{ borderColor: isPro ? '#3b82f6' : '#e5e7eb' }}>
              {isPro && <div className={styles.popularBadge}>PHỔ BIẾN</div>}
              
              <h2 className={styles.planName}>{plan.name}</h2>
              <div className={styles.planPriceContainer}>
                <span className={styles.planPrice}>
                  {isFree ? 'Miễn phí' : formatCurrency(price.amountMinor, price.currency)}
                </span>
                {!isFree && <span className={styles.planCurrency}>{price.currency}</span>}
                {price.durationDays && <span className={styles.planDuration}>/ {price.durationDays} ngày</span>}
              </div>

              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  <span><strong>{price.interviewQuota}</strong> lượt AI Phỏng vấn & Phân tích</span>
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  <span>Phân tích CV chuyên sâu theo JD</span>
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  <span>Báo cáo đánh giá chi tiết (Rubric)</span>
                </li>
                <li className={styles.featureItem}>
                  <CheckIcon />
                  <span>Lịch sử luyện tập lưu trữ {isPro ? 'không giới hạn' : '30 ngày'}</span>
                </li>
              </ul>

              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.buyButton} ${isCurrentPlan ? styles.btnSecondary : styles.btnPrimary}`}
                  onClick={() => handleBuyPlan(price.id)}
                  disabled={createCheckoutMutation.isPending || isCurrentPlan}
                >
                  {createCheckoutMutation.isPending && createCheckoutMutation.variables === price.id ? (
                    <><div className={`${styles.spinner} ${isCurrentPlan ? styles.spinnerDark : ''}`}></div> Đang xử lý...</>
                  ) : (
                    isCurrentPlan ? 'Gói hiện tại' : 'Mua ngay'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
