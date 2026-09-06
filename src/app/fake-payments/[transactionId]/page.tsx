import React from 'react';
import styles from './FakePayment.module.css';
import { handleFakePayment } from '@/app/fake-payments/[transactionId]/actions';

export default async function FakePaymentPage(props: { params: Promise<{ transactionId: string }> }) {
  const params = await props.params;
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h1 className={styles.title}>Cổng thanh toán giả lập</h1>
        <p className={styles.subtitle}>
          (Môi trường Local Development)
        </p>
        <div className={styles.info}>
          <p><strong>Mã giao dịch:</strong> {params.transactionId}</p>
        </div>
        <form action={handleFakePayment}>
          <input type="hidden" name="transactionId" value={params.transactionId} />
          <button type="submit" className={styles.button}>
            Xác nhận thanh toán thành công
          </button>
        </form>
      </div>
    </div>
  );
}
