'use client';
import React from 'react';
import styles from './DashboardLayout.module.css';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      {/* Left Sidebar */}
      <aside className={styles.leftSidebar}>
        <div className={styles.logo}>Nexora</div>
        
        <div className={styles.menuSection}>
          <div className={styles.menuTitle}>AI Tools</div>
          <ul className={styles.menuList}>
            <Link href="/ai" style={{ textDecoration: 'none' }}>
              <li className={styles.menuItem}>✨ AI Assistant</li>
            </Link>
          </ul>
        </div>

        <div className={styles.menuSection}>
          <div className={styles.menuTitle}>Analytics</div>
          <ul className={styles.menuList}>
            <li className={`${styles.menuItem} ${styles.active}`}>Get Leads</li>
            <li className={styles.menuItem}>X-Ray</li>
            <li className={styles.menuItem}>Mercury</li>
          </ul>
        </div>

        <div className={styles.menuSection}>
          <div className={styles.menuTitle}>Content</div>
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>My Account</li>
            <li className={styles.menuItem}>Analytics</li>
            <li className={styles.menuItem}>Inbox</li>
            <li className={styles.menuItem}>My Automations</li>
            <li className={styles.menuItem}>Templates</li>
          </ul>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Home</h1>
          <div className={styles.topBar}>
            <input type="text" aria-label="Search" placeholder="Search" className={styles.searchBar} />
            <button className={styles.actionButton}>+ Automation</button>
          </div>
        </header>
        
        {/* Page Content */}
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={styles.rightSidebar}>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>Unicorn Inbox</div>
          <span style={{fontSize: '0.8rem', color: '#888'}}>All ▾</span>
        </div>
        <div className={styles.inboxList}>
          {/* Mockup inbox items */}
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              background: '#fff', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{fontWeight: 600, fontSize: '0.9rem'}}>User Name {i}</div>
              <div style={{fontSize: '0.8rem', color: '#888', marginTop: '0.25rem'}}>Online • I am leaving tomorrow...</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
