'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollReveal() {
    const pathname = usePathname();

    useEffect(() => {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!('IntersectionObserver' in window) || reduceMotion) return;

        const revealOnce = (el: HTMLElement) => {
            if (el.dataset.nxRevealed) return;
            el.dataset.nxRevealed = '1';
            el.classList.add('nx-fade-up');
        };

        const staggerObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                Array.from(e.target.children).forEach((child: any, i) => {
                    child.style.animationDelay = (i * 70) + 'ms';
                    revealOnce(child);
                });
                staggerObs.unobserve(e.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                revealOnce(e.target as HTMLElement);
                revealObs.unobserve(e.target);
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

        const barObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                (e.target as HTMLElement).classList.add('nx-bar-grow');
                barObs.unobserve(e.target);
            });
        }, { threshold: 0.4 });

        const timer = setTimeout(() => {
            document.querySelectorAll('[data-nx-stagger]').forEach(el => staggerObs.observe(el));
            document.querySelectorAll('[data-nx-section], [data-nx-card]').forEach(el => revealObs.observe(el));
            document.querySelectorAll('[data-nx-bar]').forEach(el => barObs.observe(el));
        }, 100);

        return () => {
            clearTimeout(timer);
            staggerObs.disconnect();
            revealObs.disconnect();
            barObs.disconnect();
        };
    }, [pathname]);
}
