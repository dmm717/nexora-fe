'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { NavigationMenu } from './NavigationMenu';
import { Badge } from '@/components/ui/Badge';
import { NavigationFrame, NavigationRow, NavigationBrand } from './NavigationFrame';
import { CANONICAL_NAV_ITEMS, AVATAR_MENU_ITEMS, isNavigationItemActive, type AvatarMenuItem } from '@/config/navigation';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { authApi } from '@/services/authApi';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { toast } from 'sonner';

export interface AuthenticatedHeaderProps {
  targetRole?: string | null;
  targetSeniority?: string | null;
  userName?: string;
  userEmail?: string;
}

export const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({
  targetRole: propTargetRole,
  targetSeniority: propTargetSeniority,
  userName: propUserName,
  userEmail: propUserEmail,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!userMenuOpen && !mobileMenuOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      (userMenuOpen ? accountTrigger : mobileTrigger).current?.focus();
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [userMenuOpen, mobileMenuOpen]);

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: careerProfile } = useCareerProfile();

  const userEmail = propUserEmail || user?.email || '';
  const userName =
    propUserName ||
    careerProfile?.profile?.displayName ||
    user?.displayName ||
    (userEmail ? userEmail.split('@')[0] : '') ||
    (userLoading ? '' : 'Ứng viên');

  const activeGoal = careerProfile?.activeCareerGoal;
  const targetRole = propTargetRole !== undefined ? propTargetRole : activeGoal?.targetRole;
  const targetSeniority = propTargetSeniority !== undefined ? propTargetSeniority : activeGoal?.seniority;

  const planCode = user?.billing?.entitlement?.planCode?.toUpperCase() || null;

  const isAdmin = user?.roles?.some((role) => role.toLowerCase() === 'admin') || false;

  const handleAvatarAction = async (item: AvatarMenuItem) => {
    setUserMenuOpen(false);
    if (item.actionKey === 'logout') {
      try {
        const result = await authApi.logout();
        if (!result.serverLogoutSucceeded) {
          toast.warning('Không thể xác nhận đăng xuất với máy chủ. Phiên trên thiết bị này đã được xóa.');
        }
      } catch {
        toast.warning('Không thể xác nhận đăng xuất với máy chủ. Phiên trên thiết bị này đã được xóa.');
      }
      router.push('/auth');
      return;
    }
    if (item.href) {
      router.push(item.href);
      return;
    }
  };

  return (
    <NavigationFrame variant="product">
      <NavigationRow>
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo */}
          <NavigationBrand
            className="flex items-center gap-2.5 group text-left"
          >
            <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
              AI Coach
            </Badge>
          </NavigationBrand>

          {/* Canonical Desktop Nav Items */}
          <NavigationMenu items={CANONICAL_NAV_ITEMS}
            isActive={item => isNavigationItemActive(item.href, pathname)} />
        </div>

        {/* Right: Active Goal Snapshot & User Profile */}
        <div className="flex items-center gap-3">
          {/* Active Goal Snapshot Pill */}
          {targetRole && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-on-surface-variant font-medium">Mục tiêu:</span>
              <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
                {targetRole}{targetSeniority ? ` · ${targetSeniority}` : ''}
              </span>
            </div>
          )}

          {/* User Account Avatar Dropdown */}
          <div className="relative">
            <button
              ref={accountTrigger}
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-controls="account-menu"
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
              aria-label="Tài khoản"
            >
              <UserAvatar avatarUrl={user?.avatarUrl} displayName={userName} email={userEmail} className="w-8 h-8 text-xs" decorative />
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-on-surface-variant hidden sm:inline">
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div id="account-menu" role="menu" aria-label="Menu tài khoản" className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-floating border border-outline-variant/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-outline-variant/30">
                    <p className="text-xs text-on-surface-variant">Tài khoản đang đăng nhập</p>
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {userName || 'Đang tải thông tin tài khoản...'}
                    </p>
                    {userEmail && <p className="text-xs text-on-surface-variant truncate mt-0.5">{userEmail}</p>}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {planCode && <Badge variant="primary" size="sm">
                        Gói {planCode}
                      </Badge>}
                      {isAdmin && (
                        <Badge variant="secondary" size="sm">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Account and archive navigation */}
                  <div className="p-1.5 space-y-0.5">
                    {AVATAR_MENU_ITEMS.map((item) => {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="menuitem"
                          onClick={() => handleAvatarAction(item)}
                          data-menu-group={item.href?.includes('history') ? 'history' : item.actionKey === 'logout' ? 'sign-out' : 'account'}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left font-medium cursor-pointer ${
                            item.danger
                              ? 'text-red-700 hover:bg-red-50'
                              : 'text-on-surface hover:bg-surface-container-low'
                          } ${item.href === '/cv-analysis/history' || item.href === '/settings' ? 'border-t border-outline-variant/40 mt-1.5 pt-3' : ''}`}
                        >
                          <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${item.danger ? 'text-red-600' : 'text-on-surface-variant'}`}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            ref={mobileTrigger}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            aria-controls="authenticated-mobile-menu"
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </NavigationRow>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="authenticated-mobile-menu" className="lg:hidden border-t border-outline-variant/30 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top duration-150 shadow-md">
          <NavigationMenu mobile items={CANONICAL_NAV_ITEMS}
            isActive={item => isNavigationItemActive(item.href, pathname)}
            onNavigate={() => setMobileMenuOpen(false)} />
          {targetRole && (
            <div className="pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-2 px-3 py-1">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Mục tiêu: {targetRole}{targetSeniority ? ` · ${targetSeniority}` : ''}</span>
            </div>
          )}
        </div>
      )}
    </NavigationFrame>
  );
};
