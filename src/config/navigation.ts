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
    href: '/interviews/new',
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

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    label: 'Phân tích CV',
    href: '/#cv-analysis',
    icon: 'document_scanner',
    sectionId: 'cv-analysis',
  },
  {
    label: 'Phỏng vấn AI',
    href: '/#ai-interview',
    icon: 'record_voice_over',
    sectionId: 'ai-interview',
  },
  {
    label: 'Luyện tập',
    href: '/#practice',
    icon: 'psychology',
    sectionId: 'practice',
  },
  {
    label: 'Năng lực',
    href: '/#capabilities',
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
