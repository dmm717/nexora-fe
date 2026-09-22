import React from 'react';
import Link from 'next/link';
import { NexoraLogo } from '@/components/brand/NexoraLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-outline-variant/40 bg-surface-container-lowest py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <NexoraLogo alt="Nexora" className="h-6 w-auto object-contain" />
            <span className="hidden text-xs font-medium text-on-surface-variant sm:inline">
              Luyện phỏng vấn &amp; Phát triển năng lực
            </span>
          </div>

          <nav aria-label="Điều hướng cuối trang" className="flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant">
            <Link href="/#cv-analysis" className="rounded-sm hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Phân tích CV
            </Link>
            <Link href="/#ai-interview" className="rounded-sm hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Phỏng vấn AI
            </Link>
            <Link href="/#practice" className="rounded-sm hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Luyện tập
            </Link>
            <Link href="/#capabilities" className="rounded-sm hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Năng lực
            </Link>
            <Link href="/pricing" className="rounded-sm hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Bảng giá
            </Link>
          </nav>

          <div className="text-xs text-on-surface-variant text-center md:text-right">
            © {new Date().getFullYear()} Nexora AI. Bản quyền đã được bảo hộ.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
