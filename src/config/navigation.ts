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
    href: '/cv-analysis',
    icon: 'document_scanner',
    sectionId: 'cv-analysis',
  },
  {
    label: 'Phỏng vấn AI',
    href: '/practice/interview/preflight',
    icon: 'record_voice_over',
    sectionId: 'interview',
  },
  {
    label: 'Luyện tập',
    href: '/practice',
    icon: 'psychology',
    sectionId: 'practice',
  },
  {
    label: 'Năng lực',
    href: '/progress',
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
  actionKey?: 'profile' | 'billing' | 'settings' | 'privacy' | 'logout';
  danger?: boolean;
}

export const AVATAR_MENU_ITEMS: AvatarMenuItem[] = [
  {
    label: 'Hồ sơ nghề nghiệp',
    href: '/career-profile',
    icon: 'account_circle',
    actionKey: 'profile',
  },
  {
    label: 'Gói & thanh toán',
    href: '/billing',
    icon: 'credit_card',
    actionKey: 'billing',
  },
  {
    label: 'Cài đặt tài khoản',
    icon: 'settings',
    actionKey: 'settings',
  },
  {
    label: 'Đăng xuất',
    icon: 'logout',
    actionKey: 'logout',
    danger: true,
  },
];
