import React, { useEffect, useRef } from 'react';
import styles from './Stats.module.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Stats = () => {
  const statsRef = useRef(null);

  useEffect(() => {
    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 90%",
          }
        }
      );
    }
  }, []);

  return (
    <div className={styles.statsWrapper}>
      <div className={styles.statsContainer} ref={statsRef}>
        <div className={styles.statItem}>
          <div className={styles.icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className={styles.text}>
            <h3>10k+</h3>
            <p>Lượt phỏng vấn</p>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div className={styles.text}>
            <h3>500+</h3>
            <p>Kịch bản ngành nghề</p>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
          </div>
          <div className={styles.text}>
            <h3>85%</h3>
            <p>Tỷ lệ trúng tuyển</p>
          </div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <div className={styles.text}>
            <h3>24/7</h3>
            <p>Sẵn sàng hỗ trợ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
