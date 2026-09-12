import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAvatarColor } from '@/utils/colorUtils';
import styles from './DashboardLayout.module.css'; // Common sidebar styles

export interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SharedSidebarProps {
  pathname: string;
  userEmail: string;
  handleLogout: () => void;
  menuItems: MenuSection[];
}

export const SharedSidebar = ({ pathname, userEmail, handleLogout, menuItems }: SharedSidebarProps) => (
  <aside className={styles.leftSidebar}>
      <Link href="/overview" className={styles.logo}>
        <Image src="/logo.png" alt="Nexora" width={128} height={32} style={{ width: 'auto', height: '32px' }} priority />
      </Link>
    
    {menuItems.map((section) => (
      <div key={section.title} className={styles.menuSection}>
        <div className={styles.menuTitle}>{section.title}</div>
        <ul className={styles.menuList}>
          {section.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`${styles.menuItem} ${pathname === item.href ? styles.active : ''}`} style={{ textDecoration: 'none' }}>
                {item.icon}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))}

    <div className={styles.userProfile} onClick={handleLogout} title="Click to logout" role="button" tabIndex={0} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogout(); } }}>
      <div className={styles.avatar} style={{ backgroundColor: getAvatarColor(userEmail) }}>{userEmail.charAt(0).toUpperCase()}</div>
      <div className={styles.userInfo}>
        <span className={styles.userName}>{userEmail.split('@')[0]}</span>
        <span className={styles.userRole}>Đăng xuất</span>
      </div>
    </div>
  </aside>
);
