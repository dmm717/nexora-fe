import type { ReactNode } from 'react';
import Link from 'next/link';

export type AdminSection = 'users' | 'scenarios' | 'plans';

const adminSections: { id: AdminSection; href: string; label: string }[] = [
  { id: 'users', href: '/admin/users', label: 'Người dùng' },
  { id: 'scenarios', href: '/admin/scenarios', label: 'Kịch bản' },
  { id: 'plans', href: '/admin/plans', label: 'Gói cước' },
];

interface AdminPageShellProps {
  active: AdminSection;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({ active, actions, children }: AdminPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            Quản trị hệ thống
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Quản lý người dùng, kịch bản và cấu hình gói dịch vụ.
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      <nav aria-label="Các khu vực quản trị" className="border-b border-outline-variant">
        <ul className="grid grid-cols-3 gap-1 sm:flex sm:gap-2">
          {adminSections.map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id} className="min-w-0">
                <Link
                  href={section.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-t-lg border-b-2 px-2 py-2 text-center text-xs font-semibold transition-colors sm:px-4 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-primary bg-surface-container-low text-primary'
                      : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="truncate">{section.label}</span>
                  {isActive && <span className="sr-only">, đang chọn</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 min-w-0">{children}</div>
    </div>
  );
}
