'use client';

import { usePathname } from 'next/navigation';
import { useRef, type ReactNode } from 'react';
import { useProductMotion } from './index';

export function ProductMotionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  useProductMotion(rootRef, pathname);

  return (
    <div ref={rootRef} className="product-motion-boundary" data-product-page>
      {children}
    </div>
  );
}
