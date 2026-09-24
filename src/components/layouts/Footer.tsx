'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { NexoraLogo } from '@/components/brand/NexoraLogo';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { siteContentApi } from '@/services/siteContentApi';

export const SITE_SETTINGS_QUERY_KEY = ['public-site-settings'] as const;
const FacebookMark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.6 21v-8.2h2.8l.42-3.2H13.6V7.55c0-.93.27-1.55 1.62-1.55h1.73V3.14A23.5 23.5 0 0 0 14.43 3c-2.5 0-4.22 1.53-4.22 4.35V9.6H7.4v3.2h2.81V21h3.39Z" />
  </svg>
);
const TikTokMark = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="inline-block"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.892-2.891 2.896 2.896 0 0 1 2.892-2.892c.307 0 .604.043.886.124v-3.55a6.34 6.34 0 0 0-.886-.062C5.925 7.292 3 10.217 3 13.781c0 3.565 2.925 6.49 6.488 6.49 3.564 0 6.489-2.925 6.489-6.49V8.898a8.212 8.212 0 0 0 4.612 1.344V6.797a4.81 4.81 0 0 1-1-.111z" />
  </svg>
);

const safeExternal = (value?: string | null) => {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

export const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({ queryKey: SITE_SETTINGS_QUERY_KEY, queryFn: siteContentApi.getSettings, staleTime: 5 * 60_000, retry: 1 });
  const productLinks = [
    ['Phân tích CV', isAuthenticated ? '/resume-analyses' : '/#cv-analysis'],
    ['Phỏng vấn AI', isAuthenticated ? '/interviews/new' : '/#ai-interview'],
    ['Luyện tập', isAuthenticated ? '/practice' : '/#practice'],
    ['Năng lực', isAuthenticated ? '/analytics' : '/#capabilities'],
    ['Bảng giá', '/pricing'],
  ];
  const aboutLinks = [['Giới thiệu', '/about'], ['Điều khoản dịch vụ', '/terms'], ['Chính sách bảo mật', '/privacy']];
  const socials = [
    { label: 'Facebook', url: safeExternal(data?.facebookUrl), icon: FacebookMark },
    { label: 'TikTok', url: safeExternal(data?.tiktokUrl), icon: TikTokMark },
  ];

  return (
    <footer className="site-footer mt-auto border-t border-[#dce4f7] text-[#334166]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] lg:gap-20">
        <div className="space-y-5">
          <Link href="/" className="footer-brand-link inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label="Nexora - Trang chủ">
            <NexoraLogo variant="horizontal" className="h-9 w-auto object-contain" />
          </Link>
          <p className="max-w-sm text-sm leading-7">{data?.brandDescription || 'Luyện phỏng vấn có định hướng, nhận phản hồi bám sát câu trả lời và từng bước cải thiện năng lực.'}</p>
          <div className="space-y-2 text-sm">
            <p className="font-bold text-[#172554]">Liên hệ</p>
            <a className="inline-block break-all text-primary hover:underline" href={`mailto:${data?.contactEmail || 'nexorainterview@gmail.com'}`}>
              {data?.contactEmail || 'nexorainterview@gmail.com'}
            </a>
          </div>
          <div className="flex flex-wrap gap-3" aria-label="Mạng xã hội">
            {socials.map(({ label, url, icon: Icon }) => url ? (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className={`footer-social footer-social--enabled footer-social--${label.toLowerCase()}`}>
                <Icon size={20} />
              </a>
            ) : (
              <span key={label} title={`${label}: Sắp cập nhật`} aria-label={`${label}: Sắp cập nhật`} className="footer-social footer-social--disabled">
                <Icon size={20} />
              </span>
            ))}
          </div>
        </div>
        <nav aria-label="Sản phẩm" className="space-y-4">
          <h2 className="font-bold text-[#172554]">Sản phẩm</h2>
          <ul className="space-y-3 text-sm">{productLinks.map(([label, href]) => <li key={label}><Link href={href} className="hover:text-primary hover:underline">{label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Về Nexora" className="space-y-4">
          <h2 className="font-bold text-[#172554]">Về Nexora</h2>
          <ul className="space-y-3 text-sm">{aboutLinks.map(([label, href]) => <li key={label}><Link href={href} className="hover:text-primary hover:underline">{label}</Link></li>)}</ul>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-[#e9edf7] px-5 py-6 text-xs sm:px-8 md:flex-row md:items-center md:justify-between">
        <span>© {new Date().getFullYear()} Nexora AI. All rights reserved.</span>
        {data?.madeInVietnamEnabled !== false && <span>Made with ♥ in Vietnam 🇻🇳</span>}
        {data?.supportAvailabilityEnabled && data.supportLabel && <span>{data.supportLabel}</span>}
      </div>
    </footer>
  );
};

export default Footer;
