import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBootstrapProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AuthBootstrapProvider>
  );
}
