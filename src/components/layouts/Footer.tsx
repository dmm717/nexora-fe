import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-outline-variant/40 bg-surface-container-lowest py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
              N
            </div>
            <span className="font-bold text-sm text-on-surface">Nexora AI · Luyện phỏng vấn & Phát triển năng lực</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant">
            <Link href="/#cv-analysis" className="hover:text-primary transition-colors">
              Phân tích CV
            </Link>
            <Link href="/#ai-interview" className="hover:text-primary transition-colors">
              Phỏng vấn AI
            </Link>
            <Link href="/#practice" className="hover:text-primary transition-colors">
              Luyện tập
            </Link>
            <Link href="/#capabilities" className="hover:text-primary transition-colors">
              Năng lực
            </Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">
              Bảng giá
            </Link>
          </div>

          <div className="text-xs text-on-surface-variant text-center md:text-right">
            © {new Date().getFullYear()} Nexora AI. Bản quyền đã được bảo hộ.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
