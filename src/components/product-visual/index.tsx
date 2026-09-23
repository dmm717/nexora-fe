'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

export type ProductFeature =
  | 'overview'
  | 'cv'
  | 'interview'
  | 'practice'
  | 'scenario'
  | 'star'
  | 'capabilities'
  | 'learning-path'
  | 'career-profile'
  | 'pricing';

export const FEATURE_ARTWORKS: Record<
  ProductFeature,
  { src: string; width: number; height: number; label: string }
> = {
  overview: {
    src: '/assets/features/overview/career-command-center.webp',
    width: 1200,
    height: 800,
    label: 'Mạch bằng chứng tổng quan',
  },
  cv: {
    src: '/assets/features/cv/resume-evidence.webp',
    width: 1200,
    height: 800,
    label: 'Bản đồ đối chiếu CV',
  },
  interview: {
    src: '/assets/features/interview/interview-coaching.webp',
    width: 1200,
    height: 800,
    label: 'Nhịp phỏng vấn',
  },
  practice: {
    src: '/assets/features/practice/practice-hub.webp',
    width: 1200,
    height: 800,
    label: 'Các đường luyện tập',
  },
  scenario: {
    src: '/assets/features/scenario/decision-path.webp',
    width: 1200,
    height: 800,
    label: 'Nhánh tình huống',
  },
  star: {
    src: '/assets/features/star/star-sequence.webp',
    width: 1200,
    height: 800,
    label: 'Cấu trúc STAR',
  },
  capabilities: {
    src: '/assets/features/capabilities/competency-network.webp',
    width: 1200,
    height: 800,
    label: 'Mạng bằng chứng năng lực',
  },
  'learning-path': {
    src: '/assets/features/learning-path/milestone-roadmap.webp',
    width: 1200,
    height: 800,
    label: 'Lộ trình cải thiện',
  },
  'career-profile': {
    src: '/assets/features/career-profile/context-hub.webp',
    width: 1200,
    height: 800,
    label: 'Hồ sơ nghề nghiệp',
  },
  pricing: {
    src: '/assets/features/pricing/access-layers.webp',
    width: 1200,
    height: 800,
    label: 'Các nấc mở rộng',
  },
};

export function FeatureVisual({
  feature,
  className = '',
  priority = false,
}: {
  feature: ProductFeature;
  className?: string;
  priority?: boolean;
}) {
  const asset = FEATURE_ARTWORKS[feature];

  return (
    <div className={`product-feature-visual ${className}`} data-ambient-parallax>
      <Image
        unoptimized
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        priority={priority}
        sizes="(max-width: 900px) 80vw, 34vw"
        aria-hidden="true"
      />
    </div>
  );
}

export function ProductPageHero({
  title,
  description,
  feature,
  className,
  children,
}: {
  title: string;
  description: string;
  feature: ProductFeature;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={`product-page-hero ${className || ''}`.trim()} data-product-intro data-product-reveal>
      <div className="product-page-hero-copy">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
      <FeatureVisual feature={feature} priority className="product-page-hero-art" />
    </section>
  );
}

export function EvidenceCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'positive' | 'attention';
}) {
  return (
    <article className={`product-evidence-card product-evidence-card-${tone}`} data-product-reveal>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </article>
  );
}

export function InsightPanel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <aside className="product-insight-panel" data-product-reveal>
      <div className="product-insight-heading">
        <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
        <strong>{title}</strong>
      </div>
      <div className="product-insight-body">{children}</div>
      {action && <div className="product-insight-action">{action}</div>}
    </aside>
  );
}

export function MotionEmptyState({
  icon = 'query_stats',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="product-motion-empty" data-product-reveal>
      <span className="product-empty-orbit" aria-hidden="true" />
      <span className="material-symbols-outlined product-empty-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function JourneyConnector({ label }: { label: string }) {
  return (
    <div className="product-journey-connector" data-evidence-step>
      <span className="product-journey-line" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
