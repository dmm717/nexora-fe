'use client';
import React, { useEffect, useState } from 'react';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { userApi } from '@/services/userApi';
import { authApi } from '@/services/authApi';
import { getAvatarColor } from '@/utils/colorUtils';
import { SharedSidebar } from './SharedSidebar';

const menuItems = [
  {
    title: 'Quản Trị Hệ Thống',
    items: [
      {
        name: 'Tổng quan Admin',
        href: '/admin',
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
        name: 'Quản lý Người dùng',
        href: '/admin/users',
        icon: (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      },
      {
        name: 'Quản lý Gói cước',
        href: '/admin/plans',
        icon: (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'Hệ thống',
    items: [
      {
        name: 'Trạng thái Server',
        href: '/status',
        icon: (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )
      }
    ]
  }
];



export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('Admin');

  useEffect(() => {
    let isMounted = true;
    userApi.getCurrentUser()
      .then(user => {
        if (isMounted) {
          if (user.email) setUserEmail(user.email);
          if (!user.roles?.includes('Admin')) {
            // Optional: redirect non-admin users away
            // router.push('/dashboard');
          }
        }
      })
      .catch(() => {
        // Ignored
      });
    
    return () => { isMounted = false; };
  }, [router]);

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth');
  };



  return (
    <div className={styles.container}>
      <SharedSidebar pathname={pathname} userEmail={userEmail} handleLogout={handleLogout} menuItems={menuItems} />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Admin Panel</h1>
          <div className={styles.topBar}>
            <span style={{color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px', marginRight: '20px'}}>
              Khu vực quản trị
            </span>
            <button className={styles.actionButton}>Cài đặt hệ thống</button>
          </div>
        </header>
        
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
