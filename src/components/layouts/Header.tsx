'use client';
import React from 'react';
import styles from './Header.module.css';
import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Image 
            src="/logo.png" 
            alt="NEXORA" 
            width={150} 
            height={32} 
            className={styles.logoImage} 
            priority
          />
        </div>
        <nav className={styles.nav}>
          <ul>
            <li><a href="#home">Trang chủ</a></li>
            <li><a href="#features">Tính năng</a></li>
            <li><a href="#pricing">Bảng giá</a></li>
            <li><Link href="/">Case Study</Link></li>
            <li><Link href="/">Liên hệ</Link></li>
          </ul>
        </nav>
        
        <div className={styles.ctaGroup}>
          <Link href="/auth" className={styles.loginLink}>Đăng nhập</Link>
          <Link href="/auth?mode=register" className={styles.registerButton}>Đăng ký</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
