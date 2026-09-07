'use client';
import React, { useRef } from 'react';
import styles from './Pricing.module.css';

const pricingPlans = [
  {
    id: 'free',
    name: 'FREE',
    price: 'Miễn phí',
    period: '',
    features: "1 lượt AI Phỏng vấn & Phân tích, Phân tích CV chuyên sâu theo JD, Báo cáo đánh giá chi tiết (Rubric), Lịch sử luyện tập lưu trữ 30 ngày"
  },
  {
    id: 'basic',
    name: 'BASIC',
    price: '49.000 ₫',
    period: 'VND / 3 ngày',
    features: "3 lượt AI Phỏng vấn & Phân tích, Phân tích CV chuyên sâu theo JD, Báo cáo đánh giá chi tiết (Rubric), Lịch sử luyện tập lưu trữ 30 ngày"
  },
  {
    id: 'weekly',
    name: 'WEEKLY',
    price: '189.000 ₫',
    period: 'VND / 14 ngày',
    features: "20 lượt AI Phỏng vấn & Phân tích, Phân tích CV chuyên sâu theo JD, Báo cáo đánh giá chi tiết (Rubric), Lịch sử luyện tập lưu trữ 30 ngày"
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '599.000 ₫',
    period: 'VND / 90 ngày',
    features: "Không giới hạn lượt AI Phỏng vấn & Phân tích, Phân tích CV chuyên sâu theo JD, Báo cáo đánh giá chi tiết (Rubric), Lịch sử luyện tập lưu trữ không giới hạn"
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className={styles.pricingSection}>
      <div className={styles.container}>
        <h2 className={styles.massiveTitle}>ACCESS.</h2>
        
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.colName}>GÓI</div>
            <div className={styles.colFeatures}>BAO GỒM</div>
            <div className={styles.colPrice}>MỨC PHÍ</div>
            <div className={styles.colAction}></div>
          </div>
          
          {pricingPlans.map((plan) => (
            <div key={plan.id} className={styles.tableRow}>
              <div className={styles.colName}>
                <h3 className={styles.planName}>{plan.name}</h3>
              </div>
              <div className={styles.colFeatures}>
                <p className={styles.features}>{plan.features}</p>
              </div>
              <div className={styles.colPrice}>
                <div className={styles.priceWrap}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>/ {plan.period}</span>
                </div>
              </div>
              <div className={styles.colAction}>
                <button className={styles.buyButton}>
                  {plan.price === '0đ' ? 'BẮT ĐẦU' : 'CHỌN MUA'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
