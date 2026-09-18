import React from 'react';
import Link from 'next/link';
import { UserResponse } from '@/services/userApi';
import { AccountSecurityAsset } from './AccountSecurityAsset';

interface AccountHeaderProps {
  user: UserResponse;
}

function getInitials(displayName?: string | null, email?: string): string {
  if (displayName && displayName.trim().length > 0) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email && email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'NX';
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({ user }) => {
  const initials = getInitials(user.displayName, user.email);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-outline-variant/50">
      <div className="space-y-1.5 max-w-xl">
        <span className="inline-block text-xs font-semibold tracking-wider text-primary uppercase">
          Tài khoản & bảo mật
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Cài đặt tài khoản
        </h1>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Quản lý thông tin cá nhân, bảo mật, gói sử dụng và quyền riêng tư.
        </p>

        {/* Small contextual link to Career Profile */}
        <div className="pt-2">
          <Link
            href="/career-profile"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline group"
          >
            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
            <span>Quản lý CV & Mục tiêu nghề nghiệp trong Hồ sơ nghề nghiệp</span>
          </Link>
        </div>
      </div>

      {/* Identity Summary with Decorative Asset */}
      <div className="flex items-center gap-4 bg-surface-container-low/80 border border-outline-variant/40 rounded-2xl p-3.5 sm:p-4 shadow-subtle flex-shrink-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary-container to-primary text-white font-bold text-base sm:text-lg flex items-center justify-center shadow-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 pr-2">
          <div className="text-sm sm:text-base font-semibold text-on-surface truncate">
            {user.displayName || 'Chưa đặt tên'}
          </div>
          <div className="text-xs text-on-surface-variant truncate" title={user.email}>
            {user.email}
          </div>
        </div>
        <AccountSecurityAsset className="hidden sm:flex ml-auto flex-shrink-0" />
      </div>
    </header>
  );
};
export default AccountHeader;
