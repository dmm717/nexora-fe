'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogIn, Rocket } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { NexoraLogo } from '@/components/brand/NexoraLogo';
import { PUBLIC_NAV_ITEMS, type NavItem } from '@/config/navigation';

export const CANONICAL_PUBLIC_NAV: NavItem[] = PUBLIC_NAV_ITEMS;

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const isMobileMenuOpen = mobileMenuPath === pathname;
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { authReady, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileMenuPath(null);
      mobileMenuButtonRef.current?.focus();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (item.href === '/pricing') return;

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 motion-reduce:transition-none motion-reduce:duration-0 border-b ${
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
          className="flex items-center gap-2.5 select-none rounded-xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <NexoraLogo
            alt=""
            className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] sm:h-9"
          />
          <div className="hidden sm:block">
            <div className="text-[9px] text-on-surface-variant/80 font-medium tracking-wide mt-0.5">
              Chuẩn bị nghề nghiệp có định hướng
            </div>
          </div>
        </Link>

        {/* Public Desktop Navigation */}
        <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-1">
          {CANONICAL_PUBLIC_NAV.map((item) => {
            const isPricing = item.href === '/pricing' && pathname === '/pricing';
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                aria-current={isPricing ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isPricing
                    ? 'text-primary bg-primary-fixed/40 font-semibold'
                    : 'text-on-surface hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth Status Actions */}
        <div className="hidden lg:flex items-center gap-3" style={{ minHeight: '40px' }}>
          {!authReady ? (
            <Skeleton className="w-32 h-9 rounded-full" />
          ) : isAuthenticated ? (
            <Link
              href="/overview"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary-container text-white hover:bg-primary transition-all shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Vào Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <LogIn size={16} aria-hidden="true" />
                Đăng nhập
              </Link>
              <Link
                href="/auth?mode=register"
                className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Rocket size={16} aria-hidden="true" />
                Bắt đầu miễn phí
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger & Action */}
        <div className="flex lg:hidden items-center gap-2">
          {!authReady ? (
            <Skeleton className="w-20 h-8 rounded-lg" />
          ) : isAuthenticated ? (
            <Link
              href="/overview"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth"
              className="inline-flex min-h-9 items-center rounded px-2.5 py-1 text-primary font-semibold text-xs hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Đăng nhập
            </Link>
          )}

          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setMobileMenuPath(isMobileMenuOpen ? null : pathname)}
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
        <nav
          id="public-mobile-menu"
          aria-label="Điều hướng di động"
          className="lg:hidden border-t border-outline-variant/30 bg-white px-4 py-3 space-y-2 shadow-lg"
        >
          {CANONICAL_PUBLIC_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => {
                handleNavClick(e, item);
                setMobileMenuPath(null);
              }}
              aria-current={item.href === '/pricing' && pathname === '/pricing' ? 'page' : undefined}
              className="block w-full px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
            {!isAuthenticated && (
              <Link
                href="/auth?mode=register"
                onClick={() => setMobileMenuPath(null)}
                className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Rocket size={16} aria-hidden="true" />
                Bắt đầu miễn phí
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
