import type { ReactNode } from 'react';

interface AdminTableShellProps {
  children: ReactNode;
  minWidthClass?: string;
}

export function AdminTableShell({ children, minWidthClass = 'min-w-[720px]' }: AdminTableShellProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-white shadow-subtle">
      <table className={`w-full ${minWidthClass} border-collapse text-left text-sm`}>
        {children}
      </table>
    </div>
  );
}
