'use client';
import React, { useRef } from 'react';
import styles from './Pricing.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0đ',
    period: '',
    popular: false,
    features: [
      { title: 'Phân tích CV/JD', desc: 'Cơ bản (Keyword)', enabled: true },
      { title: 'Phiên Phỏng vấn AI', desc: '01 lượt (Mẫu, giới hạn 3 câu hỏi/phiên)', enabled: true },
      { title: 'Case Study Bank', desc: 'Mở khóa các câu hỏi "Phổ biến" (General)', enabled: true },
      { title: 'STAR Builder', desc: 'Không truy cập', enabled: false },
      { title: 'Post-Interview Report', desc: 'Điểm số tổng quan', enabled: true },
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '49K',
    period: '/ 3 Ngày',
    popular: false,
    features: [
      { title: 'Phân tích CV/JD', desc: 'Chuyên sâu - Tối đa 01 lượt', enabled: true },
      { title: 'Phiên Phỏng vấn AI', desc: '03 lượt (Full câu hỏi)', enabled: true },
      { title: 'Case Study Bank', desc: 'Mở khóa kho tình huống Chuyên ngành', enabled: true },
      { title: 'STAR Builder', desc: 'Có truy cập', enabled: true },
      { title: 'Post-Interview Report', desc: 'Điểm chi tiết từng câu + Phân tích STAR', enabled: true },
    ]
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: '189K',
    period: '/ 7 Ngày',
    popular: true,
    features: [
      { title: 'Phân tích CV/JD', desc: 'Chuyên sâu - Tối đa 05 lượt', enabled: true },
      { title: 'Phiên Phỏng vấn AI', desc: '20 lượt (Full câu hỏi)', enabled: true },
      { title: 'Case Study Bank', desc: 'Unlimited', enabled: true },
      { title: 'STAR Builder', desc: 'Unlimited', enabled: true },
      { title: 'Post-Interview Report', desc: 'Báo cáo chi tiết', enabled: true },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '599K',
    period: '/ 90 Ngày',
    popular: false,
    features: [
      { title: 'Phân tích CV/JD', desc: 'Chuyên sâu - Unlimited', enabled: true },
      { title: 'Phiên Phỏng vấn AI', desc: 'Unlimited', enabled: true },
      { title: 'Case Study Bank', desc: 'Unlimited', enabled: true },
      { title: 'STAR Builder', desc: 'Unlimited', enabled: true },
      { title: 'Post-Interview Report', desc: '+ Phân tích kỹ năng mềm, cảm xúc. Report cá nhân.', enabled: true },
    ]
  }
];

const CheckIcon = () => (
  <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CrossIcon = () => (
  <svg className={styles.crossIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Pricing = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      
      gsap.fromTo(cards, 
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          }
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section id="pricing" className={styles.pricingSection} ref={sectionRef}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.tag}>Bảng giá</span>
          <h2 className={styles.title}>Đầu tư cho <span className={styles.highlight}>Tương lai</span></h2>
          <p className={styles.desc}>
            Lựa chọn gói phù hợp để trải nghiệm phỏng vấn AI và phân tích CV tốt nhất cùng Nexora.
          </p>
        </div>

        <div className={styles.grid} ref={cardsRef}>
          {pricingPlans.map((plan) => (
            <div key={plan.id} className={styles.card}>
              {plan.popular && <div className={styles.popularBadge}>Khuyên dùng</div>}
              
              <div className={styles.cardHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.priceWrap}>
                  <span className={styles.price}>{plan.price}</span>
                  {plan.period && <span className={styles.period}>{plan.period}</span>}
                </div>
              </div>

              <div className={styles.featuresList}>
                {plan.features.map((feature) => (
                  <div key={feature.title} className={`${styles.featureItem} ${!feature.enabled ? styles.featureItemDisabled : ''}`}>
                    {feature.enabled ? <CheckIcon /> : <CrossIcon />}
                    <div className={styles.featureText}>
                      <span className={styles.featureTitle}>{feature.title}</span>
                      <span className={styles.featureDesc}>{feature.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.buttonWrap}>
                <button className={`${styles.buyButton} ${plan.popular ? styles.buyButtonPopular : ''}`}>
                  {plan.price === '0đ' ? 'Bắt đầu miễn phí' : 'Đăng ký ngay'}
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
