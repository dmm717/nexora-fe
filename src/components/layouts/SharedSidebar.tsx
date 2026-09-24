import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
  avatarUrl?: string | null;
  displayName?: string | null;
  handleLogout: () => void;
  menuItems: MenuSection[];
}

export const SharedSidebar = ({ pathname, userEmail, avatarUrl, displayName, handleLogout, menuItems }: SharedSidebarProps) => (
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
      <UserAvatar avatarUrl={avatarUrl} displayName={displayName} email={userEmail} className={styles.avatar} decorative />
      <div className={styles.userInfo}>
        <span className={styles.userName}>{userEmail.split('@')[0]}</span>
        <span className={styles.userRole}>Đăng xuất</span>
      </div>
    </div>
  </aside>
);
