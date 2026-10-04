"use client";
import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './CvWorkspace.module.css';
gsap.registerPlugin(useGSAP);
export default function CvAnalysisHero() {
  const container = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out', duration: .9 } })
        .from('[data-document]', { rotation: -13, x: 35, scale: .93 })
        .from('[data-annotation]', { x: -25, rotation: 3 }, '-=.65');
    });
    return () => media.revert();
  }, { scope: container });
  return <section ref={container} className={styles.public}><div className={styles.hero}>
    <div><span className={styles.eyebrow}>Nexora / Hiểu hồ sơ của bạn</span><h1>Mỗi kinh nghiệm<br />đều có giá trị.<br />Hãy để CV thể hiện rõ.</h1><p>Phân tích CV với AI theo mô tả công việc hoặc chuẩn năng lực ngành. Nhìn rõ điểm mạnh, khoảng trống và những đề xuất có thể hành động.</p><div className={styles.actions}><Link href="/resume-analyses">Tối ưu CV theo vị trí</Link><Link href="/resume-analyses">Phân tích theo ngành</Link></div></div>
    <div><div data-document className={styles.document} aria-hidden="true"><span>CV</span><small>EXPERIENCE · SKILLS · POTENTIAL</small></div><div data-annotation className={styles.annotation}><small>Minh họa cấu trúc báo cáo</small><p>Điểm mạnh có bằng chứng trong CV</p><p>Kỹ năng cần bổ sung theo mục tiêu</p><p>Đề xuất cải thiện cách trình bày</p></div></div>
  </div></section>;
}
