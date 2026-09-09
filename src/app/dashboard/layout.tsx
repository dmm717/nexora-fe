import DashboardLayout from '@/components/layouts/DashboardLayout';
import AuthBootstrapProvider from '@/components/providers/AuthBootstrapProvider';
import RealtimeProvider from '@/components/providers/RealtimeProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBootstrapProvider>
      <RealtimeProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </RealtimeProvider>
    </AuthBootstrapProvider>
  );
}
