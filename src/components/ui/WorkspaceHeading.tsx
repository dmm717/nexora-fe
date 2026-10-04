import type { ReactNode } from 'react';
import { FeatureVisual, type ProductFeature } from '@/components/product-visual';

export function WorkspaceHeading({ title, description, eyebrow, actions, feature = 'overview', className = '' }: {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  feature?: ProductFeature;
  className?: string;
}) {
  return <header className={`product-page-hero nexora-workspace-heading ${className}`} data-product-intro>
    <div className="product-page-hero-copy">
      {eyebrow && <p className="nexora-workspace-label">{eyebrow}</p>}
      <h1>{title}</h1>
      <p className="nexora-workspace-description">{description}</p>
      {actions && <div className="nexora-workspace-actions">{actions}</div>}
    </div>
    <FeatureVisual feature={feature} priority className="product-page-hero-art" />
  </header>;
}
