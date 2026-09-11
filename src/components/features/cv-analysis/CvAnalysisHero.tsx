'use client';

import React from 'react';
import Link from 'next/link';

export default function CvAnalysisHero() {
  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center py-12 md:py-20 px-6 overflow-hidden bg-gradient-to-br from-[#F5EFFF] to-[#E9E0F8] font-sans">
      
      <div className="max-w-[1300px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-14 items-center relative z-10">
        
        {/* Left Column: Content */}
        <div className="flex flex-col items-start text-left pt-10 lg:pt-0 relative">
          <h1 className="text-[40px] md:text-[48px] lg:text-[56px] font-black leading-[1.15] mb-4 tracking-[-0.02em]">
            <span className="text-[#5B21B6]">Làm sao để CV ấn tượng</span> <br />
            <span className="text-[#1F2937]">trong mắt nhà tuyển dụng?</span>
          </h1>
          
          <p className="text-[#6D28D9] text-[16px] md:text-[18px] font-bold mb-10 max-w-[480px] leading-relaxed">
            ProInterview giúp bạn kiểm tra, góp ý và cải thiện CV trước khi gửi đến nhà tuyển dụng.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-24 w-full sm:w-auto relative z-20">
            <Link 
              href="/cv-analysis/optimize"
              className="px-8 py-3.5 rounded-2xl bg-[#7C3AED] text-white font-bold hover:-translate-y-0.5 transition-all duration-200 text-center text-[15px] shadow-lg shadow-purple-500/20"
            >
              Tối ưu CV theo vị trí ứng tuyển
            </Link>
            <Link 
              href="/cv-analysis/industry"
              className="px-8 py-3.5 rounded-2xl bg-white text-[#7C3AED] font-bold hover:-translate-y-0.5 transition-all duration-200 text-center text-[15px] border border-purple-100 shadow-sm"
            >
              Phân tích CV theo ngành nghề
            </Link>
          </div>
        </div>

        {/* Right Column: Cards */}
        <div className="flex flex-col gap-4 relative z-20">
          
          {/* Card 1: Main Score */}
          <div className="bg-[#A78BFA] rounded-[24px] p-6 text-white shadow-sm relative overflow-hidden">
            <h3 className="text-[13px] font-bold text-white mb-2">Mức độ phù hợp CV</h3>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[48px] leading-none font-black tracking-tight">73%</span>
              <span className="text-[13px] font-medium text-white/90">keyword match</span>
              {/* Dashed line exactly like image */}
              <div className="flex-1 ml-2 flex items-center gap-1.5 opacity-90">
                <div className="h-1.5 w-6 bg-white rounded-full"></div>
                <div className="h-1.5 w-6 bg-white rounded-full"></div>
                <div className="h-1.5 w-6 bg-white rounded-full"></div>
                <div className="h-1.5 w-6 bg-white rounded-full"></div>
                <div className="h-1.5 w-6 bg-white/40 rounded-full"></div>
                <div className="h-1.5 w-6 bg-white/40 rounded-full"></div>
              </div>
            </div>
            <p className="text-[13px] text-white/90 font-medium">
              Khá tốt, bổ sung từ khóa còn thiếu có thể nâng điểm đáng kể.
            </p>
          </div>

          {/* Card 2 Row: Two separate cards side by side */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Left Card: Từ khóa khớp */}
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#22C55E]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="font-bold text-[14px] text-slate-800">Từ khóa khớp</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {['React', 'TypeScript', 'Node.js', 'REST API'].map(tech => (
                  <span key={tech} className="px-3.5 py-1.5 bg-[#F7FEE7] border border-[#D9F99D] text-[#4D7C0F] text-[12px] font-semibold rounded-full flex items-center gap-1.5">
                    {tech} 
                    <span className="text-[10px] text-[#4D7C0F]/80 leading-none">✓</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Right Card: Cần bổ sung */}
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center text-[#EA580C]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <span className="font-bold text-[14px] text-slate-800">Cần bổ sung</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {['AWS', 'Docker', 'Kubernetes'].map(tech => (
                  <span key={tech} className="px-3.5 py-1.5 bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] text-[12px] font-semibold rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Card 3: Detailed Scores */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50">
            <div className="flex flex-row gap-8 items-center">
              
              {/* Circular Score */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-[110px] h-[110px] mb-3">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-[36px] leading-none font-black text-[#111827] tracking-tight">73</span>
                    <span className="text-[12px] font-bold text-slate-500 mt-1">/ 100</span>
                  </div>
                </div>
                <span className="font-bold text-[#1F2937] text-[13px] mb-1">Điểm AI</span>
                <span className="text-[10px] text-slate-500 font-medium">Clarity · Structure</span>
                <span className="text-[10px] text-slate-500 font-medium">Relevance · Credibility</span>
              </div>

              {/* Progress Bars */}
              <div className="flex-1 w-full space-y-4">
                
                {/* Clarity */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-[#1F2937]">Clarity (Rõ ràng)</span>
                    <span className="text-[11px] font-bold text-[#4D7C0F] bg-[#ECFDF5] px-2 py-0.5 rounded">8/10</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full mb-1">
                    <div className="h-full bg-[#84CC16] rounded-full w-[80%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Rõ ràng, súc tích.</p>
                </div>

                {/* Structure */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-[#1F2937]">Structure (STAR)</span>
                    <span className="text-[11px] font-bold text-[#5B21B6] bg-[#F3E8FF] px-2 py-0.5 rounded">7/10</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full mb-1">
                    <div className="h-full bg-[#A855F7] rounded-full w-[70%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Cấu trúc ổn, vài bullet thiếu số liệu.</p>
                </div>

                {/* Relevance */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-[#1F2937]">Relevance (Liên quan JD)</span>
                    <span className="text-[11px] font-bold text-[#5B21B6] bg-[#F3E8FF] px-2 py-0.5 rounded">6.5/10</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full mb-1">
                    <div className="h-full bg-[#A855F7] rounded-full w-[65%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Khớp JD một phần, còn thiếu vài kỹ năng.</p>
                </div>

                {/* Credibility */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-[#1F2937]">Credibility (Thuyết phục)</span>
                    <span className="text-[11px] font-bold text-[#5B21B6] bg-[#F3E8FF] px-2 py-0.5 rounded">7.5/10</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full mb-1">
                    <div className="h-full bg-[#A855F7] rounded-full w-[75%]"></div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Cần thêm KPI và thành tựu cụ thể.</p>
                </div>

              </div>
              
            </div>
          </div>
          
        </div>

      </div>
    </section>
  );
}
