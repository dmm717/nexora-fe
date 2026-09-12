'use client';

import React, { useState, useEffect } from 'react';

export default function InterviewRoom() {
  const [isSpeaking, setIsSpeaking] = useState(true);

  // Toggle speaking state for animation demo
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Main Video Container (AI Interviewer) */}
      <div className="relative w-full max-w-6xl h-[75vh] mx-4 bg-[#0F172A] rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center justify-center group">
        
        {/* Subtle noise texture overlay for premium feel */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

        {/* AI Avatar Placeholder (Since no real video is provided, using a premium abstract avatar) */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)] mb-8 relative">
            <div className="w-[95%] h-[95%] rounded-full bg-[#0F172A] flex items-center justify-center">
              <span className="text-5xl">🤖</span>
            </div>
            {/* Glowing ring when speaking */}
            <div className={`absolute inset-0 rounded-full border-2 border-purple-400 transition-all duration-300 ${isSpeaking ? 'scale-110 opacity-50' : 'scale-100 opacity-0'}`}></div>
            <div className={`absolute inset-0 rounded-full border-2 border-indigo-400 transition-all duration-500 delay-75 ${isSpeaking ? 'scale-125 opacity-20' : 'scale-100 opacity-0'}`}></div>
          </div>
          
          <h2 className="text-2xl font-bold text-white tracking-wide">Nexora AI</h2>
          <p className="text-slate-400 text-sm mt-2">{isSpeaking ? 'Đang đặt câu hỏi...' : 'Đang lắng nghe...'}</p>
        </div>

        {/* Audio Visualizer (Bottom of Main Video) */}
        <div className="absolute bottom-0 left-0 w-full h-32 flex items-end justify-center gap-1.5 pb-8 opacity-80 pointer-events-none px-12">
          {[...Array(40)].map((_, i) => {
            // Generate a bell curve height distribution
            const centerDist = Math.abs(20 - i);
            const baseHeight = Math.max(5, 50 - centerDist * 2.5);
            // Use deterministic pseudo-random based on index to avoid impurity in render
            const pseudoRandom = Math.abs(Math.sin(i * 0.8));
            const randomMultiplier = isSpeaking ? (0.3 + pseudoRandom * 1.5) : 0.2;
            const finalHeight = baseHeight * randomMultiplier;
            
            return (
              <div 
                key={i} 
                className="w-1.5 rounded-t-full bg-gradient-to-t from-purple-600 to-indigo-400 transition-all duration-150 ease-out"
                style={{ height: `${finalHeight}px`, opacity: 1 - (centerDist * 0.04) }}
              ></div>
            );
          })}
        </div>

        {/* Top Indicators */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-white/90">REC 12:45</span>
          </div>
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
            <span className="text-xs font-semibold text-white/90">Độ trễ: 32ms</span>
          </div>
        </div>

      </div>

      {/* Picture-in-Picture (User Camera) */}
      <div className="absolute bottom-[10vh] right-[5vw] w-64 h-40 bg-[#1E293B] rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden z-20 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium">
          Bạn (Camera tắt)
        </div>
      </div>

      {/* Floating Control Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-30">
        
        {/* Settings */}
        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>

        {/* Camera Toggle (Off by default for UI sake) */}
        <button className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all border border-red-500/30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>

        {/* Mic Toggle */}
        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </button>

        {/* End Call (Big Red Button) */}
        <button className="px-6 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2.586-2.586a2 2 0 00-2.828-2.828L13.172 5.172a4 4 0 00-5.656 0L4.93 2.586a2 2 0 00-2.828 2.828L4.658 8m16 8l-2.586 2.586a2 2 0 01-2.828-2.828l2.586-2.586a4 4 0 015.656 0l2.586 2.586a2 2 0 01-2.828 2.828l-2.586-2.586z" style={{ transformOrigin: 'center', transform: 'rotate(135deg)' }} /></svg>
          Kết thúc
        </button>

      </div>
      
    </div>
  );
}
