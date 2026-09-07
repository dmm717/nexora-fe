'use client';
import React, { useRef, useEffect } from 'react';
import styles from './About.module.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const panels = [
  {
    title: "REAL-TIME",
    desc: "Nhận phản hồi ngay lập tức sau từng câu trả lời. Điều chỉnh nhịp độ và phong thái kịp thời.",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop"
  },
  {
    title: "EMOTION AI",
    desc: "Phân tích biểu cảm nét mặt qua camera. Tự tin chinh phục mọi ánh nhìn.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "STAR LOGIC",
    desc: "Khuôn mẫu tư duy STAR được bóc tách chi tiết. Biến mọi câu chuyện thành lợi thế cạnh tranh.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
  }
];

const About = () => {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current!;
      const sections = gsap.utils.toArray<HTMLElement>(`.${styles.panel}`);
      
      // Calculate how far to scroll to reach the end of the track
      // Adding a little extra space so the last panel aligns properly
      const amountToScroll = track.scrollWidth - window.innerWidth;

      gsap.to(sections, {
        x: () => -amountToScroll,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${amountToScroll}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true, // Recalculates on resize
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="casestudy" className={styles.aboutSection} ref={containerRef}>
      <div className={styles.track} ref={trackRef}>
        <div className={styles.introPanel}>
          <h2 className={styles.massiveText}>HOW IT<br/>WORKS.</h2>
        </div>
        {panels.map((panel, i) => (
          <div key={i} className={styles.panel}>
            <div className={styles.imageBox}>
              <div 
                className={styles.bgImg} 
                style={{ backgroundImage: `url('${panel.image}')` }} 
              />
            </div>
            <div className={styles.textBox}>
              <div className={styles.index}>[0{i+1}]</div>
              <h3 className={styles.panelTitle}>{panel.title}</h3>
              <p className={styles.panelDesc}>{panel.desc}</p>
            </div>
          </div>
        ))}
        {/* Extra padding at the end so the last item isn't flush against the right edge */}
        <div className={styles.endPadding}></div>
      </div>
    </section>
  );
};

export default About;
