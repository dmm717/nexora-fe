'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Mentors = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.mentor-card-premium', 
        { y: 80, opacity: 0, rotateZ: 2 },
        {
          y: 0,
          opacity: 1,
          rotateZ: 0,
          duration: 1.2,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
          }
        }
      );
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const mentors = [
    {
      name: 'Nguyễn Văn A',
      role: 'Senior SDE @ Google',
      price: '500k',
      image: 'https://i.pravatar.cc/300?img=11'
    },
    {
      name: 'Trần Thị B',
      role: 'PM @ Meta',
      price: '600k',
      image: 'https://i.pravatar.cc/300?img=5'
    },
    {
      name: 'Lê Văn C',
      role: 'Tech Lead @ Amazon',
      price: '450k',
      image: 'https://i.pravatar.cc/300?img=12'
    },
    {
      name: 'Phạm Thị D',
      role: 'UXR @ Apple',
      price: '550k',
      image: 'https://i.pravatar.cc/300?img=9'
    }
  ];

  return (
    <section ref={containerRef} className="py-32 lg:py-48 bg-[#FDFBF7] relative" id="mentors">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div className="max-w-3xl">
            <h2 className="text-[3rem] md:text-[4.5rem] font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
              Mạng Lưới <br className="hidden md:block" /> Chuyên Gia.
            </h2>
            <p className="text-xl text-gray-500 leading-[1.6]">
              Luyện tập 1-1 với những bộ óc hàng đầu từ các tập đoàn công nghệ lớn nhất thế giới.
            </p>
          </div>
          <button className="group relative inline-flex items-center justify-between p-2 pl-6 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-500 active:scale-[0.98]">
            <span className="text-sm font-semibold tracking-wide text-gray-900 mr-4">Khám Phá Mentor</span>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-500 group-hover:bg-gray-200">
              <svg className="w-4 h-4 text-gray-900 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </button>
        </div>

        {/* Soft Structuralism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentors.map((mentor, index) => (
            <div key={index} className="mentor-card-premium p-2 bg-white rounded-[2.5rem] ring-1 ring-black/[0.04] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] group cursor-pointer hover:-translate-y-2 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <div className="bg-gray-50/50 rounded-[calc(2.5rem-0.5rem)] p-6 md:p-8 text-center flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-8 ring-4 ring-white shadow-xl">
                  <img 
                    src={mentor.image} 
                    alt={mentor.name} 
                    className="object-cover w-full h-full filter grayscale group-hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{mentor.name}</h3>
                <p className="text-sm font-medium text-gray-500 mb-8">{mentor.role}</p>
                
                <div className="w-full pt-6 border-t border-gray-200/60 flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900">{mentor.price} <span className="text-xs text-gray-400 font-normal">/ giờ</span></div>
                  <div className="flex gap-1 text-purple-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Mentors;
