'use client';

import React from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
import type { PlanView, PlanPrice } from '@/services/billingApi';
import { formatPriceMinor } from '@/utils/formatters';
import styles from './landing.module.css';

interface LandingPlanCardProps {
  plan: PlanView;
  price: PlanPrice;
  isHighlighted?: boolean;
  onSelect: (plan: PlanView, price: PlanPrice) => void;
}

export const LandingPlanCard: React.FC<LandingPlanCardProps> = ({
  plan,
  price,
  isHighlighted = false,
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

  return (
    <article className={`${styles.planCard} ${isHighlighted ? styles.highlightedPlan : ''}`}>
      <div className={styles.planBadge}>{badgeText}</div>
      <h3>{displayName}</h3>
      <p className={styles.planDescription}>
        {isFree
          ? 'Trải nghiệm phương pháp luyện phỏng vấn và phân tích hồ sơ'
          : `Gói luyện tập chuyên sâu cho mục tiêu ${plan.name}`}
      </p>
      <strong className={styles.planPrice}>{formattedAmount}</strong>
      <p className={styles.planDuration}>
        {price.durationDays ? `Trong ${price.durationDays} ngày` : 'Không giới hạn thời gian'}
      </p>
      <div className={styles.planQuota}>
        {price.interviewQuota
          ? `${price.interviewQuota} lượt phỏng vấn`
          : 'Luyện phỏng vấn linh hoạt'}
      </div>
      <ul>
        <li>
          <Check size={15} aria-hidden="true" />
          <span>{isFree ? '01 Phiên phỏng vấn AI mẫu (3 câu/phiên)' : `${price.interviewQuota || 'Nhiều'} phiên phỏng vấn toàn diện`}</span>
        </li>
        <li>
          <Check size={15} aria-hidden="true" />
          <span>{isFree ? 'Phân tích CV theo từ khóa cơ bản' : 'Phân tích CV chuyên sâu theo vị trí mục tiêu'}</span>
        </li>
        <li>
          <Check size={15} aria-hidden="true" />
          <span>{isFree ? 'Báo cáo điểm số tổng quan' : 'Báo cáo chi tiết từng câu & phân tích STAR'}</span>
        </li>
        {!isFree && (
          <li>
            <Check size={15} aria-hidden="true" />
            <span>Tiếp tục ngay câu 4+ trong cùng phiên phỏng vấn</span>
          </li>
        )}
      </ul>
      {isFree && (
        <p className={styles.planBoundary}>
          Trải nghiệm 3 câu hỏi trước khi chọn nâng cấp. Báo cáo nâng cao đa phiên chưa bao gồm.
        </p>
      )}
      <button
        type="button"
        className={`${styles.primaryAction} ${!isHighlighted ? styles.outlineAction : ''}`}
        onClick={() => onSelect(plan, price)}
      >
        {isFree ? 'Bắt đầu miễn phí' : 'Chọn gói luyện tập'}
        <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </article>
  );
};
