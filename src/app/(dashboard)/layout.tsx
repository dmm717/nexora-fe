import DashboardLayout from '@/components/layouts/DashboardLayout';
import RequireAuth from '@/components/providers/RequireAuth';
import RealtimeProvider from '@/components/providers/RealtimeProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RealtimeProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </RealtimeProvider>
    </RequireAuth>
  );
}
