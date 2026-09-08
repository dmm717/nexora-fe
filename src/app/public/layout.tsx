import React from 'react';
import PublicLayout from '@/components/layouts/PublicLayout';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';

export default function PublicRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBootstrapProvider>
      <PublicLayout>
        {children}
      </PublicLayout>
    </AuthBootstrapProvider>
  );
}
