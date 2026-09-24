import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

export function PublicSiteShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-[#f5f7ff]"><Header /><main className="flex-1 pt-16">{children}</main><Footer /></div>;
}
