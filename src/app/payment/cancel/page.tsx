import { Suspense } from 'react';
import PaymentResultPage, { PaymentResultFallback } from '@/components/features/payment/PaymentResultPage';

export const metadata = {
  title: 'Thanh toán đã bị hủy - Nexora AI',
  description: 'Giao dịch thanh toán Nexora AI chưa được hoàn tất.',
};

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResultPage mode="cancel" />
    </Suspense>
  );
}
