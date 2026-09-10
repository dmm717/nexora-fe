'use client';

import React from 'react';
import { usePlans } from '@/hooks/queries/useBilling';
import styles from './PlansPage.module.css';
import Link from 'next/link';

export default function PlansPage() {
  const { data: plans, isLoading: loading } = usePlans();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải các gói cước...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quay lại
        </Link>
        <h1 className={styles.title}>Nâng Tầm Sự Nghiệp Của Bạn</h1>
        <p className={styles.subtitle}>Chọn gói cước phù hợp nhất với nhu cầu luyện tập phỏng vấn của bạn.</p>
      </div>

      <div className={styles.plansGrid}>
        {(plans || []).map((plan) => (
          <div key={plan.id} className={styles.planCard}>
            <div className={styles.planHeader}>
              <h2 className={styles.planName}>{plan.name}</h2>
              <span className={styles.planCode}>{plan.code}</span>
            </div>
            
            <div className={styles.planPrices}>
              {plan.prices.map((price) => (
                <div key={price.id} className={styles.priceItem}>
                  <div className={styles.priceAmount}>
                    {(price.amountMinor / 100).toLocaleString('vi-VN', { style: 'currency', currency: price.currency })}
                  </div>
                  <ul className={styles.features}>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {price.interviewQuota} lượt phỏng vấn
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {price.durationDays ? `Sử dụng trong ${price.durationDays} ngày` : 'Sử dụng không thời hạn'}
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Hỗ trợ phân tích CV AI
                    </li>
                  </ul>
                  <button className={styles.selectButton} onClick={() => alert('Vui lòng đăng nhập để mua gói cước!')}>
                    Chọn gói này
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
