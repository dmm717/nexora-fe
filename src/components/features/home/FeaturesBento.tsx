'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FeaturesBento = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bento-card-anim',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-20 lg:py-28 bg-[#F6F8FD] relative overflow-hidden" id="features">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-[2.75rem] md:text-[3.75rem] font-extrabold text-[#0F172A] tracking-tight">
            Tính Năng
          </h2>
        </div>

        {/* GIANT OUTER BENTO CONTAINER MATCHING THE REFERENCE IMAGE */}
        <div className="bg-[#EEF2FB] border border-[#D8E1F3] rounded-[2.5rem] md:rounded-[3.2rem] p-4 md:p-8 lg:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative">
          
          {/* 4-COLUMN BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 lg:gap-6 relative">

            {/* ================= ROW 1 ================= */}

            {/* CARD 1: Phân Tích & Phản Hồi Thông Minh (Col 1) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-6 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[340px] group hover:shadow-lg transition-all duration-300">
              
              {/* Connector Arrow to Card 2 */}
              <div className="hidden lg:flex absolute -right-7 top-1/2 -translate-y-1/2 z-30 items-center text-indigo-400 pointer-events-none">
                <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                  <path d="M2 10H28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M24 4L32 10L24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Phân Tích & Phản Hồi<br />Thông Minh
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[90%]">
                  Phân tích analysis đã thông nác CV và liên văn mái tuyển tuyển.
                </p>
              </div>

              {/* Graphic Area */}
              <div className="mt-6 relative w-full h-[180px] bg-slate-50/70 rounded-2xl border border-slate-100 p-3 overflow-hidden">
                {/* Skeleton Document */}
                <div className="w-[65%] bg-white rounded-xl shadow-md p-3 border border-slate-100 space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-100 border border-purple-300"></div>
                    <div className="h-2 w-16 bg-purple-200 rounded-full"></div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full"></div>
                  <div className="h-1.5 w-[85%] bg-purple-400 rounded-full"></div>
                  <div className="h-1.5 w-[70%] bg-slate-200 rounded-full"></div>
                  <div className="h-1.5 w-[90%] bg-slate-200 rounded-full"></div>
                </div>

                {/* Purple Pointer Line */}
                <div className="absolute left-[55%] top-[45%] w-12 h-px bg-purple-400 z-20"></div>

                {/* Floating Score Badge */}
                <div className="absolute right-2 bottom-2 w-[52%] bg-white rounded-xl shadow-xl border border-purple-100 p-2.5 z-20 flex flex-col items-center">
                  <div className="text-[8px] font-bold text-gray-600 mb-1 w-full text-left">CV score: 9</div>
                  <div className="flex gap-1 mb-2 w-full">
                    <span className="text-[6px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">ReactJS ✓</span>
                    <span className="text-[6px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">NodeJS ✓</span>
                  </div>
                  {/* Gauge Arc Meter */}
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-purple-600" strokeWidth="4" strokeDasharray="92, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span className="absolute text-xs font-black text-purple-700">92</span>
                  </div>
                </div>
              </div>
            </div>


            {/* CARD 2: Hệ Thống Phỏng Vấn AI Tổng Thể (Col 2 & 3 - CENTER CARD) */}
            <div className="bento-card-anim col-span-1 md:col-span-2 relative min-h-[350px] flex flex-col z-20 group">
              
              {/* Continuous Gradient Border Frame with Custom Bottom Latch Notch */}
              <div className="absolute inset-0 rounded-[2.3rem] bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 p-[3px] shadow-[0_10px_35px_rgba(99,102,241,0.25)]">
                <div className="absolute inset-[3px] bg-white rounded-[calc(2.3rem-3px)]"></div>
              </div>

              {/* Connector Arrow to Card 3 */}
              <div className="hidden lg:flex absolute -right-7 top-1/2 -translate-y-1/2 z-30 items-center text-blue-400 pointer-events-none">
                <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                  <path d="M2 10H28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M24 4L32 10L24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Inner Content */}
              <div className="relative p-7 md:p-8 flex flex-col justify-between h-full z-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                    Hệ Thống Phỏng Vấn<br />AI Tổng Thể
                  </h3>
                  <p className="text-xs text-gray-500 max-w-[65%] leading-relaxed">
                    Micro-animation of hệ thống nơ ron số thế nền phỏng vấn neural net.
                  </p>
                </div>

                {/* Neural Network SVG Diagram */}
                <div className="my-4 relative w-full h-[150px] flex items-center justify-center">
                  <svg className="w-full h-full max-w-[480px]" viewBox="0 0 450 140" fill="none">
                    <defs>
                      <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="50%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>

                    {/* Connecting Lines */}
                    {[20, 45, 70, 95, 120].map((y, i) => (
                      <g key={i}>
                        <path d={`M 50 ${y} C 120 ${y}, 140 70, 200 70`} stroke="url(#neuralGrad)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />
                        <path d={`M 200 70 C 260 70, 280 ${30 + i * 20}, 350 ${30 + i * 20}`} stroke="url(#neuralGrad)" strokeWidth="1.5" opacity="0.8" />
                        <path d={`M 350 ${30 + i * 20} C 390 ${30 + i * 20}, 410 70, 430 70`} stroke="url(#neuralGrad)" strokeWidth="1" opacity="0.5" />
                      </g>
                    ))}

                    {/* Left Nodes */}
                    {[20, 45, 70, 95, 120].map((y, i) => (
                      <circle key={`l-${i}`} cx="50" cy={y} r="4" fill="#A855F7" />
                    ))}

                    {/* Big Center Node */}
                    <circle cx="200" cy="70" r="11" fill="#6366F1" className="shadow-lg" />
                    <circle cx="200" cy="70" r="18" fill="#6366F1" opacity="0.2" className="animate-ping" />

                    {/* Right Layer Nodes */}
                    {[30, 50, 70, 90, 110].map((y, i) => (
                      <circle key={`r-${i}`} cx="350" cy={y} r="5" fill="#3B82F6" />
                    ))}

                    {/* Output Node */}
                    <circle cx="430" cy="70" r="4" fill="#3B82F6" />
                  </svg>
                </div>

                {/* Bottom Row inside Card 2 */}
                <div className="flex items-end justify-between mt-auto">
                  {/* Floating AI Logo */}
                  <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-2xl tracking-tighter border border-purple-300/40">
                    Ai
                  </div>

                  {/* Star Mascot standing naturally at bottom right */}
                  <div className="relative -mb-4 -mr-2 z-30">
                    <img
                      src="/images/mascot.png"
                      alt="Purple Mascot"
                      className="w-28 h-28 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* CARD 3: Hội Thoại Mô Phỏng (Col 4) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[340px] group hover:shadow-lg transition-all duration-300">
              
              <h3 className="text-xl font-bold text-gray-900 leading-snug mb-3">
                Hội Thoại Mô Phỏng
              </h3>

              {/* Mac Window Mockup */}
              <div className="flex-1 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between relative overflow-hidden shadow-inner">
                
                {/* Mac Top Bar */}
                <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-200/60 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                  <span className="text-[9px] text-gray-400 font-medium ml-auto">Phỏng vấn vdeo - Phỏng vấn</span>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded ml-2">Bước 2/5</span>
                </div>

                {/* AI Question Banner */}
                <div className="bg-purple-100/70 border border-purple-200/80 rounded-xl p-2.5 text-[9.5px] text-purple-950 font-medium leading-tight mb-2.5">
                  <span className="font-bold text-purple-700">AI:</span> Dựa trên CV có thể nhận thấy dự án pet-app của bạn rất đặc sắc. Mức độ khó khăn ở đâu?
                </div>

                {/* 2 Video Frames */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Left: Interviewer */}
                  <div className="relative aspect-video bg-slate-200 rounded-xl overflow-hidden border border-slate-300/60 shadow-sm">
                    <img src="/images/interviewer.png" alt="Interviewer" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[7px] text-white bg-black/60 px-1 py-0.5 rounded backdrop-blur-sm">Interviewer</span>
                  </div>
                  {/* Right: Candidate Camera Loading */}
                  <div className="aspect-video bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                    <span className="text-[7px] text-slate-400 font-medium">Đang kết nối camera...</span>
                  </div>
                </div>

                {/* Bottom Action Button - Bright Neon Lime Green */}
                <div className="mt-auto flex items-center justify-between bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs">
                    🎤
                  </div>
                  <button className="bg-[#A3E635] hover:bg-[#86EFAC] text-[#1E3A8A] font-bold text-[10px] py-1.5 px-4 rounded-full transition-colors shadow-sm">
                    Cụ thể đáp →
                  </button>
                </div>
              </div>

              {/* Mascot Standing on Bottom Right of Card 3 */}
              <div className="absolute -right-3 -bottom-3 w-16 h-16 z-30 pointer-events-none">
                <img src="/images/mascot.png" alt="Mascot" className="w-full h-full object-contain drop-shadow-md" />
              </div>
            </div>


            {/* ================= ROW 2 ================= */}

            {/* CARD 4: Hồ Sơ & CV Khớp Lệnh (Col 1 & 2) */}
            <div className="bento-card-anim col-span-1 md:col-span-2 bg-white rounded-[2.2rem] p-6 lg:p-7 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-6 relative min-h-[320px] group hover:shadow-lg transition-all duration-300">
              
              {/* Connector Arrow to Card 5 */}
              <div className="hidden lg:flex absolute -right-7 top-1/2 -translate-y-1/2 z-30 items-center text-indigo-400 pointer-events-none">
                <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                  <path d="M2 10H28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M24 4L32 10L24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Left Tilted Purple CV Graphic */}
              <div className="w-full md:w-[42%] bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] rounded-2xl p-4 text-white shadow-xl transform -rotate-3 border border-purple-400/40 shrink-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/20 mb-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 overflow-hidden flex items-center justify-center font-bold text-xs">
                      CV
                    </div>
                    <div>
                      <div className="text-xs font-bold">CV OV</div>
                      <div className="text-[8px] text-purple-200">Fullstack Engineer</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-white/25 rounded-full"></div>
                    <div className="h-1.5 w-[80%] bg-white/25 rounded-full"></div>
                    <div className="h-1.5 w-[90%] bg-purple-300/60 rounded-full"></div>
                    <div className="h-1.5 w-[60%] bg-white/25 rounded-full"></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/20 mt-4 flex items-center justify-between text-[8px] text-purple-200">
                  <span>Match Rate</span>
                  <span className="font-bold text-white bg-purple-500/50 px-1.5 py-0.5 rounded">95%</span>
                </div>
              </div>

              {/* Right Info & Skill Gap Chart */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-1">
                    Hồ Sơ & CV Khớp Lệnh
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                    Animated CV với tracking key skills của màn thoại dữ liệu phòng.
                  </p>

                  <h4 className="text-xs font-bold text-gray-800 mb-2">Animated Key Kịch</h4>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['ReactJS', 'NodeJS', 'Python', 'Python', 'AWS', 'Docker', 'GraphQL'].map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 shadow-2xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skill-Gap Analysis Curve */}
                <div>
                  <h4 className="text-xs font-bold text-gray-800 mb-1.5">Skill-gap analysis</h4>
                  <div className="h-[75px] w-full bg-slate-50/80 rounded-xl border border-slate-200/80 p-2 relative overflow-hidden flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="purpleWave" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="greenWave" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 50 L0 35 Q 30 10, 60 40 T 120 20 T 180 35 L200 25 L200 50 Z" fill="url(#purpleWave)" />
                      <path d="M0 35 Q 30 10, 60 40 T 120 20 T 180 35 L200 25" stroke="#A855F7" strokeWidth="2" fill="none" />
                      
                      <path d="M0 50 L0 45 Q 40 30, 80 15 T 140 35 T 200 15 L200 50 Z" fill="url(#greenWave)" />
                      <path d="M0 45 Q 40 30, 80 15 T 140 35 T 200 15" stroke="#10B981" strokeWidth="2" fill="none" />
                    </svg>

                    <div className="absolute top-1.5 right-2 bg-white/90 backdrop-blur-sm text-[7px] p-1.5 rounded-md border border-slate-200 shadow-sm space-y-0.5">
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span><span className="font-bold">CV match 4/5</span></div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="font-bold">Python: 5.0</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* CARD 5: Đề Xuất Phù Hợp (Col 3) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[320px] group hover:shadow-lg transition-all duration-300">
              
              {/* Connector Arrow to Card 6 */}
              <div className="hidden lg:flex absolute -right-7 top-1/2 -translate-y-1/2 z-30 items-center text-indigo-400 pointer-events-none">
                <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                  <path d="M2 10H28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M24 4L32 10L24 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Đề Xuất Phù Hợp
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                  Miniature mentors in carton style for đánh nhanh trạc.
                </p>
              </div>

              {/* 3 Mentor Columns */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Lê Minh Anh', role: 'swe/vng', img: '/images/mentor1.png', rating: '5.0' },
                  { name: 'Đào Duy A.', role: 'Ai Eng', img: '/images/mentor2.png', rating: '5.0' },
                  { name: 'Bình M.', role: 'Tech Lead', img: '/images/mentor3.png', rating: '4.9' },
                ].map((mentor, idx) => (
                  <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2 flex flex-col items-center relative text-center shadow-2xs hover:bg-white hover:border-purple-200 transition-colors">
                    {/* Badge */}
                    <span className="absolute -top-2 bg-emerald-500 text-white font-extrabold text-[6px] px-1 py-0.5 rounded shadow-2xs">
                      + Đề xuất
                    </span>
                    <img src={mentor.img} alt={mentor.name} className="w-9 h-9 rounded-full object-cover border border-white shadow-sm mt-1.5 mb-1" />
                    <div className="text-[8px] font-bold text-gray-900 truncate w-full">{mentor.name}</div>
                    <div className="text-[7px] text-gray-400 truncate w-full mb-1">{mentor.role}</div>
                    <div className="text-[7px] text-amber-500 font-bold mb-2">★ {mentor.rating}</div>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[7px] font-bold py-1 rounded transition-colors shadow-2xs mt-auto">
                      Đặt lịch →
                    </button>
                  </div>
                ))}
              </div>
            </div>


            {/* CARD 6: Lộ Trình Học Tập (Col 4) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[320px] group hover:shadow-lg transition-all duration-300">
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Lộ Trình Học Tập
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                  Recommend ngắn hạn (từ dựa của 1 section).
                </p>
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-6 space-y-3 my-auto border-l-2 border-purple-200 ml-3">
                {[
                  { time: 'Tháng 1/2024', title: 'Trang bị core skills', sub: 'Lộ trình ngắn hạn', active: true },
                  { time: 'Tháng 3/2024', title: 'Khóa học năm AI', sub: 'Lộ trình học ngắn', active: false },
                  { time: 'Tháng 6/2024', title: 'Từ kịch bản Mentor', sub: 'Lộ trình trung hạn', active: false },
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Bullet */}
                    <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${item.active ? 'border-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.4)]' : 'border-slate-300'}`}></div>
                    
                    <div className={`p-2.5 rounded-xl border transition-all ${item.active ? 'bg-purple-50/70 border-purple-300 text-purple-950' : 'bg-slate-50/50 border-slate-200 text-slate-700'}`}>
                      <div className="text-[7px] text-purple-600 font-bold uppercase tracking-wider">{item.time}</div>
                      <div className="text-[10px] font-bold">{item.title}</div>
                      <div className="text-[8px] text-gray-400">{item.sub}</div>
                    </div>
                  </div>
                ))}

                <div className="text-[8px] font-bold text-purple-700 italic pt-1">
                  → Tự tin trở thành Mentor
                </div>
              </div>
            </div>


            {/* ================= ROW 3 ================= */}

            {/* CARD 7: Mạng Lưới Mentor (Col 1) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[200px] group hover:shadow-lg transition-all duration-300">
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Mạng Lưới Mentor
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                  Khóa giá trị tạo tệp; về trình Mentor
                </p>
              </div>

              {/* Slider with Arrows */}
              <div className="flex items-center gap-1.5 my-auto">
                <button className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0 text-xs">
                  ‹
                </button>

                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  {[
                    { name: 'Nguyễn Thương', role: 'Pro Leader', img: '/images/mentor1.png' },
                    { name: 'Lê Minh Huấn', role: 'Pro Mentor', img: '/images/mentor2.png' },
                    { name: 'Nguyễn Thị Hồng', role: 'Sr. Lead', img: '/images/mentor3.png' },
                  ].map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 text-center flex flex-col items-center relative">
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <img src={m.img} alt={m.name} className="w-7 h-7 rounded-full object-cover mb-1 border border-white" />
                      <div className="text-[7px] font-bold text-gray-900 truncate w-full">{m.name}</div>
                      <div className="text-[6px] text-amber-500 font-bold">★ 5/5</div>
                      <div className="text-[5px] text-gray-400">Chuyên Môn 5/5</div>
                    </div>
                  ))}
                </div>

                <button className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0 text-xs">
                  ›
                </button>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-1 mt-2">
                <span className="w-2 h-1 bg-purple-600 rounded-full"></span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              </div>
            </div>


            {/* CARD 8: Kênh Phản Hồi (Col 2) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[200px] group hover:shadow-lg transition-all duration-300">
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Kênh Phản Hồi
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                  Key với tiên mặt sử dụng cao dụng.
                </p>
              </div>

              {/* 2 Speech Bubbles with Speech Bubble Tails */}
              <div className="space-y-2.5 my-auto">
                <div className="relative bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl rounded-bl-none text-[9px] text-slate-700 leading-relaxed shadow-2xs">
                  "Đội ngũ nhân viên rất friendly, nền tảng phân tích cực kỳ đúng nhu cầu của tôi."
                </div>
                <div className="relative bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl rounded-bl-none text-[9px] text-slate-700 leading-relaxed shadow-2xs ml-3">
                  "Khả năng tạo cv của mình được làm mượt mà, cảm giác AI làm việc rất chỉnh chu."
                </div>
              </div>
            </div>


            {/* CARD 9: Cộng Đồng (Col 3) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[200px] group hover:shadow-lg transition-all duration-300">
              
              {/* Blue Arrow pointing INTO Card 9 from left boundary */}
              <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-indigo-600 z-30"></div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Cộng Đồng
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                  Dynamic counter của từ dựng.
                </p>
              </div>

              {/* Gradient Purple Container with Counter 93 */}
              <div className="flex-1 bg-gradient-to-br from-[#6366F1] via-[#4F46E5] to-[#4338CA] rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-md">
                
                {/* 2-User Icon + 93 Number */}
                <div className="flex items-center gap-2 z-10">
                  <svg className="w-6 h-6 text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span className="text-4xl font-black text-white tracking-tighter">93</span>
                </div>

                {/* Animated Soundwave */}
                <div className="absolute bottom-2 inset-x-4 flex items-end justify-center gap-1 opacity-60">
                  {[6, 12, 18, 24, 16, 28, 14, 20, 10, 16, 8].map((h, i) => (
                    <div key={i} className="w-1 bg-white rounded-full animate-pulse" style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}></div>
                  ))}
                </div>
              </div>
            </div>


            {/* CARD 10: Xử Lý Dữ Liệu (Col 4) */}
            <div className="bento-card-anim col-span-1 bg-white rounded-[2.2rem] p-5 border border-blue-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative min-h-[200px] group hover:shadow-lg transition-all duration-300">
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Xử Lý Dữ Liệu
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                  Xử lý dữ liệu through platform.
                </p>
              </div>

              {/* 4 Quadrants Grid */}
              <div className="grid grid-cols-2 gap-2 my-auto">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-center">
                  <div className="text-base font-black text-gray-900">170+</div>
                  <div className="text-[7px] text-gray-400 uppercase font-bold">CV scores</div>
                </div>

                {/* Speedometer Gauge Box */}
                <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/70 flex flex-col items-center justify-center relative">
                  <svg className="w-12 h-8" viewBox="0 0 100 60">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 70 20" fill="none" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" />
                    <line x1="50" y1="50" x2="68" y2="24" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="5" fill="#1E40AF" />
                  </svg>
                  <div className="text-xs font-black text-gray-900 mt-0.5">5</div>
                  <div className="text-[6px] text-gray-400 uppercase font-bold">throughput nhật</div>
                </div>

                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-center">
                  <div className="text-base font-black text-gray-900">655</div>
                  <div className="text-[7px] text-gray-400 uppercase font-bold">throughput nhất</div>
                </div>

                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-center">
                  <div className="text-base font-black text-gray-900">265+</div>
                  <div className="text-[7px] text-gray-400 uppercase font-bold">throughput thật</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default FeaturesBento;

