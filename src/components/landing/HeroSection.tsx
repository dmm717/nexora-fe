'use client';

import React, { useState, useEffect, useCallback } from 'react';


const slides = [
    {
        img: '/img/slide-interview-ai-gemini.jpg?v=3',
        alt: 'Giao diện Phỏng vấn AI của Nexora',
        label: 'Phỏng vấn AI theo CV và JD',
    },
    {
        img: '/img/slide-cv-analysis-gemini.jpg?v=3',
        alt: 'Giao diện Phân tích CV bằng AI của Nexora',
        label: 'Phân tích CV và chỉ ra điểm cần cải thiện',
    },
    {
        img: '/img/slide-scenarios-gemini.jpg?v=3',
        alt: 'Giao diện luyện Tình huống thực chiến của Nexora',
        label: 'Luyện tư duy qua tình huống thực chiến',
    },
    {
        img: '/img/slide-star-builder-gemini.jpg?v=3',
        alt: 'Giao diện STAR Builder của Nexora',
        label: 'Cấu trúc câu trả lời với STAR Builder',
    }
];

export default function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduceMotion(mediaQuery.matches);
        
        const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);

    useEffect(() => {
        if (isHovered || reduceMotion) return;
        const timer = setInterval(nextSlide, 6500);
        return () => clearInterval(timer);
    }, [isHovered, reduceMotion, nextSlide]);

    return (
        <section data-nx-section className="relative pt-24 pb-stack-lg hero-pattern overflow-hidden">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-stack-lg items-center relative z-10">
                
                {/* Text Content */}
                <div className="flex flex-col gap-stack-md text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-primary-fixed/30 text-primary-fixed-dim px-4 py-1.5 rounded-full w-fit mx-auto lg:mx-0 border border-primary-fixed/50 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">psychology</span>
                        <span className="font-label-sm text-label-sm text-primary">Nền tảng Elite AI cho chuyên gia</span>
                    </div>
                    
                    <h1 className="font-display text-display text-on-surface tracking-tight">
                        Luyện phỏng vấn <span className="text-primary">thực chiến</span> cùng AI
                    </h1>
                    
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto lg:mx-0">
                        Nexora giúp bạn phân tích CV, luyện phỏng vấn theo JD, nhận phản hồi chi tiết và biết mình cần cải thiện gì trước khi ứng tuyển.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 justify-center lg:justify-start">
                        <button className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-8 py-3.5 rounded-[12px] hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(53,37,205,0.2)] flex items-center justify-center gap-2">
                            Bắt đầu phỏng vấn miễn phí
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                        </button>
                        <button className="w-full sm:w-auto bg-surface text-primary border border-primary-fixed font-label-md text-label-md px-8 py-3.5 rounded-[12px] hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">play_circle</span>
                            Xem cách hoạt động
                        </button>
                    </div>
                </div>

                {/* Gemini-generated product feature carousel */}
                <section 
                    className="nx-hero-feature-carousel" 
                    aria-label="Các tính năng chính của Nexora"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onFocus={() => setIsHovered(true)}
                    onBlur={() => setIsHovered(false)}
                >
                    <div className="nx-hero-carousel-viewport" aria-live="polite">
                        {slides.map((slide, index) => {
                            const isActive = index === currentSlide;
                            return (
                                <figure 
                                    key={index} 
                                    className={`nx-hero-feature-slide ${isActive ? 'is-active' : ''}`}
                                    hidden={!isActive}
                                    aria-hidden={!isActive}
                                >
                                    <img 
                                        src={slide.img} 
                                        alt={slide.alt} 
                                        width={590} 
                                        height={345} 
                                       
                                        
                                    />
                                </figure>
                            );
                        })}
                    </div>
                    <div className="nx-hero-carousel-footer">
                        <div className="nx-hero-carousel-copy">
                            <span className="material-symbols-outlined" aria-hidden="true">graphic_eq</span>
                            <span>{slides[currentSlide].label}</span>
                        </div>
                        <div className="nx-hero-carousel-controls">
                            <button type="button" aria-label="Tính năng trước" onClick={prevSlide}>
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="nx-hero-carousel-dots" role="tablist" aria-label="Chọn tính năng">
                                {slides.map((_, index) => (
                                    <button 
                                        key={index}
                                        className={index === currentSlide ? 'is-active' : ''} 
                                        type="button" 
                                        role="tab" 
                                        aria-selected={index === currentSlide}
                                        aria-label={`Slide ${index + 1}`}
                                        onClick={() => setCurrentSlide(index)}
                                    />
                                ))}
                            </div>
                            <button type="button" aria-label="Tính năng tiếp theo" onClick={nextSlide}>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </section>
    );
}
