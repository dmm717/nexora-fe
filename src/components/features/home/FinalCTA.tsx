'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const FinalCTA = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entry animations
      gsap.fromTo(
        '.cta-headline-anim',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );

      gsap.fromTo(
        '.cta-sub-anim',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );

      gsap.fromTo(
        '.cta-btn-anim',
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          delay: 0.35,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );

      // Smooth floating animation removed per user request so the elements stand still
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-16 md:py-24 px-4 md:px-8 bg-transparent max-w-[1380px] mx-auto overflow-hidden">
      {/* Outer Card Container */}
      <div className="relative bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] px-8 sm:px-12 md:px-16 pt-16 pb-8 md:pt-20 md:pb-10 overflow-hidden min-h-[560px] flex flex-col justify-between">
        
        {/* UNIFIED GRAPHIC NETWORK (Arches, Connecting Lines, Nodes, 3D Crystals) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 1200 600"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="lineGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="c1_top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F472B6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="c1_front_left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="c1_front_right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="c1_back" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="c2_facet1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="c2_facet2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="c2_top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.8" />
            </linearGradient>

            <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* CONNECTING CURVED ARCS */}
          {/* Main sweeping curve from bottom left to top right */}
          <path
            d="M 380 440 C 650 350 750 150 950 80"
            stroke="url(#lineGrad1)"
            strokeWidth="1.5"
            fill="none"
          />
          
          {/* Curve from top right intersecting to mid right */}
          <path
            d="M 950 80 C 1000 150 1020 250 980 320"
            stroke="url(#lineGrad1)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Curve from mid right down to footer center */}
          <path
            d="M 980 320 C 900 400 850 500 780 550"
            stroke="url(#lineGrad1)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            fill="none"
          />
          
          {/* Tiny curve near bottom left crystal */}
          <path
            d="M 380 440 C 430 430 450 390 460 350"
            stroke="url(#lineGrad1)"
            strokeWidth="1"
            fill="none"
          />

          {/* GLOWING DESTINATION POINTS (NODES) */}
          <g filter="url(#glowFilter)">
            {/* Node 1: Top Right */}
            <circle cx="950" cy="80" r="5" fill="#8B5CF6" />
            <circle cx="950" cy="80" r="2" fill="#FFFFFF" />
            
            {/* Node 2: Mid Right */}
            <circle cx="980" cy="320" r="6" fill="#6366F1" />
            <circle cx="980" cy="320" r="2.5" fill="#FFFFFF" />

            {/* Node 3: Bottom Left (Near Crystal) */}
            <circle cx="380" cy="440" r="5.5" fill="#38BDF8" />
            <circle cx="380" cy="440" r="2" fill="#FFFFFF" />
            
            {/* Node 4: Bottom Center (Near Footer) */}
            <circle cx="780" cy="550" r="4" fill="#8B5CF6" />
            <circle cx="780" cy="550" r="1.5" fill="#FFFFFF" />

            {/* Node 5: Tiny dot near bottom left */}
            <circle cx="460" cy="350" r="3" fill="#6366F1" />
          </g>

          {/* 3D CRYSTAL - TOP RIGHT */}
          <g transform="translate(1080, 100) scale(1.2)" className="float-element-2">
            <polygon points="50,10 95,50 50,75 5,50" fill="url(#c2_top)" stroke="#FFFFFF" strokeWidth="0.5" />
            <polygon points="50,75 5,50 50,130" fill="url(#c2_facet1)" stroke="#818CF8" strokeWidth="0.5" />
            <polygon points="50,75 95,50 50,130" fill="url(#c2_facet2)" stroke="#38BDF8" strokeWidth="0.5" />
          </g>

          {/* 3D CRYSTAL - BOTTOM LEFT */}
          <g transform="translate(250, 420) scale(0.9)" className="float-element-1" filter="url(#glowFilter)">
            <polygon points="80,15 130,55 80,145" fill="url(#c1_back)" />
            <polygon points="80,15 30,55 80,145" fill="url(#c1_front_left)" opacity="0.85" />
            <polygon points="80,15 115,55 80,85 45,55" fill="url(#c1_top)" stroke="#E0E7FF" strokeWidth="0.5" />
            <polygon points="80,85 45,55 80,145" fill="url(#c1_front_left)" stroke="#818CF8" strokeWidth="0.5" />
            <polygon points="80,85 115,55 80,145" fill="url(#c1_front_right)" stroke="#38BDF8" strokeWidth="0.5" />
            <polygon points="45,55 30,55 80,145" fill="url(#c1_front_right)" opacity="0.9" />
          </g>
        </svg>

        {/* Card Main Body Content */}
        <div className="relative z-10 w-full flex flex-col">
          
          {/* Main Headline - Ultra High Contrast Luxury Serif, Left Aligned like the image */}
          <div className="cta-headline-anim w-full text-left">
            <h2 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-medium text-[#1A103C] tracking-tight leading-[1.05] mb-4 uppercase"
              style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', Didot, Georgia, serif" }}
            >
              CHINH PHỤC CƠ HỘI <br />
              SỰ NGHIỆP{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#60A5FA] to-[#38BDF8]">
                CÙNG AI
              </span>
            </h2>
          </div>

          {/* Sub-headline & Action Buttons Row */}
          <div className="cta-sub-anim mt-16 lg:mt-24 flex flex-col lg:flex-row lg:items-center justify-between gap-10 pb-8">
            
            {/* Sub-headline Text (Left) */}
            <p className="text-[#64748B] font-normal text-base md:text-lg max-w-sm leading-relaxed text-left">
              Tham gia nền tảng luyện tập phỏng <br className="hidden sm:inline" />
              vấn thông minh hàng đầu.
            </p>

            {/* Action Buttons (Right) - Matching Mockup */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-5 justify-start lg:justify-end">
              {/* Button 1: THAM GIA NGAY */}
              <Link
                href="/auth?mode=register"
                className="cta-btn-anim group relative inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] text-white font-bold text-[10px] md:text-xs tracking-widest uppercase shadow-[0_12px_24px_-4px_rgba(124,58,237,0.4)] hover:shadow-[0_18px_32px_-4px_rgba(124,58,237,0.55)] hover:-translate-y-0.5 transition-all duration-300"
              >
                THAM GIA NGAY
              </Link>

              {/* Button 2: ĐĂNG KÝ MIỄN PHÍ */}
              <Link
                href="/auth?mode=register"
                className="cta-btn-anim group relative inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-full bg-white border-2 border-[#8B5CF6]/30 text-[#7C3AED] font-bold text-[10px] md:text-xs tracking-widest uppercase shadow-sm hover:border-[#7C3AED] hover:bg-purple-50/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                ĐĂNG KÝ MIỄN PHÍ
              </Link>
            </div>
          </div>
        </div>



      </div>
    </section>
  );
};

export default FinalCTA;
