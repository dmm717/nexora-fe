'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Check, AlertCircle } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function CvAnalysisHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Animate Left Text
    tl.fromTo(
      textRef.current?.children ? Array.from(textRef.current.children) : [],
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );

    // Animate Right Bento Cards
    tl.fromTo(
      gridRef.current?.children ? Array.from(gridRef.current.children) : [],
      { scale: 0.9, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.2)' },
      '-=0.6'
    );

  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      className="relative w-full min-h-[calc(100vh-80px)] flex items-center bg-[#FAFAFA] pt-20 pb-20 px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-300/40 via-violet-200/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/30 via-transparent to-transparent rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 relative z-10 items-center">
        
        {/* Left Column: Text (6 cols) */}
        <div ref={textRef} className="lg:col-span-6 flex flex-col items-start relative z-20 pr-0 lg:pr-10">
          <h1 
            className="w-full font-black text-slate-900 tracking-[-0.03em] mb-6 leading-[1.1] text-4xl md:text-5xl lg:text-[3.5rem]"
          >
            Hồ sơ của bạn đã sẵn sàng <br className="hidden lg:block" />
            <span className="text-purple-600">chinh phục nhà tuyển dụng?</span>
          </h1>
          
          <p className="text-slate-600 text-[1.125rem] font-medium mb-10 leading-relaxed max-w-[450px] text-balance">
            Nexora ứng dụng AI để "soi" CV của bạn dưới góc nhìn chuyên gia. Đối chiếu JD, phát hiện điểm mù và tối ưu hóa từ khóa để nắm chắc cơ hội phỏng vấn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/cv-analysis/optimize"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-[#CEFA61] text-white rounded-2xl font-bold text-[15px] shadow-[0_8px_20px_-8px_rgba(206,250,97,0.5)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#c2ef53] whitespace-nowrap"
            >
              Tối ưu CV theo vị trí
            </Link>
            <Link 
              href="/cv-analysis/industry"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-purple-600 border border-purple-200 rounded-2xl font-bold text-[15px] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-purple-50 hover:text-purple-700 whitespace-nowrap"
            >
              Phân tích theo ngành
            </Link>
          </div>
        </div>

        {/* Right Column: Bento Grid (6 cols) */}
        <div ref={gridRef} className="lg:col-span-6 grid grid-cols-2 gap-5 relative z-20">
          
          {/* Card 1: Match Score (Full width) */}
          <div className="col-span-2 bg-gradient-to-r from-purple-400 to-violet-400 rounded-3xl p-6 text-white shadow-lg shadow-purple-500/10 transition-transform duration-500 hover:scale-[1.01]">
            <h3 className="text-sm font-bold text-white/90 mb-1">Mức độ phù hợp CV (Frontend Developer)</h3>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-5xl font-black leading-none tracking-tight">85%</span>
              <span className="text-sm font-medium text-white/80 pb-1">keyword match</span>
              {/* Progress Line */}
              <div className="flex-1 flex gap-1.5 ml-2 pb-1.5">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-1.5 flex-1 bg-white rounded-full shadow-sm" />)}
                {[1].map(i => <div key={i} className="h-1.5 flex-1 bg-white/30 rounded-full" />)}
              </div>
            </div>
            <p className="text-sm font-medium text-white/90">
              Rất tốt! Bổ sung thêm một vài kỹ năng chuyên sâu để đạt điểm tối đa.
            </p>
          </div>

          {/* Card 2: Matched Keywords */}
          <div className="col-span-1 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-transform duration-500 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              </div>
              <span className="font-bold text-[15px] text-slate-800">Từ khóa khớp</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'React', 'Tailwind', 'GSAP'].map(tech => (
                <span key={tech} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                  {tech} <Check className="w-3 h-3" />
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: Missing Keywords */}
          <div className="col-span-1 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-transform duration-500 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-orange-600 stroke-[2.5]" />
              </div>
              <span className="font-bold text-[15px] text-slate-800">Cần bổ sung</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Redux', 'GraphQL', 'Jest'].map(tech => (
                <span key={tech} className="px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: Detailed AI Scores (Full width) */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-transform duration-500 hover:scale-[1.01]">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              
              {/* Circular Score */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-28 h-28 mb-3">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke="#F1F5F9" strokeWidth="6" fill="none" />
                    <circle 
                      cx="50" cy="50" r="44" 
                      stroke="#8B5CF6" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeLinecap="round"
                      strokeDasharray="276.46"
                      strokeDashoffset={276.46 * (1 - 0.73)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">73</span>
                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-sm mb-1">Điểm AI</span>
                <span className="text-[10px] text-slate-500 font-medium">Clarity · Structure</span>
                <span className="text-[10px] text-slate-500 font-medium">Relevance · Credibility</span>
              </div>

              {/* Progress Bars */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                
                {/* Score Item */}
                {[
                  { name: 'Clarity (Rõ ràng)', score: '8/10', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', fill: '80%', desc: 'Rõ ràng, súc tích.' },
                  { name: 'Structure (STAR)', score: '7/10', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', fill: '70%', desc: 'Cấu trúc ổn, thiếu số liệu.' },
                  { name: 'Relevance (Liên quan JD)', score: '6.5/10', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', fill: '65%', desc: 'Khớp một phần JD.' },
                  { name: 'Credibility (Thuyết phục)', score: '7.5/10', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', fill: '75%', desc: 'Cần thêm KPI cụ thể.' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.bg} ${item.text}`}>{item.score}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full mb-1 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: item.fill }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                  </div>
                ))}

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
