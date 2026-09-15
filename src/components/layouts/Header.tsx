"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { authApi } from '@/services/authApi';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Tổng quan' },
    { href: '/cv-analysis', label: 'Phân tích CV' },
    { href: '/interview', label: 'Phỏng vấn AI' },
    { href: '/scenario', label: 'Tình huống' },
    { href: '/star', label: 'STAR' },
    { href: '/pricing', label: 'Bảng giá' }
  ];

  const { data: user } = useCurrentUser();
  const isAuthenticated = !!user;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
  
  const initials = userName
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
    
  const planCode = user?.billing?.entitlement?.planCode 
    ? user.billing.entitlement.planCode.charAt(0).toUpperCase() + user.billing.entitlement.planCode.slice(1).toLowerCase() 
    : 'Miễn phí';

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push('/auth');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="nexora-header-wrapper" className="w-full">
      <nav className="fixed top-0 w-full h-16 z-50 bg-surface/80 backdrop-blur-md dark:bg-on-background/80 shadow-sm border-b border-outline-variant/30 dark:border-outline/20">
          <div className="flex justify-between items-center h-16 px-margin-desktop max-w-container-max mx-auto">
              {/* Brand Logo */}
              <Link href="/"><img src="/img/logo.png" alt="Nexora" className="h-10 w-auto" /></Link>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-6">
                  {navLinks.map((link) => {
                      const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                      return (
                          <Link 
                              key={link.href}
                              href={link.href}
                              className={`font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed hover:bg-primary-container/10 dark:hover:bg-primary-fixed/10 rounded-lg px-2 transition-all duration-200 active:scale-95 ${
                                  isActive 
                                      ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary dark:border-primary-fixed pb-1'
                                      : 'text-on-surface-variant dark:text-surface-variant py-1'
                              }`}
                          >
                              {link.label}
                          </Link>
                      );
                  })}
              </div>
              
              {/* Trailing Actions */}
              <div id="nav-slot" className="flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="hidden md:flex items-center gap-3 group relative" ref={dropdownRef}>
                    <button id="user-menu-btn" onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 hover:bg-surface-container-low rounded-xl px-2 py-1 transition-colors">
                        <div className="flex flex-col items-end">
                            <span className="font-label-md text-label-md text-on-surface font-bold">{userName}</span>
                            <span className="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{planCode}</span>
                        </div>
                        <div id="nav-user-avatar" className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold border-2 border-surface-container-high shadow-sm overflow-hidden">{initials}</div>
                    </button>
                    {dropdownOpen && (
                      <div id="user-menu" className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 py-2 z-50">
                          <Link href="/account" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-label-md text-on-surface hover:bg-surface-container-low transition-colors">Quản lý tài khoản</Link>
                          <Link href="/overview" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-label-md text-on-surface hover:bg-surface-container-low transition-colors">Báo cáo của tôi</Link>
                          <Link href="/pricing" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-label-md text-on-surface hover:bg-surface-container-low transition-colors">Nâng cấp gói</Link>
                          <hr className="my-1 border-outline-variant/30" />
                          <button id="logout-btn" onClick={handleLogout} className="w-full text-left px-4 py-2 text-label-md text-error hover:bg-surface-container-low transition-colors">Đăng xuất</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link className="hidden md:block font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
                        href="/auth?mode=login">Đăng nhập</Link>
                    <Link className="hidden md:block bg-primary text-on-primary font-label-md text-label-md px-5 py-2.5 rounded-[12px] hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(53,37,205,0.2)] active:scale-95"
                        href="/auth?mode=register">Đăng ký</Link>
                  </>
                )}
                
                <button id="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden text-on-surface p-2 min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl hover:bg-surface-container-low transition-colors"
                    type="button" aria-label="Mở menu" aria-controls="mobile-menu" aria-expanded={mobileMenuOpen}>
                    <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
              </div>
          </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-40 bg-surface/95 backdrop-blur-md lg:hidden pt-20 px-margin-mobile overflow-y-auto">
            <div className="flex flex-col h-full pb-6">
                <nav className="flex flex-col gap-2 mb-8">
                    {navLinks.map((link) => {
                        const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                        return (
                            <Link 
                                key={link.href}
                                href={link.href} 
                                onClick={() => setMobileMenuOpen(false)} 
                                className={`transition-colors px-4 py-3 font-label-md text-label-md ${
                                    isActive 
                                        ? 'text-primary dark:text-primary-fixed font-bold bg-primary-container/10 dark:bg-primary-fixed/10 rounded-lg' 
                                        : 'text-on-surface-variant hover:text-primary'
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="mt-auto flex flex-col gap-3">
                    {isAuthenticated ? (
                      <button onClick={handleLogout} className="w-full text-error font-label-md text-label-md border border-error/50 rounded-xl px-4 py-3.5 text-center active:bg-error-container/20 transition-colors">Đăng xuất</button>
                    ) : (
                      <>
                        <Link href="/auth?mode=login" onClick={() => setMobileMenuOpen(false)} className="w-full font-label-md text-label-md text-on-surface-variant border border-outline-variant/50 rounded-xl px-4 py-3.5 text-center active:bg-surface-container-low transition-colors">Đăng nhập</Link>
                        <Link href="/auth?mode=register" onClick={() => setMobileMenuOpen(false)} className="w-full bg-primary text-on-primary font-label-md text-label-md rounded-xl px-4 py-3.5 text-center shadow-sm active:scale-95 transition-all">Đăng ký</Link>
                      </>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
