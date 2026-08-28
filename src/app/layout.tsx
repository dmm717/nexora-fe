import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXORA - Innovating Today Inspiring Tomorrow",
  description: "We deliver intelligent solutions that drive growth, empower businesses, and create lasting impact.",
};

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="light" />
      </body>
    </html>
  );
}
