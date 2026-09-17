'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogIn, Rocket } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { Button } from '@/components/ui/Button';

export interface NavItem {
  label: string;
  href: string;
  sectionId?: string;
}

export const CANONICAL_PUBLIC_NAV: NavItem[] = [
  {
    label: 'Phân tích CV',
    href: '/#cv-analysis',
    sectionId: 'cv-analysis',
  },
  {
    label: 'Phỏng vấn AI',
    href: '/#ai-interview',
    sectionId: 'ai-interview',
  },
  {
    label: 'Luyện tập',
    href: '/#practice',
    sectionId: 'practice',
  },
  {
    label: 'Năng lực',
    href: '/#capabilities',
    sectionId: 'capabilities',
  },
  {
    label: 'Bảng giá',
    href: '/pricing',
    sectionId: 'pricing',
  },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { authReady, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.href === '/pricing') {
      router.push('/pricing');
      return;
    }

    if (pathname === '/') {
      e.preventDefault();
      if (item.sectionId) {
        const el = document.getElementById(item.sectionId);
        if (el) {
          el.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
          });
        }
      }
    } else {
      router.push(`/#${item.sectionId || ''}`);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-surface/90 backdrop-blur-md border-outline-variant/40 py-2.5 shadow-sm'
          : 'bg-surface/60 backdrop-blur-sm border-outline-variant/20 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          aria-label="Nexora AI — Trang chủ"
          className="flex items-center gap-2.5 select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-105">
            N
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-on-surface leading-none">
              Nexora <span className="text-primary font-black">AI</span>
            </div>
            <div className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase mt-0.5">
              Luyện phỏng vấn · Phát triển năng lực
            </div>
          </div>
        </Link>

        {/* Public Desktop Navigation */}
        <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-1">
          {CANONICAL_PUBLIC_NAV.map((item) => {
            const isPricing = item.href === '/pricing' && pathname === '/pricing';
            return (
              <button
                key={item.label}
                type="button"
                onClick={(e) => handleNavClick(e, item)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isPricing
                    ? 'text-primary bg-primary-fixed/40 font-semibold'
                    : 'text-on-surface hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop Auth Status Actions */}
        <div className="hidden lg:flex items-center gap-3" style={{ minHeight: '40px' }}>
          {!authReady ? (
            <div className="w-32 h-9 rounded-full bg-gray-100/70 animate-pulse" aria-hidden="true" />
          ) : isAuthenticated ? (
            <Link
              href="/overview"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary-container text-white hover:bg-primary transition-all shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Vào Dashboard →
            </Link>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/auth')}
                icon={<LogIn size={16} aria-hidden="true" />}
              >
                Đăng nhập
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/auth?mode=register')}
                icon={<Rocket size={16} aria-hidden="true" />}
              >
                Bắt đầu miễn phí
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger & Action */}
        <div className="flex lg:hidden items-center gap-2">
          {!authReady ? (
            <div className="w-20 h-8 rounded-lg bg-gray-100 animate-pulse" aria-hidden="true" />
          ) : isAuthenticated ? (
            <Link
              href="/overview"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white"
            >
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="px-2.5 py-1 text-primary font-semibold text-xs rounded hover:bg-surface-container"
            >
              Đăng nhập
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-menu"
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isMobileMenuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          id="public-mobile-menu"
          role="navigation"
          aria-label="Điều hướng di động"
          className="lg:hidden border-t border-outline-variant/30 bg-white px-4 py-3 space-y-2 shadow-lg"
        >
          {CANONICAL_PUBLIC_NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => {
                handleNavClick(e, item);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-low"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
            {!isAuthenticated && (
              <Button
                variant="primary"
                fullWidth
                size="sm"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/auth?mode=register');
                }}
              >
                Bắt đầu miễn phí
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
