'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FeaturesBento = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathData, setPathData] = useState('');
  const [pathLength, setPathLength] = useState(0);

  // Camera state for Card 3
  const [isCamActive, setIsCamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (isManual = false) => {
    if (!isManual && typeof window !== 'undefined' && localStorage.getItem('nexora_camera_denied') === 'true') {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCamActive(true);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexora_camera_denied');
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexora_camera_denied', 'true');
      }
      if (isManual) {
        alert("Vui lòng cấp quyền truy cập Camera trong trình duyệt để trải nghiệm tính năng này.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCamActive(false);
  };

  useEffect(() => {
    // Chỉ yêu cầu quyền truy cập camera khi người dùng cuộn (scroll) đến vùng này
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startCamera(false);
          observer.disconnect(); // Chỉ hỏi 1 lần khi cuộn tới
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      observer.disconnect();
      stopCamera();
    };
  }, []);

  // Initial cards entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bento-card-anim',
        { y: 50, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
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

  // Continuous Line Drawing Logic
  useEffect(() => {
    const updatePath = () => {
      if (!gridRef.current) return;
      const cards = Array.from(gridRef.current.querySelectorAll('.bento-card-anim')) as HTMLElement[];
      const gridRect = gridRef.current.getBoundingClientRect();
      
      let d = '';
      cards.forEach((card, idx) => {
        // Calculate the center of each card relative to the grid wrapper
        const x = card.offsetLeft + card.offsetWidth / 2;
        const y = card.offsetTop + card.offsetHeight / 2;
        
        if (idx === 0) {
          d += `M ${x} ${y} `;
        } else {
          // Use Bezier curve for smooth turning between cards
          const prevCard = cards[idx - 1];
          const prevX = prevCard.offsetLeft + prevCard.offsetWidth / 2;
          const prevY = prevCard.offsetTop + prevCard.offsetHeight / 2;
          
          const cp1x = prevX + (x - prevX) / 2;
          const cp1y = prevY;
          const cp2x = prevX + (x - prevX) / 2;
          const cp2y = y;
          
          d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y} `;
        }
      });
      setPathData(d);
    };

    // Delay calculation slightly to ensure DOM is fully laid out and images loaded
    const timeout = setTimeout(updatePath, 200);
    window.addEventListener('resize', updatePath);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePath);
    };
  }, []);

  // Animate the SVG line on scroll
  useEffect(() => {
    if (pathRef.current && pathData) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
      
      gsap.fromTo(pathRef.current, 
        { strokeDashoffset: length },
        { 
          strokeDashoffset: 0, 
          ease: "none",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 50%",
            end: "bottom 80%",
            scrub: 1
          }
        }
      );
    }
  }, [pathData]);

  return (
    <section ref={containerRef} className="py-20 lg:py-28 bg-[#F6F8FD] relative overflow-hidden" id="features">
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { opacity: 0.8; transform: scale(1.05); box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
        }
        @keyframes audio-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes grow-width {
          from { width: 0%; }
        }
      `}</style>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">

        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-[2.75rem] md:text-[3.75rem] font-extrabold text-[#0F172A] tracking-tight">
            Tính Năng
          </h2>
        </div>

        {/* GIANT OUTER BENTO CONTAINER */}
        <div className="bg-[#EEF2FB] border border-[#D8E1F3] rounded-[2.5rem] md:rounded-[3.2rem] p-4 md:p-8 lg:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden">
          
          {/* THE CONTINUOUS SVG LINE OVERLAY (Behind the glass cards) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40 md:opacity-60" preserveAspectRatio="none">
            {/* Background Track */}
            <path d={pathData} stroke="#CBD5E1" strokeWidth="2" fill="none" strokeDasharray="6 6" />
            {/* Animated Glowing Line */}
            <path 
              ref={pathRef}
              d={pathData} 
              stroke="#6366F1" 
              strokeWidth="4" 
              fill="none" 
              strokeDasharray={pathLength}
              strokeDashoffset={pathLength}
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            />
          </svg>

          {/* 12-COLUMN BENTO GRID */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 relative z-10">

            {/* ================= ROW 1 ================= */}

            {/* CARD 1: Phân Tích */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-3 bg-white/70 will-change-transform rounded-[2.2rem] p-6 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between relative min-h-[340px] group">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Phân Tích & Phản Hồi
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[90%]">
                  AI quét trực tiếp CV của bạn và đối chiếu yêu cầu công việc.
                </p>
              </div>

              {/* Live Scanner Graphic */}
              <div className="mt-5 relative w-full flex-1 min-h-[220px] bg-slate-50/50 rounded-2xl border border-slate-200/50 p-2 overflow-hidden flex flex-col">
                {/* Scanner Laser */}
                <div className="absolute left-0 w-full h-12 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent z-20" style={{ animation: 'scan 2.5s ease-in-out infinite' }}>
                  <div className="absolute bottom-1/2 left-0 w-full h-[1px] bg-purple-400 shadow-[0_0_8px_#A855F7]"></div>
                </div>

                {/* Real-looking Mini ATS CV */}
                <div className="w-[88%] bg-white rounded-sm shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-3 border border-slate-200 relative z-10 mx-auto mt-1 mb-1 text-[5px] leading-tight text-slate-800 font-sans">
                  {/* Header */}
                  <div className="text-center mb-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-black">John Doe</div>
                    <div className="text-[5px] font-bold uppercase tracking-widest text-slate-600 mt-0.5 mb-1">Senior Software Engineer</div>
                    <div className="text-[4px] text-slate-500 flex justify-center gap-1.5">
                      <span>john.doe@email.com</span>
                      <span>•</span>
                      <span>+1 234 567 890</span>
                      <span>•</span>
                      <span>San Francisco, CA</span>
                    </div>
                  </div>
                  
                  {/* About Me Section */}
                  <div className="mb-1.5">
                    <div className="font-black text-black mb-[2px] uppercase text-[4.5px] border-b-[1.5px] border-black pb-[1px]">About Me</div>
                    <div className="text-[4px] text-slate-600 text-justify leading-snug">
                      Experienced software engineer with 6+ years in full-stack development. Passionate about building scalable systems and optimizing performance.
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="mb-1.5">
                    <div className="font-black text-black mb-[2px] uppercase text-[4.5px] border-b-[1.5px] border-black pb-[1px]">Skills</div>
                    <div className="text-[4px] text-slate-600 leading-snug">
                      <span className="font-bold">Languages:</span> JavaScript, TypeScript, Python, Java, C++<br/>
                      <span className="font-bold">Frameworks:</span> React, Next.js, Node.js, Express, Spring Boot
                    </div>
                  </div>

                  {/* Work Experience Section */}
                  <div className="mb-1.5">
                    <div className="font-black text-black mb-[2px] uppercase text-[4.5px] border-b-[1.5px] border-black pb-[1px]">Work Experience</div>
                    
                    <div className="mt-0.5 mb-1.5">
                      <div className="flex justify-between font-bold text-black text-[4.5px]">
                        <span>TechCorp - Lead Engineer</span>
                        <span className="font-normal text-slate-500 text-[4px]">2022 - Present</span>
                      </div>
                      <ul className="list-disc pl-2.5 mt-[1px] space-y-[1px] text-[4px] text-slate-600">
                        <li>Architected cloud-native microservices serving 2M+ users.</li>
                        <li>Reduced latency by 40% using Redis caching.</li>
                        <li>Mentored a team of 5 junior developers.</li>
                      </ul>
                    </div>

                    <div className="mt-0.5">
                      <div className="flex justify-between font-bold text-black text-[4.5px]">
                        <span>WebSolutions - Frontend Dev</span>
                        <span className="font-normal text-slate-500 text-[4px]">2020 - 2022</span>
                      </div>
                      <ul className="list-disc pl-2.5 mt-[1px] space-y-[1px] text-[4px] text-slate-600">
                        <li>Developed responsive web apps using React and Redux.</li>
                        <li>Improved Lighthouse scores from 65 to 95.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="mb-1.5">
                    <div className="font-black text-black mb-[2px] uppercase text-[4.5px] border-b-[1.5px] border-black pb-[1px]">Education</div>
                    <div className="flex justify-between font-bold text-black text-[4.5px] mt-0.5">
                      <span>Stanford University - BS Computer Science</span>
                      <span className="font-normal text-slate-500 text-[4px]">2016 - 2020</span>
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div>
                    <div className="font-black text-black mb-[2px] uppercase text-[4.5px] border-b-[1.5px] border-black pb-[1px]">Projects</div>
                    <div className="mt-0.5">
                      <div className="flex justify-between font-bold text-black text-[4.5px]">
                        <span>Open Source Contributor - React</span>
                      </div>
                      <ul className="list-disc pl-2.5 mt-[1px] space-y-[1px] text-[4px] text-slate-600">
                        <li>Implemented new core hooks and resolved 50+ community issues.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="absolute right-3 bottom-3 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm border border-slate-100 text-[8px] font-mono text-purple-600 flex items-center gap-1.5 z-30">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Analyzing
                </div>
              </div>
            </div>

            {/* CARD 2: Hệ Thống Phỏng Vấn AI (Center) */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-5 relative min-h-[350px] flex flex-col group">
              <div className="absolute inset-0 rounded-[2.3rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/5 border border-white/80 will-change-transform shadow-[0_8px_30px_rgba(99,102,241,0.08)]"></div>

              <div className="relative p-7 md:p-8 flex flex-col justify-between h-full z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                      Lõi AI Phỏng Vấn
                    </h3>
                    <p className="text-xs text-gray-500 max-w-[65%] leading-relaxed">
                      Xử lý ngôn ngữ tự nhiên và đánh giá năng lực theo thời gian thực.
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-white/80 backdrop-blur rounded-full border border-indigo-100 text-[9px] font-bold text-indigo-600 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Live processing
                  </div>
                </div>

                {/* AI Thought Process UI */}
                <div className="my-6 relative w-full flex-1 flex items-center justify-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center z-20" style={{ animation: 'pulse-glow 3s infinite' }}>
                    <img src="/logo.png" alt="Nexora Logo" className="w-full h-full object-contain drop-shadow-xl mix-blend-multiply" />
                  </div>
                  
                  {/* Floating code / logic nodes */}
                  <div className="absolute top-[10%] left-[5%] bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[10px] font-mono text-slate-700 transform -rotate-3 hover:scale-105 transition-transform hover:z-30">
                    <span className="text-purple-500 font-bold">Context</span>.match(<span className="text-emerald-500">98%</span>)
                  </div>
                  <div className="absolute top-[15%] right-[5%] bg-indigo-50/90 backdrop-blur border border-indigo-100 px-3 py-1.5 rounded-full text-[9px] text-indigo-600 font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(99,102,241,0.1)] hover:scale-105 transition-transform hover:z-30">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    NLP Engine Active
                  </div>
                  <div className="absolute top-[45%] left-[5%] bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[9px] font-mono text-slate-700 transform rotate-2 hover:scale-105 transition-transform hover:z-30">
                    <span className="text-emerald-500 font-bold">Emotion</span>.detect() <span className="text-gray-400">{'->'}</span> Confident
                  </div>
                  <div className="absolute top-[50%] right-[8%] bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[9px] font-mono text-slate-700 transform -rotate-2 hover:scale-105 transition-transform hover:z-30">
                    <span className="text-blue-500 font-bold">Knowledge</span>.query() <span className="text-gray-400">{'->'}</span> Tech Stack
                  </div>
                  <div className="absolute bottom-[20%] left-[10%] bg-purple-50/90 backdrop-blur border border-purple-100 px-3 py-1.5 rounded-full text-[9px] text-purple-600 font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(168,85,247,0.1)] hover:scale-105 transition-transform hover:z-30">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Latency: 42ms
                  </div>
                  <div className="absolute bottom-[15%] right-[5%] bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-[10px] font-mono text-slate-700 transform rotate-3 hover:scale-105 transition-transform hover:z-30">
                    <span className="text-indigo-500 font-bold">Speech</span>.toText() <span className="text-gray-400">{'->'}</span> OK
                  </div>
                  <div className="absolute bottom-[5%] left-[30%] bg-emerald-50/90 backdrop-blur border border-emerald-100 px-3 py-1.5 rounded-full text-[9px] text-emerald-600 font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.1)] hover:scale-105 transition-transform hover:z-30">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Generating Response
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Hội Thoại Mô Phỏng */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-4 bg-white/70 will-change-transform rounded-[2.2rem] p-5 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between relative min-h-[340px] group">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Phỏng vấn 1:1 với AI
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                  Tương tác giọng nói tự nhiên như với người thật.
                </p>
              </div>

              {/* Video Call Interface UI */}
              <div className="flex-1 bg-slate-900 rounded-2xl p-2.5 flex flex-col relative overflow-hidden shadow-inner border border-slate-800 gap-2">
                {/* Header / Timer */}
                <div className="flex justify-between items-center px-2 pt-1">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#FFBD2E]"></div>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> 00:03:42
                  </div>
                </div>

                {/* Video Feeds Grid */}
                <div className="flex-1 flex gap-2 items-center justify-center w-full">
                  {/* AI Video (Left) */}
                  <div className="flex-1 aspect-square bg-slate-800 rounded-xl relative overflow-hidden border border-slate-700/50 flex items-center justify-center shadow-sm">
                    {/* AI Video Stream */}
                    <video
                      src="/images/interviewer-speaking.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 z-20">
                       <span className="text-[6.5px] text-white font-medium">Nexora AI</span>
                       <div className="flex items-end gap-[1px] h-1.5 ml-0.5">
                         <div className="w-[1.5px] bg-indigo-400 h-[40%] animate-pulse"></div>
                         <div className="w-[1.5px] bg-indigo-400 h-[80%] animate-pulse" style={{ animationDelay: '75ms' }}></div>
                         <div className="w-[1.5px] bg-indigo-400 h-[60%] animate-pulse" style={{ animationDelay: '150ms' }}></div>
                       </div>
                    </div>
                  </div>

                  {/* User Camera (Right) */}
                  <div 
                    onClick={() => isCamActive ? stopCamera() : startCamera(true)}
                    className={`flex-1 aspect-square rounded-xl relative overflow-hidden border flex flex-col items-center justify-center p-2 text-center group cursor-pointer transition-colors ${isCamActive ? 'bg-black border-slate-700' : 'bg-slate-800/80 border-slate-700/50 border-dashed hover:bg-slate-800'}`}
                  >
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 -scale-x-100 ${isCamActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                    
                    {!isCamActive && (
                      <>
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-[7.5px] text-slate-300 font-medium">Turn on camera</span>
                        <span className="text-[5.5px] text-slate-500 mt-0.5">Click to allow access</span>
                      </>
                    )}

                    {isCamActive && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]"></div>
                    )}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="h-8 flex items-center justify-center gap-3 mt-1">
                  <button className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/40 transition-colors">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2.414-2.414a2 2 0 012.828 2.828L18.828 10l2.414 2.414a2 2 0 01-2.828 2.828L16 12.828l-2.414 2.414a2 2 0 01-2.828-2.828L13.172 10l-2.414-2.414a2 2 0 012.828-2.828L16 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= ROW 2 ================= */}

            {/* CARD 4: Hồ Sơ & CV Khớp Lệnh */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-6 bg-white/70 will-change-transform rounded-[2.2rem] p-6 lg:p-7 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-6 relative min-h-[320px] group">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2">
                    Khớp Lệnh Kỹ Năng
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-6 max-w-[85%]">
                    Hệ thống tự động phân tích và đo lường mức độ phù hợp của CV so với JD.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { skill: 'System Design', score: 95, color: 'bg-indigo-500' },
                    { skill: 'React / Frontend', score: 88, color: 'bg-purple-500' },
                    { skill: 'Cloud Infrastructure', score: 72, color: 'bg-blue-500' }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-[11px] font-bold mb-1.5 text-gray-700">
                        <span>{item.skill}</span>
                        <span className="text-indigo-600">{item.score}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-200/50">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%`, animation: `grow-width 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`, animationDelay: `${idx * 0.2}s` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-[42%] bg-gradient-to-br from-slate-50/50 to-indigo-50/50 rounded-[1.5rem] p-5 border border-indigo-100/50 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="relative mb-3">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="46" stroke="#F1F5F9" strokeWidth="10" fill="none" />
                    <circle cx="56" cy="56" r="46" stroke="#6366F1" strokeWidth="10" fill="none" strokeDasharray="289" strokeDashoffset="28" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 2s ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-indigo-600 tracking-tighter">90<span className="text-lg text-indigo-400">%</span></span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">Match Score</div>
              </div>
            </div>

            {/* CARD 5: Phân Tích Đa Giác Quan */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-3 bg-white/70 will-change-transform rounded-[2.2rem] p-5 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col relative min-h-[320px] group overflow-hidden">
              <div className="relative z-10 mb-4">
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Phân Tích Hành Vi
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Đo lường độ tự tin và giao tiếp phi ngôn ngữ.
                </p>
              </div>

              {/* Camera Tracking UI */}
              <div className="flex-1 bg-slate-900 rounded-2xl p-3 relative overflow-hidden flex flex-col justify-end shadow-inner border border-slate-800">
                {/* Face Tracking Graphic */}
                <div className="absolute inset-0 flex items-center justify-center opacity-80">
                  <div className="w-24 h-28 border-[1.5px] border-dashed border-indigo-400/40 rounded-xl relative">
                    {/* Tracking points */}
                    <div className="absolute top-8 left-6 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399] animate-ping"></div>
                    <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399] animate-ping" style={{ animationDelay: '0.2s' }}></div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-2 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div>
                    {/* Scanning line inside face box */}
                    <div className="absolute left-0 w-full h-[1px] bg-indigo-500 shadow-[0_0_8px_#6366f1]" style={{ animation: 'scan 2.5s ease-in-out infinite' }}></div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="relative z-10 space-y-2 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-lg">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-400">Eye Contact</span>
                    <span className="text-emerald-400 font-bold">92%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] font-mono mt-2">
                    <span className="text-slate-400">Confidence</span>
                    <span className="text-indigo-400 font-bold">88%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 6: Lộ Trình Học Tập */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-3 bg-white/70 will-change-transform rounded-[2.2rem] p-5 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between relative min-h-[320px] group">
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  Lộ Trình Tối Ưu
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-5">
                  AI gợi ý các bước nâng cấp kỹ năng.
                </p>
              </div>

              <div className="relative pl-6 space-y-5 my-auto border-l-2 border-slate-100 ml-3">
                <div className="absolute top-0 bottom-1/3 left-[-2px] w-[2px] bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>

                {[
                  { title: 'Củng cố Core Skills', active: true, desc: 'Hoàn thành 80%' },
                  { title: 'Luyện tập Phỏng vấn', active: true, desc: 'Đang tiến hành' },
                  { title: 'Tự tin Ứng tuyển', active: false, desc: 'Sắp tới' },
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-[3px] bg-white ${item.active ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'border-slate-200'}`}></div>
                    <div className={`text-[12px] font-bold ${item.active ? 'text-gray-900' : 'text-gray-400'}`}>{item.title}</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= ROW 3 ================= */}

            {/* CARD 7: Đánh Giá Năng Lực Chuyên Sâu */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-6 bg-white/70 will-change-transform rounded-[2.2rem] p-6 lg:p-7 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-6 lg:gap-8 relative min-h-[220px] group overflow-hidden">
              
              {/* Left: Radar Chart */}
              <div className="w-full md:w-[45%] flex flex-col justify-center items-center relative">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 w-full mb-1">Đánh Giá Đa Chiều</h3>
                <p className="text-[11px] text-gray-500 w-full mb-6">Rubric 5 trục kỹ năng cốt lõi.</p>
                
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Radar Background */}
                  <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 opacity-20">
                    <polygon points="50,5 95,35 80,90 20,90 5,35" fill="none" stroke="#64748b" strokeWidth="1" />
                    <polygon points="50,25 75,45 65,75 35,75 25,45" fill="none" stroke="#64748b" strokeWidth="1" />
                    <line x1="50" y1="50" x2="50" y2="5" stroke="#64748b" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="95" y2="35" stroke="#64748b" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="80" y2="90" stroke="#64748b" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="20" y2="90" stroke="#64748b" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="5" y2="35" stroke="#64748b" strokeWidth="0.5" />
                  </svg>
                  {/* Radar Value (Animated pulse) */}
                  <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 z-10 filter drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" style={{ animation: 'pulse-glow 3s infinite' }}>
                    <polygon points="50,15 85,38 70,80 30,75 15,45" fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
                    {/* Points */}
                    <circle cx="50" cy="15" r="2.5" fill="#4f46e5" />
                    <circle cx="85" cy="38" r="2.5" fill="#4f46e5" />
                    <circle cx="70" cy="80" r="2.5" fill="#4f46e5" />
                    <circle cx="30" cy="75" r="2.5" fill="#4f46e5" />
                    <circle cx="15" cy="45" r="2.5" fill="#4f46e5" />
                  </svg>
                  
                  {/* Labels */}
                  <span className="absolute -top-4 text-[9px] font-bold text-indigo-600">Tech</span>
                  <span className="absolute -right-5 top-1/3 text-[9px] font-bold text-slate-500">Logic</span>
                  <span className="absolute -bottom-4 right-3 text-[9px] font-bold text-slate-500">Comm</span>
                  <span className="absolute -bottom-4 left-3 text-[9px] font-bold text-slate-500">Eng</span>
                  <span className="absolute -left-6 top-1/3 text-[9px] font-bold text-slate-500">Design</span>
                </div>
              </div>

              {/* Right: Evidence Log */}
              <div className="w-full md:w-[55%] flex flex-col justify-center">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 shadow-inner h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Evidence Log</span>
                  </div>
                  
                  <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 relative group/log hover:border-indigo-200 transition-colors">
                      <div className="absolute -left-2 top-3 w-4 h-4 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      </div>
                      <div className="flex justify-between items-start ml-3 mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded">02:30</span>
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">+ System Design</span>
                      </div>
                      <p className="text-[11px] text-gray-600 ml-3 italic leading-relaxed">"Bạn đã giải thích rất tốt về chiến lược Cache Breakdown bằng Redis..."</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 relative group/log hover:border-slate-200 transition-colors">
                      <div className="absolute -left-2 top-3 w-4 h-4 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      </div>
                      <div className="flex justify-between items-start ml-3 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded">08:15</span>
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">! Giao tiếp</span>
                      </div>
                      <p className="text-[11px] text-gray-600 ml-3 italic leading-relaxed">"Câu trả lời hơi dài dòng, nên đi thẳng vào vấn đề theo cấu trúc STAR."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 8: Thống Kê Hiệu Suất */}
            <div className="bento-card-anim opacity-0 col-span-1 md:col-span-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-[2.2rem] p-6 lg:p-8 text-white shadow-[0_8px_30px_rgba(99,102,241,0.25)] flex flex-col justify-between relative min-h-[220px] overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-[radial-gradient(circle,_rgba(255,255,255,0.2)_0%,_transparent_70%)] rounded-full transition-transform group-hover:scale-110 duration-700"></div>
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[radial-gradient(circle,_rgba(168,85,247,0.3)_0%,_transparent_70%)] rounded-full"></div>
              
              <div className="z-10">
                <h3 className="text-xl md:text-2xl font-bold leading-snug mb-2">Hiệu Suất Vượt Trội</h3>
                <p className="text-[12px] text-indigo-100/80 max-w-[80%] leading-relaxed">Nền tảng xử lý dữ liệu mạnh mẽ, đảm bảo trải nghiệm mượt mà và chính xác tuyệt đối.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6 z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <div className="text-2xl lg:text-3xl font-black text-white mb-0.5">98<span className="text-lg opacity-70">%</span></div>
                  <div className="text-[9px] lg:text-[10px] text-indigo-200 font-medium uppercase tracking-wide">Tỷ lệ hài lòng</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <div className="text-2xl lg:text-3xl font-black text-white mb-0.5">10<span className="text-lg opacity-70">k+</span></div>
                  <div className="text-[9px] lg:text-[10px] text-indigo-200 font-medium uppercase tracking-wide">Lượt phỏng vấn</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <div className="text-2xl lg:text-3xl font-black text-white mb-0.5">&lt;50<span className="text-lg opacity-70">ms</span></div>
                  <div className="text-[9px] lg:text-[10px] text-indigo-200 font-medium uppercase tracking-wide">Độ trễ AI</div>
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

