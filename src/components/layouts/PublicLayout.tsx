'use client';
import React, { useEffect, useState } from 'react';
import styles from './DashboardLayout.module.css'; // Reuse CSS
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { userApi } from '@/services/userApi';
import { authApi } from '@/services/authApi';
import { SharedSidebar } from './SharedSidebar';

const menuItems = [
  {
    title: 'Tài Khoản Miễn Phí',
    items: [
      {
        name: 'Dashboard (Free)',
        href: '/public',
        icon: (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        )
      },
      {
        name: 'Phân tích CV cơ bản',
        href: '/public/resumes',
        icon: (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'Nâng cấp trải nghiệm',
    items: [
      {
        name: 'Khám phá Gói Cước',
        href: '/plans',
        icon: (
          <svg className={styles.icon} style={{color: '#eab308'}} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      }
    ]
  }
];



export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('Free User');

  useEffect(() => {
    let isMounted = true;
    userApi.getCurrentUser()
      .then(user => {
        if (isMounted && user.email) {
          setUserEmail(user.email);
        }
      })
      .catch(() => {
        // Ignored
      });
    
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth');
  };



  return (
    <div className={styles.container}>
      <SharedSidebar pathname={pathname} userEmail={userEmail} handleLogout={handleLogout} menuItems={menuItems} />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Tài Khoản Miễn Phí</h1>
          <div className={styles.topBar}>
            <Link href="/plans" style={{textDecoration: 'none'}}>
              <button className={styles.actionButton}>
                ⭐ Nâng cấp Premium
              </button>
            </Link>
          </div>
        </header>
        
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
