'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePublicFeedback } from '@/hooks/queries/useFeedback';

export const LandingTestimonials: React.FC = () => {
  const { data, isLoading, isError } = usePublicFeedback();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.items.length === 0 || !sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Layered GSAP transform: entrance reveal on wrapper
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.testimonial-entrance-card',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [data]);

  // If loading, error, or no items, cleanly hide the section entirely
  if (isLoading || isError || !data || data.items.length === 0) {
    return null;
  }

  const { items, averageRating, ratingCount } = data;

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-16 sm:py-24 bg-slate-50/70 border-t border-b border-slate-200/60 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-amber-500 fill-current">star</span>
            <span>Đánh giá từ người dùng thực tế</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Người dùng nói gì về Nexora
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {averageRating !== null && averageRating !== undefined && (
              <div className="flex items-center gap-1.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className="material-symbols-outlined text-[18px] fill-current"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
                <span className="text-sm font-bold text-slate-800 ml-1">
                  {averageRating.toFixed(1)}/5
                </span>
              </div>
            )}
            <span className="text-xs text-slate-500">
              ({ratingCount} lượt đánh giá đã xác thực)
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div
          ref={trackRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="testimonial-entrance-card"
            >
              <div className="h-full flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined text-[18px] ${
                            star <= item.rating ? 'fill-current' : 'text-slate-200'
                          }`}
                          style={{ fontVariationSettings: star <= item.rating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                </div>

                {/* Author Info (No fake photo: initials badge only) */}
                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {(item.displayName || 'N').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {item.displayName || 'Người dùng Nexora'}
                      </p>
                      <p className="text-[11px] text-slate-400">Học viên Nexora</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Intl.DateTimeFormat('vi-VN', {
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(item.publishedAt))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
