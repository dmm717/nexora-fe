'use client';
import React from 'react';
import styles from './AILayout.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.appWrapper}>
      <div className={styles.container}>
        {/* Left Sidebar */}
        <aside className={styles.leftSidebar}>
          <Link href="/dashboard" className={styles.logoLink}>
            <Image src="/logo.png" alt="Nexora" width={128} height={32} style={{ width: 'auto', height: '32px' }} priority />
          </Link>
          
          <div className={styles.searchBox}>
            🔍 Search
          </div>
          
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>🔔 Notification</li>
            <li className={`${styles.menuItem} ${styles.active}`}>🏠 Home</li>
            <li className={styles.menuItem}>👥 Contacts</li>
            <li className={styles.menuItem}>💼 Deals</li>
            <li className={styles.menuItem}>📋 Tasks</li>
            <li className={styles.menuItem}>📊 Reports</li>
            <li className={styles.menuItem}>⚡ Automations</li>
          </ul>

          <div className={styles.userProfile}>
            <div className={styles.avatar}></div>
            <div>
              <div style={{fontWeight: 600, fontSize: '0.9rem'}}>Admin User</div>
              <div style={{fontSize: '0.75rem', color: '#888'}}>Pro Plan</div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={styles.mainContent}>
          <header className={styles.header}>
            <div className={styles.topMenu}>
              <span>Overview</span>
              <span>Analytics</span>
              <span>Sales</span>
              <span>Marketing</span>
              <span>Customers</span>
              <span className={styles.active}>AI Assistant</span>
            </div>
            <div style={{display: 'flex', gap: '1rem'}}>
              <span>⚙️ Settings</span>
              <span>✉️</span>
              <span>👤</span>
            </div>
          </header>
          
          {/* Page Content (Includes Center Chat & Right Timeline) */}
          <div className={styles.pageContent}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
