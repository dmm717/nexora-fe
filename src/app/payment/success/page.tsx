import { Suspense } from 'react';
import PaymentResultPage, { PaymentResultFallback } from '@/components/features/payment/PaymentResultPage';

export const metadata = {
  title: 'Xác nhận thanh toán - Nexora AI',
  description: 'Kiểm tra trạng thái thanh toán của bạn với Nexora AI.',
};

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentResultFallback />}>
      <PaymentResultPage mode="success" />
    </Suspense>
  );
}
