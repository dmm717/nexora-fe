import type { ReactNode } from 'react';
export type AdminSection = 'users' | 'scenarios' | 'plans';

const titles: Record<AdminSection, { title: string; description: string }> = {
  users: { title: 'Người dùng', description: 'Quản lý tài khoản, quyền và quyền lợi hiện hành.' },
  plans: { title: 'Gói cước', description: 'Quản lý gói, mức giá và giới hạn tính năng.' },
  scenarios: { title: 'Kịch bản', description: 'Quản lý nội dung luyện tập tình huống.' },
};

interface AdminPageShellProps {
  active: AdminSection;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageShell({ active, actions, children }: AdminPageShellProps) {
  const copy = titles[active];
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">{copy.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {copy.description}
          </p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
