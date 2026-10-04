export const INTERVIEW_START_PATH = '/interviews/new';

/** Shared desktop/mobile route ownership, including compatibility and detail routes. */
export function isNavigationItemActive(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  const groups: Record<string, string[]> = {
    '/overview': ['/today'],
    '/resume-analyses': ['/resume-analyses', '/resumes', '/cv-analysis/history'],
    [INTERVIEW_START_PATH]: ['/interviews', '/interview', '/ai-interview'],
    '/practice': ['/practice', '/scenarios', '/star-builder'],
    '/analytics': ['/analytics', '/skill-profile', '/learning-path'],
    '/pricing': ['/pricing', '/billing', '/payment-history'],
  };
  return (groups[href] ?? []).some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  sectionId?: string; // For landing page smooth scroll
}

export const CANONICAL_NAV_ITEMS: NavItem[] = [
  {
    label: 'Tổng quan',
    href: '/overview',
    icon: 'dashboard',
    sectionId: 'hero',
  },
  {
    label: 'Phân tích CV',
    href: '/resume-analyses',
    icon: 'document_scanner',
    sectionId: 'cv-analysis',
  },
  {
    label: 'Phỏng vấn AI',
    href: INTERVIEW_START_PATH,
    icon: 'record_voice_over',
    sectionId: 'ai-interview',
  },
  {
    label: 'Luyện tập',
    href: '/practice',
    icon: 'psychology',
    sectionId: 'practice',
  },
  {
    label: 'Năng lực',
    href: '/analytics',
    icon: 'trending_up',
    sectionId: 'capabilities',
  },
  {
    label: 'Bảng giá',
    href: '/pricing',
    icon: 'payments',
    sectionId: 'pricing',
  },
];

export const PUBLIC_NAV_ITEMS: NavItem[] = CANONICAL_NAV_ITEMS
  .filter(item => item.href !== '/overview')
  .map(item => ({ ...item, href: item.href === '/pricing' ? item.href : `/#${item.sectionId}` }));

export interface AvatarMenuItem {
  label: string;
  href?: string;
  icon: string;
  actionKey?: 'logout';
  danger?: boolean;
}

export const AVATAR_MENU_ITEMS: AvatarMenuItem[] = [
  {
    label: 'Hồ sơ',
    href: '/profile',
    icon: 'account_circle',
  },
  {
    label: 'Lịch sử phân tích CV',
    href: '/cv-analysis/history',
    icon: 'history_edu',
  },
  {
    label: 'Lịch sử phỏng vấn',
    href: '/interviews/history',
    icon: 'history',
  },
  {
    label: 'Lịch sử thanh toán',
    href: '/payment-history',
    icon: 'receipt_long',
  },
  {
    label: 'Cài đặt',
    href: '/settings',
    icon: 'settings',
  },
  {
    label: 'Đăng xuất',
    icon: 'logout',
    actionKey: 'logout',
    danger: true,
  },
];
