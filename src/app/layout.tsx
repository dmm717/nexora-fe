import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA - Innovating Today Inspiring Tomorrow",
  description: "We deliver intelligent solutions that drive growth, empower businesses, and create lasting impact.",
};

import { Toaster } from 'sonner';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
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
