'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ChevronLeft, CreditCard, LayoutDashboard, Menu, MessageSquare, Package, Users, X, Workflow } from 'lucide-react';

const navigation = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/transactions', label: 'Giao dịch', icon: CreditCard },
  { href: '/admin/plans', label: 'Gói cước', icon: Package },
  { href: '/admin/scenarios', label: 'Kịch bản', icon: Workflow },
  { href: '/admin/feedback', label: 'Phản hồi', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col bg-inverse-surface text-inverse-on-surface">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed"><BarChart3 size={18} /></span>
          Nexora Admin
        </Link>
        <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu"><X size={20} /></button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Điều hướng quản trị">
        {navigation.map((item) => {
          const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${active ? 'bg-primary-fixed text-on-primary-fixed' : 'text-inverse-on-surface/75 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={19} aria-hidden="true" />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/overview" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-inverse-on-surface/75 hover:bg-white/10 hover:text-white">
          <ChevronLeft size={19} aria-hidden="true" />Về ứng dụng
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open && <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Đóng menu quản trị" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-transform lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-outline-variant/60 bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button type="button" className="mr-3 rounded-lg p-2 text-on-surface lg:hidden" onClick={() => setOpen(true)} aria-label="Mở menu quản trị"><Menu size={22} /></button>
          <div>
            <p className="text-sm font-bold text-on-surface">Trung tâm vận hành</p>
            <p className="text-xs text-on-surface-variant">Dữ liệu hệ thống Nexora</p>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
