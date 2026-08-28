'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Lỗi hệ thống:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Đã có lỗi xảy ra!</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Chúng tôi đang khắc phục sự cố. Vui lòng thử lại sau.</p>
          <button
            onClick={() => reset()}
            style={{ padding: '10px 20px', background: '#009ca6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
