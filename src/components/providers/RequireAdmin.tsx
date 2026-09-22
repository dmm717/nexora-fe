'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/hooks/queries/useUser';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const userQuery = useCurrentUser();

  if (userQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          Đang xác minh quyền quản trị…
        </div>
      </div>
    );
  }

  const isAdmin = userQuery.data?.roles.some((role) => role.toLowerCase() === 'admin') ?? false;
  if (userQuery.isError || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-5">
        <section className="max-w-md rounded-2xl border border-outline-variant bg-white p-8 text-center shadow-card" role="alert">
          <ShieldAlert className="mx-auto h-10 w-10 text-error" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-on-surface">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Khu vực này chỉ dành cho quản trị viên Nexora.
          </p>
          <Link href="/overview" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary">
            Về ứng dụng
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
