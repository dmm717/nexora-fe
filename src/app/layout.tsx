import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA - Innovating Today Inspiring Tomorrow",
  description: "We deliver intelligent solutions that drive growth, empower businesses, and create lasting impact.",
};

import { Toaster } from 'sonner';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" translate="no" className="antialiased">
      <body className="min-h-full flex flex-col">
        <ReactQueryProvider>
          <AuthBootstrapProvider>
            {children}
          </AuthBootstrapProvider>
          <Toaster position="bottom-right" richColors />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
