import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  preload: false,
});

export const metadata: Metadata = {
  title: "NEXORA - Innovating Today Inspiring Tomorrow",
  description: "We deliver intelligent solutions that drive growth, empower businesses, and create lasting impact.",
};

import { Toaster } from 'sonner';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" translate="no" className={`${outfit.variable} ${playfair.variable} antialiased`}>
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
