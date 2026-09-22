'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { usePublicFeedback } from '@/hooks/queries/useFeedback';
import type { PublicFeedbackItem } from '@/services/feedbackContract';
import { NEXORA_MASCOT_ASSETS } from '@/config/brandAssets';
import styles from './LandingTestimonials.module.css';

const PUBLIC_FEEDBACK_LIMIT = 3;
const ratingSteps = [1, 2, 3, 4, 5] as const;

function getInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'N';
  return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase();
}

function formatPublishedAt(value: string, options?: Intl.DateTimeFormatOptions): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('vi-VN', options ?? {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function FeedbackAvatar({ item }: { item: PublicFeedbackItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayName = item.displayName.trim() || 'Người dùng Nexora';

  if (item.avatarUrl && !imageFailed) {
    return (
      // The backend controls future avatar hosts, so a native image keeps this optional field host-agnostic.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.avatarUrl}
        alt=""
        className={styles.avatarImage}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <span className={styles.avatarFallback}>{getInitials(displayName)}</span>;
}

function RatingStars({ rating, label }: { rating: number; label: string }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className={styles.stars} role="img" aria-label={label}>
      {ratingSteps.map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={`material-symbols-outlined ${star <= safeRating ? styles.starFilled : styles.starEmpty}`}
          style={{ fontVariationSettings: star <= safeRating ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export const LandingTestimonials: React.FC = () => {
  const { data, isLoading, isError } = usePublicFeedback(PUBLIC_FEEDBACK_LIMIT);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!data || data.items.length === 0 || !sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-social-proof-reveal]',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power2.out',
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [data]);

  const latestPublishedAt = useMemo(() => {
    if (!data) return null;
    const latestTimestamp = data.items.reduce<number | null>((latest, item) => {
      const timestamp = new Date(item.publishedAt).getTime();
      if (Number.isNaN(timestamp)) return latest;
      return latest === null ? timestamp : Math.max(latest, timestamp);
    }, null);

    return latestTimestamp === null
      ? null
      : formatPublishedAt(new Date(latestTimestamp).toISOString(), { month: '2-digit', year: 'numeric' });
  }, [data]);

  if (isLoading || isError || !data || data.items.length === 0) {
    return null;
  }

  const { items, averageRating, ratingCount } = data;
  const formattedRatingCount = new Intl.NumberFormat('vi-VN').format(ratingCount);
  const stats = [
    {
      label: 'Điểm trung bình',
      value: averageRating === null ? 'Chưa có' : `${averageRating.toFixed(1)}/5`,
      note: 'Từ đánh giá công khai',
    },
    {
      label: 'Lượt đánh giá',
      value: formattedRatingCount,
      note: 'Theo API phản hồi',
    },
    {
      label: 'Đang hiển thị',
      value: new Intl.NumberFormat('vi-VN').format(items.length),
      note: 'Phản hồi trong mục này',
    },
    {
      label: 'Cập nhật gần nhất',
      value: latestPublishedAt ?? 'Trực tiếp',
      note: 'Từ dữ liệu đã công khai',
    },
  ];

  return (
    <section ref={sectionRef} id="testimonials" className={styles.section}>
      <div className={styles.shell}>
        <div className={styles.testimonialsPanel} data-social-proof-reveal>
          <div className={styles.panelHeading}>
            <span className={styles.badge}>
              <span className="material-symbols-outlined" aria-hidden="true">verified</span>
              Đánh giá từ người dùng thực tế
            </span>
            <h2>Người dùng nói gì về Nexora</h2>
          </div>

          <div className={styles.ratingSummary}>
            <div>
              <strong>{averageRating === null ? '—' : averageRating.toFixed(1)}</strong>
              <span>/5</span>
            </div>
            <div>
              <RatingStars
                rating={averageRating ?? 0}
                label={averageRating === null ? 'Chưa có điểm trung bình' : `${averageRating.toFixed(1)} trên 5 sao`}
              />
              <p>{formattedRatingCount} lượt đánh giá đã công khai</p>
            </div>
          </div>

          <div className={styles.testimonialList}>
            {items.map((item) => {
              const displayName = item.displayName.trim() || 'Người dùng Nexora';
              const publishedAt = formatPublishedAt(item.publishedAt);

              return (
                <article key={item.id} className={styles.testimonialCard} data-social-proof-reveal>
                  <RatingStars rating={item.rating} label={`${item.rating} trên 5 sao`} />
                  <blockquote>&ldquo;{item.comment}&rdquo;</blockquote>
                  <footer>
                    <div className={styles.author}>
                      <span className={styles.avatar} aria-hidden="true">
                        <FeedbackAvatar item={item} />
                      </span>
                      <div>
                        <strong>{displayName}</strong>
                        {publishedAt && <time dateTime={item.publishedAt}>{publishedAt}</time>}
                      </div>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        </div>

        <aside className={styles.statsPanel} aria-labelledby="platform-stats-title" data-social-proof-reveal>
          <div className={styles.statsHeading}>
            <span className={styles.eyebrow}>Tín hiệu từ cộng đồng</span>
            <h2 id="platform-stats-title">Số liệu nền tảng</h2>
            <p>
              Các chỉ số dưới đây được lấy trực tiếp từ API phản hồi công khai của Nexora.
            </p>
          </div>

          <dl className={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statCard} data-social-proof-reveal>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
                <dd className={styles.statNote}>{stat.note}</dd>
              </div>
            ))}
          </dl>

          <Image
            src={NEXORA_MASCOT_ASSETS.pointingStats}
            width={768}
            height={768}
            sizes="(max-width: 760px) 138px, 210px"
            alt=""
            aria-hidden="true"
            className={styles.mascot}
          />
          <p className={styles.dataNote}>
            <span className="material-symbols-outlined" aria-hidden="true">sync</span>
            Không dùng số mẫu hay dữ liệu dựng sẵn
          </p>
        </aside>
      </div>
    </section>
  );
};
