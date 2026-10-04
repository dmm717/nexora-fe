import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { NexoraLogo } from '@/components/brand/NexoraLogo';

export function NavigationFrame({ variant, className = '', ...props }: HTMLAttributes<HTMLElement> & {
  variant: 'cinematic' | 'public' | 'product' | 'focused';
}) {
  return <header data-nexora-header={variant} data-cinematic={variant === 'cinematic' ? 'true' : undefined}
    className={`nexora-navigation ${className}`} {...props} />;
}

export function NavigationRow({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-navigation-row className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 ${className}`} {...props} />;
}

export function NavigationBrand({ children, ...props }: { children?: ReactNode } & Omit<React.ComponentProps<typeof Link>, 'href'>) {
  return <Link href="/" aria-label="Nexora — Trang chủ" className="nexora-navigation-brand flex shrink-0 items-center gap-2.5" {...props}>
    <NexoraLogo variant="horizontal" eager alt="" className="h-8 w-auto object-contain" />
    {children}
  </Link>;
}
