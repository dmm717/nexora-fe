'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { userApi } from '@/services/userApi';
import { authApi } from '@/services/authApi';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('User');
  const [planCode, setPlanCode] = useState('Free');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(`.${styles.userProfileWrapper}`)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    userApi.getCurrentUser()
      .then(user => {
        if (isMounted) {
          if (user.email) setUserEmail(user.email);
          const currentPlan = user.billing?.entitlement?.planCode;
          setPlanCode(currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).toLowerCase() : 'Free');
        }
      })
      .catch(() => {
        // Ignored, apiClient handles 401
      });
    
    return () => { isMounted = false; };
  }, [pathname]);

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth');
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
    },
    {
      name: 'Luyện tập',
      href: '/dashboard/interviews',
    },
    {
      name: 'Phân tích CV',
      href: '/dashboard/resumes',
    },
    {
      name: 'Tình huống & STAR',
      href: '/dashboard/scenarios',
    },
    {
      name: 'Gói cước',
      href: '/dashboard/billing',
    },
    {
      name: 'Trạng thái',
      href: '/status',
    }
  ];

  return (
    <div className={styles.container}>
      {/* Top Navigation (Header) */}
      <nav className={styles.topNavigation}>
        <div className={styles.navContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <Image src="/logo.png" alt="Nexora" width={112} height={28} style={{ objectFit: 'contain' }} priority />
            </Link>
            
            {/* Center Menu */}
            <div className={styles.menuContainer}>
              {navItems.map((item, i) => (
                <Link 
                  key={i} 
                  href={item.href} 
                  className={`${styles.menuItem} ${pathname === item.href ? styles.active : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section (User) */}
          <div className={styles.rightSection}>
            <div className={styles.userProfileWrapper}>
              <div 
                className={styles.userProfile} 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                title="Tài khoản"
              >
                <div className={styles.avatar}>
                  {userEmail.charAt(0).toUpperCase()}
                </div>
              </div>
              
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownEmail}>{userEmail}</div>
                    <div className={styles.dropdownPlan}>Gói: {planCode}</div>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <button 
                    className={styles.dropdownItem} 
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/dashboard/billing');
                    }}
                  >
                    Nâng cấp gói cước
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${styles.dangerItem}`}
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>Dashboard 
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ffffff', marginLeft: '0.75rem', background: planCode.toLowerCase() === 'free' ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', padding: '0.3rem 0.75rem', borderRadius: '999px', verticalAlign: 'middle', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: planCode.toLowerCase() === 'free' ? 'none' : '0 4px 6px -1px rgba(139, 92, 246, 0.3)' }}>
                {planCode}
              </span>
            </h1>
            <button className={styles.actionButton} onClick={() => router.push('/dashboard/interviews')}>Bắt đầu phỏng vấn</button>
          </header>
          
          {/* Page Content */}
          <div className={styles.pageContent}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
