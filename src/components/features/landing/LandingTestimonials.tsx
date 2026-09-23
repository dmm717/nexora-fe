'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { usePublicFeedback } from '@/hooks/queries/useFeedback';
import { usePlatformStats } from '@/hooks/queries/usePlatformStats';
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

function formatPublishedAt(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('vi-VN', {
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
  const { data, isLoading } = usePublicFeedback(PUBLIC_FEEDBACK_LIMIT);
  const { data: platformStats } = usePlatformStats();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (((data?.items.length ?? 0) === 0 && !platformStats) || !sectionRef.current) return;

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
  }, [data, platformStats]);

  const items = data?.items ?? [];
  if ((isLoading && !platformStats) || (items.length === 0 && !platformStats)) {
    return null;
  }

  const averageRating = data?.averageRating ?? platformStats?.averageRating ?? null;
  const ratingCount = data?.ratingCount ?? platformStats?.ratingCount ?? 0;
  const formattedRatingCount = new Intl.NumberFormat('vi-VN').format(ratingCount);
  const formatCount = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
  const metrics = platformStats
    ? [
        { label: 'Người dùng Nexora', value: formatCount(platformStats.userCount) },
        {
          label: 'Phiên phỏng vấn đã hoàn thành',
          value: formatCount(platformStats.completedInterviewCount),
        },
        { label: 'Lượt phân tích CV', value: formatCount(platformStats.completedCvAnalysisCount) },
      ]
    : [];
  const productProof = [
    'Phân tích CV theo vị trí bạn hướng tới',
    'Phỏng vấn mô phỏng có câu hỏi tiếp nối',
    'Gợi ý bài luyện từ chính phần còn thiếu',
  ];

  return (
    <section ref={sectionRef} id="testimonials" className={styles.section}>
      <div className={`${styles.shell} ${items.length === 0 ? styles.statsOnly : ''}`}>
        {items.length > 0 && (
          <div className={styles.testimonialsPanel} data-social-proof-reveal>
            <div className={styles.panelHeading}>
              <span className={styles.badge}>
                <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                Chia sẻ từ người dùng
              </span>
              <h2>Tiến bộ được kể bằng trải nghiệm thật.</h2>
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
                <p>{formattedRatingCount} đánh giá đã được chia sẻ</p>
              </div>
            </div>

            <div className={styles.testimonialList} data-count={items.length}>
              {items.map((item) => {
                const displayName = item.displayName.trim() || 'Người dùng Nexora';
                const publishedAt = formatPublishedAt(item.publishedAt);

                return (
                  <article key={item.id} className={styles.testimonialCard} data-social-proof-reveal>
                    <div className={styles.testimonialHeader}>
                      <div className={styles.author}>
                        <span className={styles.avatar} aria-hidden="true">
                          <FeedbackAvatar item={item} />
                        </span>
                        <div>
                          <strong>{displayName}</strong>
                          {publishedAt && <time dateTime={item.publishedAt}>{publishedAt}</time>}
                        </div>
                      </div>
                      <div className={styles.testimonialRating}>
                        <RatingStars rating={item.rating} label={`${item.rating} trên 5 sao`} />
                        <strong>{item.rating}/5</strong>
                      </div>
                    </div>
                    <blockquote>&ldquo;{item.comment}&rdquo;</blockquote>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <aside className={styles.statsPanel} aria-labelledby="trust-title" data-social-proof-reveal>
          <div className={styles.statsHeading}>
            <span className={styles.eyebrow}>Cộng đồng Nexora</span>
            <h2 id="trust-title">Mỗi con số là một lần chuẩn bị nghiêm túc.</h2>
          </div>

          {platformStats ? (
            <>
              <div className={styles.trustScore} data-social-proof-reveal>
                <strong>{platformStats.averageRating === null ? '—' : `${platformStats.averageRating.toFixed(1)} / 5`}</strong>
                <div>
                  <span className={styles.trustLabel}>Mức độ hài lòng</span>
                  <RatingStars
                    rating={platformStats.averageRating ?? 0}
                    label={platformStats.averageRating === null ? 'Chưa có điểm trung bình' : `${platformStats.averageRating.toFixed(1)} trên 5 sao`}
                  />
                  <span>{formatCount(platformStats.ratingCount)} lượt đánh giá</span>
                </div>
              </div>
              <dl className={styles.metricList}>
                {metrics.map((metric) => (
                  <div key={metric.label} data-social-proof-reveal>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <ul className={styles.proofList}>
              {productProof.map((proof) => (
                <li key={proof} data-social-proof-reveal>
                  <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  {proof}
                </li>
              ))}
            </ul>
          )}

          <Image
            src={NEXORA_MASCOT_ASSETS.testimonials}
            width={768}
            height={768}
            sizes="(max-width: 620px) 160px, 250px"
            alt=""
            aria-hidden="true"
            className={styles.mascot}
          />
        </aside>
      </div>
    </section>
  );
};
