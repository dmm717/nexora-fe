'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const plans = [
    {
        id: 'Free',
        name: 'Free',
        desc: 'Làm quen với Nexora trước khi bắt đầu luyện tập nghiêm túc.',
        price: '0đ',
        period: '/ mãi mãi',
        duration: 'Không giới hạn thời gian',
        durationIcon: 'all_inclusive',
        features: [
            'Phân tích CV cơ bản',
            '01 lượt phỏng vấn mẫu',
            'Thư viện câu hỏi phổ biến'
        ],
        btnClass: 'nx-price-action-secondary',
        btnText: 'Bắt đầu miễn phí',
        href: '/auth?mode=register'
    },
    {
        id: 'Basic',
        name: 'Basic',
        desc: 'Trải nghiệm đầy đủ các công cụ cốt lõi trước khi chọn gói dài hơn.',
        price: '49.000đ',
        period: '/ gói',
        duration: 'Sử dụng trong 3 ngày',
        durationIcon: 'schedule',
        features: [
            '01 lượt phân tích CV chuyên sâu với JD',
            '03 lượt mô phỏng phỏng vấn cùng AI',
            'Trải nghiệm kho tình huống chuyên ngành',
            'STAR Builder và báo cáo sau phỏng vấn'
        ],
        btnClass: 'nx-price-action-secondary',
        btnText: 'Mua ngay',
        href: '/auth?mode=register'
    },
    {
        id: 'Weekly',
        name: 'Weekly',
        desc: 'Luyện tập chuyên sâu trong hai tuần với hạn mức thoải mái hơn.',
        price: '189.000đ',
        period: '/ gói',
        duration: 'Sử dụng trong 14 ngày',
        durationIcon: 'calendar_month',
        badge: 'Phổ biến nhất',
        isFeatured: true,
        features: [
            '05 lượt phân tích CV chuyên sâu với JD',
            '20 lượt mô phỏng phỏng vấn cùng AI',
            'Không giới hạn Tình huống và STAR Builder',
            'Báo cáo chi tiết sau mỗi buổi luyện tập'
        ],
        btnClass: 'nx-price-action-primary',
        btnText: 'Mua ngay',
        href: '/auth?mode=register'
    },
    {
        id: 'Pro',
        name: 'Pro',
        desc: 'Lộ trình dài hạn cho ứng viên muốn chinh phục nhiều cơ hội.',
        price: '599.000đ',
        period: '/ gói',
        duration: 'Sử dụng trong 90 ngày',
        durationIcon: 'workspace_premium',
        isPro: true,
        features: [
            'Không giới hạn phân tích CV và phỏng vấn AI',
            'Không giới hạn Tình huống và STAR Builder',
            'Phân tích chuyên sâu kỹ năng và cảm xúc',
            'Theo dõi tiến bộ bằng báo cáo cá nhân hóa'
        ],
        btnClass: 'nx-price-action-dark',
        btnText: 'Mua ngay',
        href: '/auth?mode=register'
    }
];

export default function PricingSection() {
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const grid = gridRef.current;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!grid || !('IntersectionObserver' in window) || reduceMotion) return;

        const cards = Array.from(grid.querySelectorAll('.nx-price-card')) as HTMLElement[];
        cards.forEach((card, index) => card.style.setProperty('--nx-card-index', index.toString()));
        grid.classList.add('nx-pricing-motion-ready');

        const observer = new IntersectionObserver((entries) => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            grid.classList.add('nx-pricing-in-view');
            observer.disconnect();
        }, { threshold: 0.1 });

        observer.observe(grid);

        // Tilt effect
        let cleanupTilt = () => {};
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            const handlePointerMove = (card: HTMLElement, event: PointerEvent) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--nx-tilt-x', `${(-y * 2.2).toFixed(2)}deg`);
                card.style.setProperty('--nx-tilt-y', `${(x * 2.2).toFixed(2)}deg`);
                card.style.setProperty('--nx-glow-x', `${((x + 0.5) * 100).toFixed(1)}%`);
                card.style.setProperty('--nx-glow-y', `${((y + 0.5) * 100).toFixed(1)}%`);
            };

            const handlePointerLeave = (card: HTMLElement) => {
                card.style.removeProperty('--nx-tilt-x');
                card.style.removeProperty('--nx-tilt-y');
                card.style.removeProperty('--nx-glow-x');
                card.style.removeProperty('--nx-glow-y');
            };

            const handlers = cards.map(card => {
                const moveHandler = (e: Event) => handlePointerMove(card, e as PointerEvent);
                const leaveHandler = () => handlePointerLeave(card);
                card.addEventListener('pointermove', moveHandler);
                card.addEventListener('pointerleave', leaveHandler);
                return { card, moveHandler, leaveHandler };
            });

            cleanupTilt = () => {
                handlers.forEach(({ card, moveHandler, leaveHandler }) => {
                    card.removeEventListener('pointermove', moveHandler);
                    card.removeEventListener('pointerleave', leaveHandler);
                });
            };
        }

        return () => {
            observer.disconnect();
            cleanupTilt();
        };
    }, []);

    return (
        <section data-nx-section className="nx-pricing-wrap" aria-labelledby="pricing-heading">
            <div className="nx-pricing-intro">
                <h2 id="pricing-heading">Chọn nhịp luyện tập phù hợp</h2>
                <p>Thanh toán một lần, sử dụng trọn thời hạn. Không tự động gia hạn.</p>
            </div>

            <div ref={gridRef} className="nx-pricing-grid" data-pricing-motion>
                {plans.map((plan) => (
                    <article 
                        key={plan.id} 
                        data-plan-card={plan.id} 
                        className={`nx-price-card ${plan.isFeatured ? 'nx-price-card-featured' : ''} ${plan.isPro ? 'nx-price-card-pro' : ''}`}
                    >
                        {plan.badge && <div data-plan-badge className="nx-price-badge">{plan.badge}</div>}
                        <div className="nx-price-card-head">
                            <p className="nx-price-name">{plan.name}</p>
                            <p className="nx-price-desc">{plan.desc}</p>
                        </div>
                        <div className="nx-price-value">
                            <strong>{plan.price}</strong><span>{plan.period}</span>
                        </div>
                        <p className="nx-price-duration">
                            <span className="material-symbols-outlined" aria-hidden="true">{plan.durationIcon}</span>
                            {plan.duration}
                        </p>
                        <ul className="nx-price-features">
                            {plan.features.map((feature, i) => (
                                <li key={i}>
                                    <span className="material-symbols-outlined" aria-hidden="true">
                                        {feature.includes('phân tích CV') ? 'description' : 
                                         feature.includes('mô phỏng') ? 'smart_toy' : 
                                         feature.includes('Tình huống') || feature.includes('kho') ? 'psychology' : 
                                         feature.includes('báo cáo chi tiết') ? 'assessment' : 
                                         feature.includes('STAR') ? 'construction' : 
                                         feature.includes('kỹ năng') ? 'analytics' : 
                                         feature.includes('Theo dõi') ? 'monitoring' : 'check'}
                                    </span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link data-plan-action className={`nx-price-action ${plan.btnClass}`} href={plan.href}>
                            {plan.btnText}
                        </Link>
                    </article>
                ))}
            </div>

            <p className="nx-pricing-note">
                <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                Thanh toán an toàn · Kích hoạt ngay · Hỗ trợ trong suốt thời hạn gói
            </p>
        </section>
    );
}
