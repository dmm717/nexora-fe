import { Suspense } from 'react';
import AdminDashboardScreen from '@/components/features/admin/dashboard/AdminDashboardScreen';

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-on-surface-variant" role="status">Đang tải dashboard…</div>}>
      <AdminDashboardScreen />
    </Suspense>
  );
}
