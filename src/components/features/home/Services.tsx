'use client';
import React, { useEffect, useRef } from 'react';
import styles from './Services.module.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "PHÂN TÍCH CV",
    desc: "Bóc tách thực thể và đối chiếu từ khóa (Skill Gaps) giúp hồ sơ của bạn lọt qua hệ thống ATS dễ dàng.",
  },
  {
    title: "PHỎNG VẤN ẢO",
    desc: "Trải nghiệm real-time với Video Avatar. Sinh câu hỏi tự động và đánh giá phản xạ tức thì.",
  },
  {
    title: "STAR BUILDER",
    desc: "Chuẩn hóa câu chuyện cá nhân theo cấu trúc Tình huống - Nhiệm vụ - Hành động - Kết quả.",
  },
  {
    title: "BÁO CÁO CẢM XÚC",
    desc: "AI phân tích biểu cảm và tốc độ nói, mang đến bảng đánh giá chi tiết về phong thái trình bày.",
  }
];

const Services = () => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    
    const rows = listRef.current.children;
    
    gsap.fromTo(rows,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
        }
      }
    );
  }, []);

  return (
    <section id="features" className={styles.servicesSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>HỆ SINH THÁI</h2>
        </div>
        
        <div className={styles.listWrapper} ref={listRef}>
          {services.map((svc, i) => (
            <div key={i} className={styles.row}>
              <div className={styles.index}>(0{i + 1})</div>
              <h3 className={styles.title}>{svc.title}</h3>
              <p className={styles.desc}>{svc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
