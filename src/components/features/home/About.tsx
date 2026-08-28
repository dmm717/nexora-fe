import React, { useEffect, useRef } from 'react';
import styles from './About.module.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        (containerRef.current as HTMLElement).children,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          }
        }
      );
    }
  }, []);

  return (
    <section id="casestudy" className={styles.aboutSection}>
      <div className={styles.container} ref={containerRef}>
        <div className={styles.textContent}>
          <span className={styles.tag}>Tại sao chọn chúng tôi?</span>
          <h2 className={styles.title}>Nâng tầm kỹ năng mềm <br />với <span className={styles.highlight}>AI GPT-4o</span></h2>
          <p className={styles.desc}>
            Mô phỏng hoàn hảo môi trường phỏng vấn thực tế, đánh giá chi tiết cả về kiến thức chuyên môn lẫn biểu cảm khuôn mặt.
          </p>
          
          <ul className={styles.checklist}>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>Phản hồi theo thời gian thực (Real-time Feedback)</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>Phân tích cảm xúc & Tốc độ nói (Tone Analysis)</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>Bám sát mô hình trả lời STAR chuẩn mực</span>
            </li>
          </ul>

          <button className={styles.ctaButton}>Trải nghiệm ngay</button>
        </div>

        <div className={styles.imageContent}>
          <div className={styles.imageWrapper}>
             <div className={styles.placeholderImage}></div>
             
             <div className={styles.experienceBox}>
               <h3>100+</h3>
               <p>Kịch bản Ngành nghề</p>
               <span>Hỗ trợ mọi lĩnh vực IT, Marketing, Sales...</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
