'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Lỗi trang:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Đã có lỗi xảy ra!</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>Rất tiếc, đã có sự cố xảy ra khi tải trang này.</p>
      <button
        onClick={() => reset()}
        style={{ padding: '10px 20px', background: '#009ca6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Thử lại
      </button>
    </div>
  );
}
