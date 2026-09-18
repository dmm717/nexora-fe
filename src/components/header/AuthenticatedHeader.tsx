'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { CANONICAL_NAV_ITEMS, AVATAR_MENU_ITEMS, type AvatarMenuItem } from '@/config/navigation';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { authApi } from '@/services/authApi';
import { getAvatarColor } from '@/utils/colorUtils';

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
        await authApi.logout();
      } catch {
        // Continue navigation to auth even if logout call fails
      }
      router.push('/auth');
      return;
    }
    if (item.actionKey === 'settings') {
      router.push('/account');
      return;
    }
    if (item.href) {
      router.push(item.href);
      return;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-outline-variant/40 shadow-[0_1px_8px_rgba(15,23,42,0.03)]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo */}
          <Link
            href="/overview"
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-primary/90 transition-colors">
              N
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-on-surface tracking-tight">Nexora</span>
              <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
                AI Coach
              </Badge>
            </div>
          </Link>

          {/* Canonical Desktop Nav Items */}
          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-6 h-16">
            {CANONICAL_NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === '/overview' && (pathname === '/today' || pathname === '/')) ||
                (item.href === '/cv-analysis' && (pathname.startsWith('/cv-analysis') || pathname.startsWith('/resume-analyses') || pathname.startsWith('/resumes'))) ||
                (item.href === '/practice/interview/preflight' && (pathname.startsWith('/interviews/new') || pathname.startsWith('/practice/interview'))) ||
                (item.href === '/practice' && (pathname.startsWith('/practice') || pathname.startsWith('/scenarios') || pathname.startsWith('/star-builder')) && !pathname.startsWith('/practice/interview')) ||
                (item.href === '/progress' && (pathname.startsWith('/progress') || pathname.startsWith('/analytics') || pathname.startsWith('/skill-profile') || pathname.startsWith('/learning-path'))) ||
                (item.href === '/pricing' && (pathname === '/pricing' || pathname === '/billing'));

              // Route map translation:
              // /cv-analysis -> /resume-analyses
              // /practice/interview/preflight -> /interviews/new
              // /progress -> /analytics
              const targetRoute =
                item.href === '/cv-analysis'
                  ? '/resume-analyses'
                  : item.href === '/practice/interview/preflight'
                  ? '/interviews/new'
                  : item.href === '/progress'
                  ? '/analytics'
                  : item.href;

              return (
                <Link
                  key={item.href}
                  href={targetRoute}
                  aria-current={isActive ? 'page' : undefined}
                  className={`h-full flex items-center px-1 text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Active Goal Snapshot & User Profile */}
        <div className="flex items-center gap-3">
          {/* Active Goal Snapshot Pill */}
          {targetRole && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/40">
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
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              aria-controls="account-menu"
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
              aria-label="Tài khoản"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: getAvatarColor(userEmail || userName || 'neutral-user') }}
              >
                {userName ? userName.charAt(0).toUpperCase() : '·'}
              </div>
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

                  {/* Account Navigation Links */}
                  <div className="p-1.5 space-y-0.5">
                    {AVATAR_MENU_ITEMS.map((item) => {
                      // Map destination for production routes:
                      // settings -> /account
                      let resolvedHref = item.href;
                      if (item.actionKey === 'settings') resolvedHref = '/account';

                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="menuitem"
                          onClick={() => handleAvatarAction({ ...item, href: resolvedHref })}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left font-medium cursor-pointer ${
                            item.danger
                              ? 'text-red-700 hover:bg-red-50'
                              : 'text-on-surface hover:bg-surface-container-low'
                          }`}
                        >
                          <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${item.danger ? 'text-red-600' : 'text-on-surface-variant'}`}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    {isAdmin && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push('/admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-on-surface hover:bg-surface-container-low transition-colors text-left font-medium cursor-pointer"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          admin_panel_settings
                        </span>
                        <span>Quản trị hệ thống</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            aria-controls="authenticated-mobile-menu"
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="authenticated-mobile-menu" role="navigation" aria-label="Điều hướng di động" className="md:hidden border-t border-outline-variant/30 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top duration-150 shadow-md">
          {CANONICAL_NAV_ITEMS.map((item) => {
            const targetRoute =
              item.href === '/cv-analysis'
                ? '/resume-analyses'
                : item.href === '/practice/interview/preflight'
                ? '/interviews/new'
                : item.href === '/progress'
                ? '/analytics'
                : item.href;

            const isActive = pathname === targetRoute;

            return (
              <Link
                key={item.href}
                href={targetRoute}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-primary-fixed text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{item.label}</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Link>
            );
          })}
          {targetRole && (
            <div className="pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-2 px-3 py-1">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Mục tiêu: {targetRole}{targetSeniority ? ` · ${targetSeniority}` : ''}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
