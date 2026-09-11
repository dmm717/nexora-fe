'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

const Header = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Simple entry animation
    gsap.fromTo('.header-anim', 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/cv-analysis', label: 'Phân tích CV' },
    { href: '/interview', label: 'Phỏng vấn AI' },
    { href: '/pricing', label: 'Bảng giá' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled ? 'bg-white/80 backdrop-blur-md border-gray-200 py-3 shadow-sm' : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="header-anim flex items-center">
          {/* Logo */}
          <img src="/logo.png" alt="Nexora Logo" className="h-8 md:h-10 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 header-anim">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                pathname === link.href ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 header-anim">
          <Link 
            href="/auth" 
            className="hidden md:block text-sm font-medium text-gray-900 hover:text-purple-600 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link 
            href="/auth?mode=register" 
            className="text-sm font-medium px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-purple-600 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
