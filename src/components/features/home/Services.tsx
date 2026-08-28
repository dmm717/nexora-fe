import React, { useEffect, useRef } from 'react';
import styles from './Services.module.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    title: "Phân tích CV & JD",
    desc: "Trích xuất thực thể, đối chiếu ngữ nghĩa và tìm khoảng trống kỹ năng (Skill Gaps).",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m9 15 2 2 4-4"></path></svg>,
    color: "#e0f2fe",
    stroke: "#0ea5e9"
  },
  {
    title: "Phòng Phỏng vấn Ảo",
    desc: "Giao tiếp real-time với Video Avatar, có lip-sync và sinh câu hỏi tương thích ngữ cảnh.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
    color: "#dcfce7",
    stroke: "#22c55e"
  },
  {
    title: "Báo cáo & Chấm điểm",
    desc: "Phân tích Transcript, chấm điểm chi tiết và đánh giá kỹ năng mềm, tốc độ nói (wpm).",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>,
    color: "#f3e8ff",
    stroke: "#a855f7"
  },
  {
    title: "STAR Builder",
    desc: "Rèn luyện xử lý tình huống và xây dựng câu chuyện theo mô hình STAR chuẩn mực.",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    color: "#ffedd5",
    stroke: "#f97316"
  }
];

const Services = () => {

  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardsRef.current) {
      gsap.fromTo(
        cardsRef.current.children,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
          }
        }
      );
    }
  }, []);

  return (
    <section id="features" className={styles.servicesSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.tag}>Tính năng cốt lõi</span>
            <h2 className={styles.title}>
              Nền tảng giúp bạn <br />
              <span className={styles.highlight}>Tự tin ứng tuyển</span>
            </h2>
          </div>
          <div className={styles.descArea}>
            <p>Từ việc rèn luyện kĩ năng trả lời tình huống đến phân tích chi tiết hồ sơ năng lực, chúng tôi cung cấp giải pháp toàn diện nhất.</p>
            <a href="#features" className={styles.exploreLink}>Xem tất cả tính năng &rarr;</a>
          </div>
        </div>

        <div className={styles.grid} ref={cardsRef}>
          {services.map((service) => (
            <div className={styles.card} key={service.title}>
              <div className={styles.iconWrapper} style={{ backgroundColor: service.color, color: service.stroke }}>
                {service.icon}
              </div>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDesc}>{service.desc}</p>
              <a href="#features" className={styles.cardLink}>Learn More &rarr;</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
