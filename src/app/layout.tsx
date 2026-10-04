import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA - Innovating Today Inspiring Tomorrow",
  description: "We deliver intelligent solutions that drive growth, empower businesses, and create lasting impact.",
};

import { Toaster } from 'sonner';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';
import { MaterialSymbolsStyles } from '@/components/providers/MaterialSymbolsStyles';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-nexora',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" translate="no" className="h-full antialiased" data-scroll-behavior="smooth">
      <head>
        <MaterialSymbolsStyles />
      </head>
      <body className={`min-h-full flex flex-col font-sans text-on-surface bg-surface ${jakarta.variable}`}>
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
