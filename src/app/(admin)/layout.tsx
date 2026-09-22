import RequireAuth from '@/components/providers/RequireAuth';
import RequireAdmin from '@/components/providers/RequireAdmin';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RequireAdmin>
        <AdminLayout>{children}</AdminLayout>
      </RequireAdmin>
    </RequireAuth>
  );
}
