'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.fromTo('.hero-text-anim',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out' }
      )
        .fromTo('.hero-card-1',
          { y: -50, opacity: 0, rotationX: 8, rotationY: -15, rotationZ: 0 },
          { y: 0, opacity: 1, rotationX: 8, rotationY: -15, rotationZ: 4, duration: 1.2, ease: 'back.out(1.2)' },
          '-=0.8'
        )
        .fromTo('.hero-card-2',
          { y: -50, opacity: 0, rotationX: 8, rotationY: -15, rotationZ: 0 },
          { y: 0, opacity: 1, rotationX: 8, rotationY: -15, rotationZ: 4, duration: 1.2, ease: 'back.out(1.2)' },
          '-=1.0'
        )
        .fromTo('.hero-card-3',
          { y: -50, opacity: 0, rotationX: 8, rotationY: -15, rotationZ: 0 },
          { y: 0, opacity: 1, rotationX: 8, rotationY: -15, rotationZ: 4, duration: 1.2, ease: 'back.out(1.2)' },
          '-=1.0'
        )
        .fromTo('.hero-mascot',
          { scale: 0, opacity: 0, rotation: -20 },
          { scale: 1, opacity: 1, rotation: 0, duration: 1, ease: 'elastic.out(1, 0.5)' },
          '-=0.8'
        )
        .fromTo('.hero-pill',
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, stagger: 0.2, ease: 'back.out(1.5)' },
          '-=0.5'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full min-h-[100dvh] pt-24 lg:pt-32 pb-20 overflow-hidden bg-[#FAFAFC] flex items-center [@media(max-height:800px)]:items-start [@media(max-height:800px)]:pt-32">
      {/* Soft Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-purple-200/40 via-pink-100/20 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center [@media(max-height:800px)]:items-start">

        {/* LEFT COLUMN: TEXT */}
        <div className="flex flex-col z-10 max-w-2xl mt-[-100px] [@media(max-height:800px)]:mt-0">
          <h1 className="hero-text-anim text-[4rem] md:text-[5rem] lg:text-[6.5rem] xl:text-7xl leading-[1.05] tracking-tight text-[#1C1C28] mb-8 font-[family-name:var(--font-playfair)] font-semibold">
            Luyện Phỏng Vấn AI.<br />
            Đạt Công Việc<br />
            Mơ Ước.
          </h1>

          <p className="hero-text-anim text-lg md:text-xl text-gray-600 mb-10 leading-[1.6] max-w-xl font-medium">
            AI thế hệ mới của Nexora mô phỏng phỏng vấn 1:1 hành vi & kỹ thuật với độ chính xác đáng kinh ngạc. Hoàn thiện câu trả lời, tối ưu CV, và nhận phản hồi chi tiết cấp độ chuyên gia trên một nền tảng duy nhất. Chuẩn bị thông minh hơn.
          </p>

          <div className="hero-text-anim flex flex-col sm:flex-row items-center gap-8">
            <Link href="/auth?mode=register" className="px-8 py-4 bg-[#CEFA61] hover:bg-[#c2ef53] text-[#1C1C28] text-lg font-bold rounded-full transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(206,250,97,0.8)] hover:shadow-[0_15px_40px_-10px_rgba(206,250,97,0.9)] hover:-translate-y-1">
              Bắt Đầu Phỏng Vấn (Miễn Phí)
            </Link>
            <Link href="/cv-analysis" className="text-lg font-bold text-[#1C1C28] hover:text-purple-600 transition-colors">
              Phân Tích CV
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D UI COMPOSITION */}
        <div className="relative w-full h-[55vh] min-h-[400px] lg:h-[calc(100vh-160px)] lg:max-h-[850px] mt-10 lg:mt-0 [perspective:3000px] flex items-center justify-center overflow-visible">

          <style>{`
            .hero-3d-wrapper { transform: scale(0.7); }
            @media (min-width: 640px) { .hero-3d-wrapper { transform: scale(0.8); } }
            @media (min-width: 1024px) { .hero-3d-wrapper { transform: scale(1.0); } }
            @media (min-width: 1280px) { .hero-3d-wrapper { transform: scale(1.15); } }
            
            /* Height constraints MUST override width constraints on "wide but short" screens */
            @media (max-height: 900px) { .hero-3d-wrapper { transform: scale(0.9) translateY(30px) !important; } }
            @media (max-height: 800px) { .hero-3d-wrapper { transform: scale(0.8) translateY(50px) !important; } }
            @media (max-height: 700px) { .hero-3d-wrapper { transform: scale(0.7) translateY(70px) !important; } }
            @media (max-height: 600px) { .hero-3d-wrapper { transform: scale(0.6) translateY(90px) !important; } }
            @media (max-height: 500px) { .hero-3d-wrapper { transform: scale(0.5) translateY(110px) !important; } }
            @media (max-height: 450px) { .hero-3d-wrapper { transform: scale(0.45) translateY(130px) !important; } }
          `}</style>

          {/* SCALING WRAPPER FOR RESPONSIVENESS (EXPLICIT CSS OVERRIDES) */}
          <div className="hero-3d-wrapper origin-center flex items-center justify-center w-full h-full">

            {/* BASE 3D CANVAS */}
            <div className="relative w-[500px] h-[700px] right-0 xl:right-[-50px]">

              {/* TOP CARD: Video Call Simulation */}
              <div className="hero-card-1 absolute top-[-100px] left-[-220px] w-[500px] bg-white rounded-2xl p-4 shadow-[20px_20px_30px_-5px_rgba(0,0,0,0.2),40px_50px_70px_-10px_rgba(0,0,0,0.35)] border-[1px] border-[#9333ea]/30 z-30" style={{ transformStyle: 'preserve-3d' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                    <span className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-[10px]">🎙️</span> AI Interview - Phỏng Vấn AI
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Kết thúc</div>
                </div>

                {/* Body */}
                <div className="grid grid-cols-[1fr_1.2fr] gap-4">
                  {/* Left: Video */}
                  <div className="relative h-[240px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src="/images/video_lady_avatar.png" alt="AI Interviewer" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-white font-medium flex items-center gap-2">
                      Hoàng Yến - HR Tech <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    </div>
                  </div>

                  {/* Right: Chat */}
                  <div className="flex flex-col relative h-full justify-between">
                    <div>
                      <div className="px-4 py-3 bg-purple-50 rounded-xl rounded-tl-sm text-[11px] text-gray-800 leading-relaxed border border-purple-100">
                        <div className="flex items-center gap-2 font-bold text-purple-700 mb-2">
                          <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-[10px]">N</span>
                          AI response:
                        </div>
                        Nexora\'s next-generation AI simulates the 1:1 behavioral & technical interviews with incredible accuracy. Refine your answers, optimize your CV, all in a single platform...
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <button className="w-full py-2.5 bg-purple-600 text-white rounded-full text-xs font-bold shadow-md hover:bg-purple-700">
                        Ghi âm câu trả lời...
                      </button>
                      <div className="relative">
                        <input type="text" placeholder="Enter your message..." className="w-full text-xs pl-4 pr-8 py-2.5 rounded-full border border-gray-300 bg-white" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                          ↑
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-2 text-gray-400">
                          <span className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-[10px]">⚙️</span>
                          <span className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-[10px]">👥</span>
                        </div>
                        <button className="px-3 py-1 bg-[#CEFA61] text-[#1C1C28] text-[10px] font-bold rounded-full">
                          Cập nhật &gt;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Pills */}
                <div className="hero-pill absolute -left-12 top-[60%] px-4 py-2 bg-white rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] flex items-center gap-2 text-[11px] font-bold text-gray-800 z-20 border border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Live 1:1 Simulation
                </div>
                <div className="hero-pill absolute -right-8 -top-4 px-4 py-2 bg-white rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] flex items-center gap-2 text-[11px] font-bold text-gray-800 z-20 border border-gray-100">
                  STAR Method Validation
                </div>
              </div>

              {/* MIDDLE CARD: CV Analysis (Vertical layout) */}
              <div className="hero-card-2 absolute top-[80px] left-[220px] w-[420px] h-[580px] bg-white rounded-2xl shadow-[20px_20px_30px_-5px_rgba(0,0,0,0.2),40px_50px_70px_-10px_rgba(0,0,0,0.35)] border-[1px] border-[#9333ea]/30 z-10 flex" style={{ transformStyle: 'preserve-3d' }}>
                {/* Left Dark Sidebar */}
                <div className="w-[35%] bg-[#2d3748] p-4 text-white flex flex-col relative z-0 rounded-l-2xl overflow-hidden">
                  <div className="w-14 h-14 rounded-full bg-gray-500 overflow-hidden mx-auto mb-3 border-2 border-[#4a5568]">
                    <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-[7px] text-gray-300 mb-4 font-medium">
                    <div className="flex gap-2 items-center"><span className="w-3 h-3 rounded-full border border-gray-500 flex items-center justify-center text-[5px]">👤</span> 1997</div>
                    <div className="flex gap-2 items-center"><span className="w-3 h-3 rounded-full border border-gray-500 flex items-center justify-center text-[5px]">✉️</span> abc@gmail.com</div>
                    <div className="flex gap-2 items-center"><span className="w-3 h-3 rounded-full border border-gray-500 flex items-center justify-center text-[5px]">📱</span> 0987 654 321</div>
                    <div className="flex gap-2 items-center"><span className="w-3 h-3 rounded-full border border-gray-500 flex items-center justify-center text-[5px]">🔗</span> linkedin.com/in/abc</div>
                  </div>

                  {/* Objective */}
                  <h3 className="text-[9px] font-bold text-white mb-2 tracking-wide">Objective</h3>
                  <div className="space-y-1.5 text-[7px] text-gray-300 mb-4 font-medium">
                    <div className="flex gap-2 items-center"><span className="w-2 h-2 border border-gray-500 rounded-sm"></span> Frontend Dev</div>
                    <div className="flex gap-2 items-center"><span className="w-2 h-2 border border-gray-500 rounded-sm"></span> 5 yrs exp</div>
                  </div>

                  {/* Skills */}
                  <h3 className="text-[9px] font-bold text-white mb-2 tracking-wide">Skills</h3>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="text-[6.5px] bg-[#84CC16] text-[#14532d] px-1.5 py-0.5 rounded font-bold">ANGULAR</span>
                    <span className="text-[6.5px] bg-[#84CC16] text-[#14532d] px-1.5 py-0.5 rounded font-bold">REACT</span>
                    <span className="text-[6.5px] border border-[#84CC16] text-[#a3e635] px-1.5 py-0.5 rounded font-medium">TYPESCRIPT</span>
                    <span className="text-[6.5px] bg-[#84CC16] text-[#14532d] px-1.5 py-0.5 rounded font-bold">VUE</span>
                    <span className="text-[6.5px] border border-gray-500 text-gray-300 px-1.5 py-0.5 rounded font-medium">DOCKER</span>
                    <span className="text-[6.5px] border border-[#84CC16] text-[#a3e635] px-1.5 py-0.5 rounded font-medium">NODEJS</span>
                    <span className="text-[6.5px] border border-[#84CC16] text-[#a3e635] px-1.5 py-0.5 rounded font-medium">GRAPHQL</span>
                    <span className="text-[6.5px] bg-[#84CC16] text-[#14532d] px-1.5 py-0.5 rounded font-bold">TAILWIND</span>
                  </div>

                  {/* Passions */}
                  <h3 className="text-[9px] font-bold text-white mb-2 tracking-wide">Passions</h3>
                  <div className="space-y-2 mt-1">
                    <div>
                      <div className="text-[6.5px] text-gray-300 mb-1 font-medium">Teamwork</div>
                      <div className="h-0.5 w-full bg-[#4a5568] rounded-full"><div className="h-full w-[90%] bg-[#84CC16] rounded-full shadow-[0_0_3px_rgba(132,204,22,0.5)]"></div></div>
                    </div>
                    <div>
                      <div className="text-[6.5px] text-gray-300 mb-1 font-medium">UI/UX Design</div>
                      <div className="h-0.5 w-full bg-[#4a5568] rounded-full"><div className="h-full w-[80%] bg-[#84CC16] rounded-full shadow-[0_0_3px_rgba(132,204,22,0.5)]"></div></div>
                    </div>
                    <div>
                      <div className="text-[6.5px] text-gray-300 mb-1 font-medium">Open Source</div>
                      <div className="h-0.5 w-full bg-[#4a5568] rounded-full"><div className="h-full w-[85%] bg-[#84CC16] rounded-full shadow-[0_0_3px_rgba(132,204,22,0.5)]"></div></div>
                    </div>
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="w-[65%] p-4 bg-white relative z-0 flex flex-col rounded-r-2xl">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="pt-0.5">
                      <h2 className="text-base font-black text-gray-900 mb-0.5">Nguyễn Đại Càn</h2>
                      <p className="text-[9px] text-gray-500 font-medium mb-1">Senior Fullstack Engineer</p>
                      <div className="text-[7px] text-gray-400 flex items-center gap-1">
                        <span className="text-[#9333ea]">📍</span> Ho Chi Minh, Vietnam - 5 Yrs Exp
                      </div>
                    </div>

                    {/* AI Analysis Score */}
                    <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                      <span className="text-[6px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Ai Analysis</span>
                      <div className="relative w-10 h-10">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-[#84CC16]" strokeDasharray="87, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-900">87</div>
                      </div>
                      <div className="text-[5px] text-gray-400 mt-1 text-center leading-tight">
                        Technical Depth: <span className="text-[#65a30d] font-bold">9/10</span><br />
                        CV-JD Alignment: <span className="text-[#65a30d] font-bold">High</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-gray-100 mb-3"></div>

                  {/* Content Sections */}
                  <div className="flex-1 space-y-3">
                    {/* Summary Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 pb-0.5 border-b border-gray-50">
                        <div className="w-3.5 h-3.5 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-[7px]">👤</span>
                        </div>
                        <h3 className="text-[10px] font-black text-gray-800">Summary</h3>
                      </div>
                      <div className="pl-5 space-y-1">
                        <p className="text-[8px] text-gray-800 font-bold mb-0.5">Senior Fullstack - 5 years of Exp</p>
                        <ul className="text-[7.5px] text-gray-500 list-disc pl-3 space-y-0.5 leading-tight">
                          <li>Strong architecture skills in React ecosystem and NodeJS backend systems.</li>
                          <li>Good problem solving with CI/CD deployment on AWS and Google Cloud.</li>
                          <li>Love optimizing performance and leading junior developers to build scalable apps.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Experience Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 pb-0.5 border-b border-gray-50">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#ECFCCB] flex items-center justify-center border border-[#bef264]">
                          <span className="text-[7px] text-[#65a30d]">💼</span>
                        </div>
                        <h3 className="text-[10px] font-black text-[#65a30d]">Experience</h3>
                      </div>

                      <div className="pl-5 space-y-2.5">
                        {/* Job 1 */}
                        <div>
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="text-[8.5px] font-bold text-gray-800">Tech Lead - Top SEC</h4>
                            <span className="text-[6px] text-gray-400 font-medium bg-gray-50 px-1 py-0.5 rounded">01/2021 - Present</span>
                          </div>
                          <ul className="text-[7.5px] text-gray-500 list-disc pl-3 space-y-0.5 leading-tight">
                            <li>Quản lý nhóm 5 người, định hướng kiến trúc frontend, review code và release.</li>
                            <li>Tối ưu hiệu năng, giảm 40% thời gian load trang cho hệ thống nội bộ.</li>
                            <li>Xây dựng hệ thống UI Components dùng chung cho 3 dự án lớn trong công ty.</li>
                          </ul>
                        </div>

                        {/* Job 2 */}
                        <div>
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="text-[8.5px] font-bold text-gray-800">Senior Dev - XYZ Corp</h4>
                            <span className="text-[6px] text-gray-400 font-medium bg-gray-50 px-1 py-0.5 rounded">06/2018 - 12/2020</span>
                          </div>
                          <ul className="text-[7.5px] text-gray-500 list-disc pl-3 space-y-0.5 leading-tight">
                            <li>Phát triển Web App quản lý nhân sự với React và Redux, phục vụ 1000+ nv.</li>
                            <li>Viết unit test đạt độ phủ 80%, đảm bảo chất lượng code trước khi deploy.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Education Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 pb-0.5 border-b border-gray-50">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                          <span className="text-[7px] text-blue-500">🎓</span>
                        </div>
                        <h3 className="text-[10px] font-black text-blue-600">Education</h3>
                      </div>
                      <div className="pl-5">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="text-[8.5px] font-bold text-gray-800">B.S. in Computer Science</h4>
                          <span className="text-[6px] text-gray-400 font-medium bg-gray-50 px-1 py-0.5 rounded">2014 - 2018</span>
                        </div>
                        <p className="text-[7.5px] text-gray-500 leading-tight">HCMC University of Technology (HCMUT)</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Pills attached to right edge */}
                  <div className="absolute -right-[120px] top-[40%] flex flex-col gap-3 z-30">
                    <div className="hero-pill bg-white px-3 py-2 rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] border border-gray-100 text-[10px] font-bold text-gray-800 flex justify-between items-center w-[190px]">
                      Technical Depth: <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded ml-2">9/10</span>
                    </div>
                    <div className="hero-pill bg-white px-3 py-2 rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] border border-gray-100 text-[10px] font-bold text-gray-800 flex justify-between items-center w-[190px]">
                      CV-JD Alignment: <span className="bg-green-100 text-[#14532d] px-2 py-0.5 rounded ml-2">High</span>
                    </div>
                    <div className="hero-pill bg-white px-3 py-2 rounded-full shadow-[0_10px_20px_-5px_rgba(0,0,0,0.15)] border border-gray-100 text-[10px] font-bold text-gray-800 flex justify-between items-center w-[190px]">
                      CV-JD Alignment: <span className="bg-green-100 text-[#14532d] px-2 py-0.5 rounded ml-2">High</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM CARD: Dashboard Overview */}
              <div className="hero-card-3 absolute top-[380px] left-[-240px] w-[580px] bg-white rounded-2xl shadow-[20px_20px_30px_-5px_rgba(0,0,0,0.2),40px_50px_70px_-10px_rgba(0,0,0,0.35)] border-[1px] border-[#9333ea]/30 z-30 flex" style={{ transformStyle: 'preserve-3d' }}>

                {/* Left Sidebar Menu */}
                <div className="w-14 border-r border-gray-100 flex flex-col items-center py-4 gap-6 bg-[#f8f5fe] rounded-l-2xl">
                  <div className="w-8 h-8 bg-[#9333ea] text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">N</div>
                  <div className="flex flex-col gap-6 mt-4 text-[#9333ea]">
                    <svg className="w-5 h-5 cursor-pointer opacity-100" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    <svg className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>
                    <svg className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                    <svg className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="flex-1 p-5 pr-6">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 relative">
                    <div className="relative">
                      <svg className="w-4 h-4 absolute left-2 top-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[10px] outline-none w-32 focus:border-purple-300" />
                    </div>

                    <div className="font-black text-gray-900 text-[13px] absolute left-1/2 -translate-x-1/2">Dashboard Overview</div>

                    <div className="flex items-center gap-3">
                      <div className="relative cursor-pointer">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden border border-gray-200">
                        <img src="https://i.pravatar.cc/150?img=12" alt="User" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_200px] gap-6">
                    {/* Left Side: Chart */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
                        <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full"><span className="w-3 h-3 rounded-full bg-purple-600 text-white flex items-center justify-center text-[7px]">1</span> Simulation</div>
                        <div className="h-[1px] flex-1 bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-1 rounded-full"><span className="w-3 h-3 rounded-full bg-gray-300 text-white flex items-center justify-center text-[7px]">2</span> Feedback</div>
                        <div className="h-[1px] flex-1 bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-1 rounded-full"><span className="w-3 h-3 rounded-full bg-gray-300 text-white flex items-center justify-center text-[7px]">3</span> CV Update</div>
                      </div>
                      <div className="h-[120px] w-full relative mb-4">
                        {/* Simulated SVG Area Chart */}
                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#9333EA" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,80 C50,70 100,90 150,50 C200,10 250,80 300,40 C350,0 400,30 400,30 L400,100 L0,100 Z" fill="url(#chart-gradient)" />
                          <path d="M0,80 C50,70 100,90 150,50 C200,10 250,80 300,40 C350,0 400,30 400,30" fill="none" stroke="#9333EA" strokeWidth="3" />
                          <circle cx="200" cy="45" r="5" fill="#1C1C28" stroke="white" strokeWidth="2" />
                          <line x1="200" y1="45" x2="200" y2="100" stroke="#9333EA" strokeWidth="1" strokeDasharray="3 3" />
                        </svg>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-2.5 text-center">
                          <span className="block text-[9px] text-gray-500 font-bold mb-1">Clarity</span>
                          <span className="text-xl font-black text-gray-900">82%</span>
                        </div>
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-2.5 text-center">
                          <span className="block text-[9px] text-gray-500 font-bold mb-1">Structure</span>
                          <span className="text-xl font-black text-gray-900">75%</span>
                        </div>
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-2.5 text-center">
                          <span className="block text-[9px] text-gray-500 font-bold mb-1">Impact</span>
                          <span className="text-xl font-black text-gray-900">73%</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Insights */}
                    <div className="flex flex-col pl-4 h-full justify-between w-40">
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-900 mb-3">Key insights</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-600 mb-1"><span>Simulation</span> <span>9/10</span></div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full"><div className="h-full w-[90%] bg-purple-600 rounded-full"></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-600 mb-1"><span>Clarity</span> <span>8/10</span></div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full"><div className="h-full w-[80%] bg-purple-600 rounded-full"></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-600 mb-1"><span>Structure</span> <span>9/10</span></div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full"><div className="h-full w-[90%] bg-purple-600 rounded-full"></div></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-600 mb-1"><span>Impact</span> <span>8.5/10</span></div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full"><div className="h-full w-[85%] bg-purple-600 rounded-full"></div></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col items-center">
                        <span className="block text-[10px] text-gray-600 font-bold mb-1">Confidence Score</span>
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-green-500" strokeDasharray="87, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-gray-900">87</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* THE PURPLE STAR MASCOT */}
              <div className="hero-mascot absolute top-[580px] left-[-280px] z-40 w-44 h-44 flex items-center justify-center drop-shadow-[0_20px_20px_rgba(147,51,234,0.4)]">
                <svg viewBox="0 0 100 100" className="w-full h-full transform hover:scale-110 transition-transform cursor-pointer">
                  <defs>
                    <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="50%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#6B21A8" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
                    </filter>
                  </defs>

                  {/* Star Body */}
                  <path d="M50 15 L62 40 L88 40 L67 55 L75 80 L50 65 L25 80 L33 55 L12 40 L38 40 Z" fill="url(#star-grad)" filter="url(#shadow)" />

                  {/* 3D Highlight/Bevel Effect */}
                  <path d="M50 15 L62 40 L50 50 Z" fill="white" opacity="0.2" />
                  <path d="M12 40 L38 40 L50 50 Z" fill="white" opacity="0.3" />
                  <path d="M88 40 L62 40 L50 50 Z" fill="black" opacity="0.15" />

                  {/* Cute Big Eyes */}
                  <ellipse cx="42" cy="50" rx="4" ry="6" fill="#1C1C28" />
                  <ellipse cx="58" cy="50" rx="4" ry="6" fill="#1C1C28" />
                  <circle cx="43" cy="48" r="1.5" fill="white" />
                  <circle cx="59" cy="48" r="1.5" fill="white" />

                  {/* Nose/Beak */}
                  <path d="M48 55 L52 55 L50 58 Z" fill="#F59E0B" />

                  {/* Floating Hand Pointing */}
                  <g transform="translate(10, 60) rotate(-15)">
                    <path d="M0 5 Q10 0 15 5 L20 5 Q25 10 20 15 L10 15 Q5 10 0 5 Z" fill="url(#star-grad)" filter="url(#shadow)" />
                    <path d="M20 5 L25 5 Q28 8 25 11 L20 11" fill="url(#star-grad)" />
                  </g>
                </svg>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

