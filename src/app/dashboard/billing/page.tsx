'use client';

import React, { useEffect, useState } from 'react';
import styles from './Billing.module.css';
import { billingApi, PlanView } from '@/services/billingApi';

export default function BillingPage() {
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    billingApi.getPlans()
      .then(res => {
        if (isMounted) {
          setPlans(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Không thể tải danh sách gói cước. Vui lòng thử lại sau.');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const handleBuyPlan = async (planPriceId: string) => {
    try {
      setPurchasingPlanId(planPriceId);
      setError(null);
      const res = await billingApi.createCheckoutSession(planPriceId);
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl); // Tự động redirect sang cổng thanh toán
      } else {
        setError('Không nhận được URL thanh toán từ server.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo phiên thanh toán.');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const formatMoney = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
  };

  const CheckIcon = () => (
    <svg className={styles.featureIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

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
          
          const isFree = price.amountMinor === 0;
          const isPro = plan.code.toLowerCase().includes('pro');

          return (
            <div key={plan.id} className={styles.planCard} style={{ borderColor: isPro ? '#3b82f6' : '#e5e7eb' }}>
              {isPro && <div className={styles.popularBadge}>PHỔ BIẾN</div>}
              
              <h2 className={styles.planName}>{plan.name}</h2>
              <div className={styles.planPriceContainer}>
                <span className={styles.planPrice}>
                  {isFree ? 'Miễn phí' : formatMoney(price.amountMinor, price.currency)}
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
                  className={`${styles.buyButton} ${isFree ? styles.btnSecondary : styles.btnPrimary}`}
                  onClick={() => handleBuyPlan(price.id)}
                  disabled={purchasingPlanId !== null}
                >
                  {purchasingPlanId === price.id ? (
                    <><div className={`${styles.spinner} ${isFree ? styles.spinnerDark : ''}`}></div> Đang xử lý...</>
                  ) : (
                    isFree ? 'Gói hiện tại' : 'Mua ngay'
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
