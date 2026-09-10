'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate steps coming up smoothly
      gsap.fromTo(
        '.step-card-anim',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
          },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-20 lg:py-32 bg-[#FAFBFF] relative overflow-hidden" id="how-it-works">
      
      {/* BACKGROUND SVG WAVY CONNECTING LINES & GLOW */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <svg className="w-full h-full min-w-[1200px]" viewBox="0 0 1440 1100" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wavePathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
            </linearGradient>
            <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* S-Curve Main Path connecting Step 01 -> Step 02 -> Step 03 */}
          <path
            d="M 160 220 C 320 220, 260 480, 600 480 C 920 480, 880 750, 1180 750"
            stroke="url(#wavePathGrad)"
            strokeWidth="3.5"
            strokeDasharray="6 6"
            className="animate-dash-march"
            filter="url(#pathGlow)"
          />
          <path
            d="M 140 230 C 300 230, 240 490, 580 490 C 900 490, 860 760, 1160 760"
            stroke="url(#wavePathGrad)"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Glowing Waypoint Dots along path */}
          <circle cx="260" cy="300" r="5" fill="#A855F7" />
          <circle cx="260" cy="300" r="10" fill="#A855F7" opacity="0.3" />

          <circle cx="660" cy="560" r="6" fill="#10B981" />
          <circle cx="660" cy="560" r="12" fill="#10B981" opacity="0.3" />

          <circle cx="860" cy="680" r="5" fill="#8B5CF6" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* CONTAINER FOR ALL STEPS AND TYPOGRAPHY */}
        <div className="space-y-16 lg:space-y-24">

          {/* ================= STEP 01 (TOP LEFT) ================= */}
          <div className="step-card-anim flex flex-col lg:flex-row items-center gap-6 lg:gap-10 max-w-[700px] relative z-20">
            
            {/* Step 01 Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-9 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-full lg:w-[360px] shrink-0">
              <div className="text-5xl font-serif italic text-slate-800 font-extrabold mb-3 tracking-tight">
                01
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Tải lên CV Của Bạn
              </h3>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                Nhận phân tích và tối ưu hóa từ AI ngay lập tức.
              </p>
            </div>

            {/* Step 01 Floating 3D CV Mockup */}
            <div className="relative w-[210px] bg-white rounded-2xl border border-slate-200 shadow-[0_15px_35px_rgba(0,0,0,0.07)] p-3 shrink-0 transform lg:rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100">
                <img src="/images/mentor1.png" alt="CV Avatar" className="w-8 h-8 rounded-full object-cover" />
                <div className="space-y-1 flex-1">
                  <div className="h-2 w-16 bg-slate-800 rounded"></div>
                  <div className="h-1.5 w-10 bg-slate-300 rounded"></div>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="h-1.5 w-full bg-slate-200 rounded"></div>
                <div className="h-1.5 w-4/5 bg-slate-200 rounded"></div>
                <div className="h-1.5 w-full bg-purple-200 rounded"></div>
                <div className="h-1.5 w-2/3 bg-slate-200 rounded"></div>
              </div>
              {/* Progress bar at bottom */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              </div>
            </div>

            {/* Purple Star Mascot Floating next to Step 1 */}
            <div className="hidden lg:block absolute -left-12 bottom-[-40px] w-24 h-24 z-30 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-bounce-slow">
                <defs>
                  <linearGradient id="star-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="50%" stopColor="#D946EF" />
                    <stop offset="100%" stopColor="#9333EA" />
                  </linearGradient>
                  <filter id="shadow-2" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
                  </filter>
                </defs>

                {/* Star Body */}
                <path d="M50 15 L62 40 L88 40 L67 55 L75 80 L50 65 L25 80 L33 55 L12 40 L38 40 Z" fill="url(#star-grad-2)" filter="url(#shadow-2)" />

                {/* 3D Highlight/Bevel Effect */}
                <path d="M50 15 L62 40 L50 50 Z" fill="white" opacity="0.2" />
                <path d="M12 40 L38 40 L50 50 Z" fill="white" opacity="0.3" />
                <path d="M88 40 L62 40 L50 50 Z" fill="black" opacity="0.15" />

                {/* Winking Left Eye */}
                <path d="M38 50 Q42 45 46 50" stroke="#1C1C28" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                
                {/* Normal Right Eye */}
                <ellipse cx="58" cy="50" rx="4" ry="6" fill="#1C1C28" />
                <circle cx="59" cy="48" r="1.5" fill="white" />

                {/* Big Happy Smile instead of Beak */}
                <path d="M45 56 Q50 64 55 56 Z" fill="#F59E0B" />
                <path d="M45 56 Q50 64 55 56 Z" fill="#EF4444" opacity="0.6" /> {/* Tongue */}
              </svg>
            </div>
          </div>


          {/* ================= STEP 02 (MIDDLE RIGHT) ================= */}
          <div className="step-card-anim flex flex-col lg:flex-row items-center gap-6 lg:gap-10 max-w-[920px] ml-auto relative z-20">
            
            {/* Step 02 Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-9 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-full lg:w-[360px] shrink-0">
              <div className="text-5xl font-serif italic text-slate-800 font-extrabold mb-3 tracking-tight">
                02
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Phỏng Vấn<br />Giả Định với AI
              </h3>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                Luyện tập với AI thông minh, câu hỏi cá nhân hóa, nhận phản hồi thời gian thực.
              </p>
            </div>

            {/* Step 02 Composite UI Mockup (AI Mock Interview + Sentiment + Chart Panel) */}
            <div className="relative flex-1 w-full min-h-[220px]">
              
              {/* Main Window Mockup */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_45px_rgba(0,0,0,0.07)] p-3 overflow-hidden max-w-[420px]">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-[9px] font-bold text-gray-700 mx-auto">AI Mock Interview</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* AI Interviewer */}
                  <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative aspect-[4/3]">
                    <img src="/images/interviewer.png" alt="AI Interviewer" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[7px] font-bold text-slate-700 bg-white/90 px-1 py-0.5 rounded">AI Interviewer</span>
                  </div>

                  {/* Candidate Video Feed with ON AIR */}
                  <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative aspect-[4/3]">
                    <img src="/images/candidate.png" alt="Candidate" className="w-full h-full object-cover" />
                    <span className="absolute top-1 right-1 text-[6px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                      ● ON AIR
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Sentiment Card (Top Right over Step 2) */}
              <div className="absolute -top-10 -right-2 lg:-right-10 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 w-[200px] z-30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-gray-800">Sentiment</span>
                  {/* Peeking mascot */}
                  <img src="/images/mascot.png" alt="Mascot" className="w-6 h-6 object-contain" />
                </div>
                {/* Soundwave Bars */}
                <div className="h-7 flex items-center justify-center gap-0.5 my-1">
                  {[10, 18, 8, 22, 14, 26, 10, 20, 12, 16, 8, 24, 10].map((h, i) => (
                    <div key={i} className="w-1 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full" style={{ height: `${h}px` }}></div>
                  ))}
                </div>
                <div className="flex justify-between text-[6px] font-bold text-gray-400 mt-1">
                  <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-purple-500"></span>Sentiment</span>
                  <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500"></span>Hỏi</span>
                  <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-amber-500"></span>Alaniros</span>
                </div>
              </div>

              {/* Floating Chart Panel Card (Bottom Right over Step 2) */}
              <div className="absolute -bottom-8 -right-2 lg:-right-8 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 w-[210px] z-30 space-y-1.5">
                <div className="text-[9px] font-bold text-gray-800">Chart panel</div>
                
                {[
                  { label: 'Confidence Score', score: '85.0', width: '85%', color: 'bg-emerald-500' },
                  { label: 'Relevance Score', score: '75.0', width: '75%', color: 'bg-purple-500' },
                  { label: 'Text Clarity', score: '75.0', width: '75%', color: 'bg-indigo-500' },
                  { label: 'Irrelevance', score: '25.0', width: '25%', color: 'bg-amber-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-[6.5px] font-bold text-gray-600">
                      <span>{item.label}</span>
                      <span>{item.score}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: item.width }}></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>


          {/* ================= BOTTOM ROW: BIG TITLE (LEFT) & STEP 03 (RIGHT) ================= */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 pt-6 relative z-20">
            
            {/* Left Big Heading Typography */}
            <div className="max-w-[480px]">
              <h2 className="text-[2.5rem] md:text-[3.5rem] font-serif font-bold text-gray-900 leading-[1.1] tracking-tight">
                Bắt Đầu<br />
                Chinh Phục<br />
                Sự Nghiệp với<br />
                Quy Trình 3<br />
                Bước Gọn.
              </h2>
            </div>

            {/* Step 03 Card & Transcript Mockup (Right) */}
            <div className="step-card-anim flex flex-col lg:flex-row items-center gap-6 lg:gap-8 max-w-[850px] w-full lg:w-auto">
              
              {/* Step 03 Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-9 border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-full lg:w-[340px] shrink-0">
                <div className="text-5xl font-serif italic text-slate-800 font-extrabold mb-3 tracking-tight">
                  03
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Nhận Phản Hồi<br />Toàn Diện
                </h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
                  Xem điểm số chi tiết, gợi ý cải thiện và bản ghi âm đầy đủ.
                </p>
              </div>

              {/* Step 03 UI Mockup (Degree Match + Transcript) */}
              <div className="relative flex-1 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_45px_rgba(0,0,0,0.07)] p-3 w-full min-w-[320px]">
                
                {/* 72% Match score badge top right */}
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full shadow-md">
                  72% Match
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Left: Match checklist */}
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 space-y-1.5">
                    <div className="text-[8px] font-bold text-gray-800 mb-1">Độ khớp CV - JD</div>
                    <div className="flex items-center gap-1 text-[6px] text-gray-600 bg-white p-1 rounded border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      <span>10 khoản khớp với JD</span>
                    </div>
                    
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[6px] font-bold text-gray-500">
                        <span>Clarity</span>
                        <span className="text-emerald-600">8.5/10</span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-emerald-500"></div>
                      </div>

                      <div className="flex justify-between text-[6px] font-bold text-gray-500">
                        <span>SkillScore</span>
                        <span className="text-purple-600">9.0/10</span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="w-[90%] h-full bg-purple-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Transcript Panel */}
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="text-[8px] font-bold text-gray-800 mb-1">Transcript</div>
                      <p className="text-[6.5px] text-gray-500 leading-tight">
                        Lorem ipsum dolor sit amet, <span className="bg-purple-100 text-purple-800 px-0.5 rounded font-bold">dự án pet-app</span> của bạn rất đặc sắc...
                      </p>
                    </div>

                    <button className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[7px] py-1 rounded flex items-center justify-center gap-1 transition-colors">
                      ▶ PLAYBACK
                    </button>
                  </div>
                </div>

                {/* Purple Mascot Peeking from Bottom Right of Step 3 */}
                <div className="absolute -right-4 -bottom-4 w-14 h-14 z-30 pointer-events-none">
                  <img src="/images/mascot.png" alt="Mascot" className="w-full h-full object-contain drop-shadow-md" />
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Right CTA Button */}
          <div className="flex justify-end pt-4">
            <button className="bg-[#2D3748] hover:bg-[#1A202C] text-white font-bold text-sm py-3.5 px-8 rounded-full shadow-lg transition-transform hover:scale-105">
              Bắt Đầu Luyện Tập Ngay
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HowItWorks;

