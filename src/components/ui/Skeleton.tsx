import type { HTMLAttributes } from 'react';

export type SkeletonProps = Omit<HTMLAttributes<HTMLDivElement>, 'aria-hidden'>;

/** A small, semantic loading surface. Compose its geometry at the call site. */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-md bg-surface-container-high ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
