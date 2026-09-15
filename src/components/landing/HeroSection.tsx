'use client';

import React, { useState, useEffect, useCallback } from 'react';

const slides = [
    {
        img: '/img/slide-interview-ai-gemini.jpg?v=3',
        alt: 'Giao diện Phỏng vấn AI của Nexora',
        tag: 'MOCK INTERVIEW',
        title: 'Phỏng vấn 1-1 với AI',
        desc: 'Trải nghiệm phỏng vấn thực tế bằng giọng nói với AI Interviewer đa phong cách.',
        icon: 'record_voice_over'
    },
    {
        img: '/img/slide-cv-analysis-gemini.jpg?v=3',
        alt: 'Giao diện Phân tích CV bằng AI của Nexora',
        tag: 'CV ANALYSIS',
        title: 'Phân tích & Tối ưu CV',
        desc: 'Đánh giá độ phù hợp của CV với Job Description và nhận gợi ý chỉnh sửa chi tiết.',
        icon: 'document_scanner'
    },
    {
        img: '/img/slide-scenarios-gemini.jpg?v=3',
        alt: 'Giao diện luyện Tình huống',
        tag: 'SCENARIO PRACTICE',
        title: 'Xử lý tình huống',
        desc: 'Rèn luyện phản xạ và tư duy giải quyết vấn đề qua các tình huống hóc búa.',
        icon: 'psychology'
    },
    {
        img: '/img/slide-star-builder-gemini.jpg?v=3',
        alt: 'Giao diện STAR Builder',
        tag: 'STAR METHOD',
        title: 'Xây dựng câu trả lời',
        desc: 'Cấu trúc hóa kinh nghiệm của bạn theo phương pháp STAR chuẩn quốc tế.',
        icon: 'magic_button'
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

    useEffect(() => {
        if (isHovered || reduceMotion) return;
        const timer = setInterval(nextSlide, 3500); 
        return () => clearInterval(timer);
    }, [isHovered, reduceMotion, nextSlide]);

    return (
        <section data-nx-section className="relative pt-0 pb-stack-lg hero-pattern overflow-hidden">
            <div className="container max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-stack-lg items-center relative z-10">
                
                {/* Text Content */}
                <div className="flex flex-col gap-6 sm:gap-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-primary-fixed/30 text-primary-fixed-dim px-4 py-1.5 rounded-full w-fit mx-auto lg:mx-0 border border-primary-fixed/50 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">psychology</span>
                        <span className="font-label-sm text-label-sm text-primary">Nền tảng Elite AI cho chuyên gia</span>
                    </div>
                    
                    <h1 className="font-display text-display text-on-surface tracking-tight">
                        Luyện phỏng vấn <span className="text-primary">thực chiến</span> cùng AI
                    </h1>
                    
                    <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant max-w-2xl mx-auto lg:mx-0">
                        Nexora giúp bạn phân tích CV, luyện phỏng vấn theo JD, nhận phản hồi chi tiết và biết mình cần cải thiện gì trước khi ứng tuyển.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 justify-center lg:justify-start">
                        <button className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-[12px] hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(53,37,205,0.2)] flex items-center justify-center gap-2">
                            Bắt đầu phỏng vấn miễn phí
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
                        </button>
                        <button className="w-full sm:w-auto bg-surface text-primary border border-primary-fixed font-label-md text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-[12px] hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">play_circle</span>
                            Xem cách hoạt động
                        </button>
                    </div>
                </div>

                {/* 3D Stacked Cards Carousel */}
                <div className="relative w-full h-[450px] md:h-[550px] flex flex-col items-center justify-center mt-8 lg:mt-0" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                    <div 
                        className="relative w-full h-full flex items-center justify-center"
                        style={{ perspective: '1200px' }}
                    >
                        {slides.map((slide, index) => {
                            const offset = (index - currentSlide + slides.length) % slides.length;
                            const isFront = offset === 0;
                            const zIndex = slides.length - offset;
                            
                            // Hide the last offset to create a looping illusion
                            const isHidden = offset === slides.length - 1;
                            const opacity = isHidden ? 0 : 1 - (offset * 0.15);

                            return (
                                <div 
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    // Phóng to kích thước thẻ tối đa
                                    className={`absolute w-full sm:w-[95%] lg:w-full max-w-[650px] rounded-2xl cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface border-2 ${isFront ? 'border-primary/40' : 'border-outline-variant/20'}`}
                                    style={{
                                        zIndex,
                                        opacity,
                                        transformStyle: 'preserve-3d',
                                        pointerEvents: isHidden ? 'none' : 'auto',
                                        transform: `
                                            rotateY(-22deg) 
                                            rotateX(12deg) 
                                            rotateZ(-2deg)
                                            translateZ(${offset * -100}px) 
                                            translateX(${offset * -8}%) 
                                            translateY(${offset * -6}%)
                                            ${isHovered && isFront ? 'translateZ(30px) scale(1.02)' : ''}
                                        `,
                                        boxShadow: isFront 
                                            ? '-30px 40px 60px -10px rgba(0,0,0,0.25)' 
                                            : '-10px 20px 40px -10px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <img 
                                        src={slide.img} 
                                        alt={slide.alt} 
                                        className="w-full h-auto object-cover rounded-xl" 
                                    />
                                    
                                    {/* 3D Floating Label (Enriched Content) */}
                                    <div 
                                        className={`absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 bg-surface/90 backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-4 rounded-xl shadow-2xl border border-white/40 transition-all duration-700 ease-out flex items-start gap-3 sm:gap-4 ${isFront ? 'opacity-100' : 'opacity-0 scale-95'}`}
                                        style={{ transform: isFront ? 'translateZ(70px)' : 'translateZ(0px)' }}
                                    >
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="material-symbols-outlined text-primary text-[20px] sm:text-[24px]">
                                                {slide.icon}
                                            </span>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-label-sm text-[10px] sm:text-[11px] text-primary uppercase tracking-wider font-bold mb-0.5">{slide.tag}</span>
                                            <span className="font-title-sm sm:font-title-md text-on-surface font-bold leading-tight">{slide.title}</span>
                                            <span className="hidden sm:block text-[13px] text-on-surface-variant mt-1.5 leading-snug">
                                                {slide.desc}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-2 mt-8 sm:mt-12 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-8 bg-primary shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'w-2 bg-outline-variant/40 hover:bg-outline-variant/80'}`}
                                aria-label={`Slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
