'use client';

import React from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
import type { PlanView, PlanPrice } from '@/services/billingApi';
import { formatPriceMinor } from '@/utils/formatters';
import { describePlanFeature } from '@/services/billingPresentation';
import styles from './landing.module.css';

interface LandingPlanCardProps {
  plan: PlanView;
  price: PlanPrice;
  isHighlighted?: boolean;
  disabled?: boolean;
  onSelect: (plan: PlanView, price: PlanPrice) => void;
}

export const LandingPlanCard: React.FC<LandingPlanCardProps> = ({
  plan,
  price,
  isHighlighted = false,
  disabled = false,
  onSelect,
}) => {
  const isFree = price.amountMinor === 0;
  const displayName = isFree
    ? 'Miễn phí'
    : plan.name === 'Basic'
      ? 'Cấp tốc'
      : plan.name === 'Weekly'
        ? 'Tăng tốc'
        : plan.name || 'Gói chuyên sâu';

  const badgeText = isHighlighted
    ? 'PHỔ BIẾN NHẤT'
    : isFree
      ? 'Thử phương pháp'
      : 'Chuẩn bị có mục tiêu';

  const formattedAmount = isFree
    ? '0 ₫'
    : formatPriceMinor(price.amountMinor, price.currency);
  const featureDescriptions = price.features.map(describePlanFeature).filter(Boolean) as string[];

  return (
    <article className={`${styles.planCard} ${isHighlighted ? styles.highlightedPlan : ''}`}>
      <div className={styles.planBadge}>{badgeText}</div>
      <h3>{displayName}</h3>
      <p className={styles.planDescription}>
        {plan.description || 'Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn.'}
      </p>
      <strong className={styles.planPrice}>{formattedAmount}</strong>
      <p className={styles.planDuration}>
        {price.durationDays === null ? 'Sử dụng linh hoạt' : `Trong ${price.durationDays} ngày`}
      </p>
      <div className={styles.planQuota}>
        {price.interviewQuota === null
          ? 'Hạn mức phỏng vấn: Chưa có thông tin'
          : `${price.interviewQuota} lượt phỏng vấn`}
      </div>
      <ul>
        {featureDescriptions.length > 0 ? featureDescriptions.map((description) => (
          <li key={description}>
            <Check size={15} aria-hidden="true" />
            <span>{description}</span>
          </li>
        )) : (
          <li className={styles.planFeatureUnavailable}>
            <span>Quyền lợi chi tiết sẽ được hiển thị khi kích hoạt gói.</span>
          </li>
        )}
      </ul>
      <button
        type="button"
        disabled={disabled}
        className={`${styles.primaryAction} ${!isHighlighted ? styles.outlineAction : ''}`}
        onClick={() => onSelect(plan, price)}
      >
        {isFree ? 'Bắt đầu miễn phí' : 'Chọn gói luyện tập'}
        <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
};
