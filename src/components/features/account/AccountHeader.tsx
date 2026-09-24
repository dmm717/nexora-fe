import React from 'react';
import Link from 'next/link';
import { UserResponse } from '@/services/userApi';
import { AccountSecurityAsset } from './AccountSecurityAsset';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface AccountHeaderProps {
  user: UserResponse;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({ user }) => {

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
      <div className="flex items-center gap-4 bg-surface-container-low/80 border border-outline-variant/40 rounded-2xl p-3.5 sm:p-4 shadow-subtle min-w-0 max-w-full">
        <UserAvatar avatarUrl={user.avatarUrl} displayName={user.displayName} email={user.email} className="w-12 h-12 sm:w-14 sm:h-14 text-base" decorative />
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
