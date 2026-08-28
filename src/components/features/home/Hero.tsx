import React, { useEffect, useRef } from 'react';
import styles from './Hero.module.css';
import gsap from 'gsap';

const Hero = () => {
  const contentRef = useRef(null);

  useEffect(() => {
    // Basic GSAP animation for the hero content
    if (contentRef.current) {
      gsap.fromTo(
        (contentRef.current as HTMLElement).children,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power3.out", delay: 0.2 }
      );
    }
  }, []);

  return (
    <section id="home" className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content} ref={contentRef}>
          <h1 className={styles.title}>
            Chinh Phục Nhà Tuyển Dụng <br />
            Với <span className={styles.highlight}>Trợ Lý AI</span>
          </h1>
          <p className={styles.description}>
            Trải nghiệm phòng phỏng vấn thực tế ảo, phân tích CV tự động và nhận báo cáo đánh giá chi tiết để sẵn sàng cho công việc mơ ước.
          </p>
          <div className={styles.actions}>
            <button className={styles.primaryButton}>Phân tích CV (Miễn phí)</button>
            <button className={styles.secondaryButton}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Xem Video Demo
            </button>
          </div>
        </div>
      </div>
      <div className={styles.bgImage}>
        {/* Placeholder for the background image building */}
      </div>
    </section>
  );
};

export default Hero;
