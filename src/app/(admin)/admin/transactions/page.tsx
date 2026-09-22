import { Suspense } from 'react';
import AdminTransactionsScreen from '@/components/features/admin/transactions/AdminTransactionsScreen';

export default function AdminTransactionsPage() {
  return <Suspense fallback={<div className="p-6 text-sm text-on-surface-variant" role="status">Đang tải giao dịch…</div>}><AdminTransactionsScreen /></Suspense>;
}
