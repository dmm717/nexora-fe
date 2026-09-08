import DashboardLayout from '@/components/layouts/DashboardLayout';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBootstrapProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthBootstrapProvider>
  );
}
