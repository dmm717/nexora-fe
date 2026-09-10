'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { authApi } from '@/services/authApi';
import { getAvatarColor } from '@/utils/colorUtils';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
  },
  {
    name: 'Mục tiêu nghề nghiệp',
    href: '/dashboard/career-goals',
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { data: user } = useCurrentUser();
  const userEmail = user?.email || 'User';
  const planCode = user?.billing?.entitlement?.planCode 
    ? user.billing.entitlement.planCode.charAt(0).toUpperCase() + user.billing.entitlement.planCode.slice(1).toLowerCase() 
    : 'Free';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(`.${styles.userProfileWrapper}`)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);



  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth');
  };



  return (
    <div className={styles.container}>
      {/* Top Navigation (Header) */}
      <nav className={styles.topNavigation}>
        <div className={styles.navContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <Image src="/logo.png" alt="Nexora" width={128} height={32} style={{ width: 'auto', height: '32px' }} priority />
            </Link>
            
            {/* Center Menu */}
            <div className={styles.menuContainer}>
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
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
            <button 
              className={styles.actionButton} 
              onClick={() => router.push('/dashboard/interviews/new')}
            >
              Bắt đầu phỏng vấn
            </button>
            
            <div className={styles.userProfileWrapper}>
              <div 
                className={styles.userProfile} 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                title="Tài khoản"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDropdownOpen(!dropdownOpen);
                  }
                }}
              >
                <div className={styles.avatar} style={{ position: 'relative', backgroundColor: getAvatarColor(userEmail) }}>
                  {userEmail.charAt(0).toUpperCase()}
                  <span style={{ 
                    position: 'absolute', 
                    bottom: '-4px', 
                    right: '-10px', 
                    fontSize: '0.55rem', 
                    fontWeight: 800, 
                    color: '#ffffff', 
                    background: planCode.toLowerCase() === 'free' ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                    padding: '0.15rem 0.35rem', 
                    borderRadius: '999px', 
                    boxShadow: planCode.toLowerCase() === 'free' ? '0 1px 2px rgba(0,0,0,0.1)' : '0 2px 4px rgba(139, 92, 246, 0.4)',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    border: '1.5px solid #ffffff'
                  }}>
                    {planCode}
                  </span>
                </div>
              </div>
              
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownEmail}>{userEmail}</div>
                    <div className={styles.dropdownPlan} style={{ display: 'flex', alignItems: 'center', marginTop: '0.35rem' }}>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: '#ffffff', 
                        background: planCode.toLowerCase() === 'free' ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '999px', 
                        boxShadow: planCode.toLowerCase() === 'free' ? '0 1px 2px rgba(0,0,0,0.1)' : '0 2px 4px rgba(139, 92, 246, 0.4)',
                        textTransform: 'uppercase',
                        lineHeight: 1
                      }}>
                        {planCode}
                      </span>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <button 
                    className={styles.dropdownItem} 
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/dashboard/account');
                    }}
                  >
                    Cài đặt tài khoản
                  </button>
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

          
          {/* Page Content */}
          <div className={styles.pageContent}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
