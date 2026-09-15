'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './DashboardLayout.module.css';
import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Header />

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
