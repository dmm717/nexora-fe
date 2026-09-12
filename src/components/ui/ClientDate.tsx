/* eslint-disable react-doctor/no-adjust-state-on-prop-change */
'use client';

import React, { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

interface ClientDateProps {
  date: Date | string | number;
  fallback?: React.ReactNode;
  format?: 'datetime' | 'date';
}

export function ClientDate({ date, fallback = '', format = 'datetime' }: ClientDateProps) {
  // Chuẩn Enterprise React 18+: Dùng useSyncExternalStore để tránh lỗi Hydration thay vì useEffect
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  let formattedDate = '';
  try {
    const d = new Date(date);
    if (format === 'date') {
      formattedDate = d.toLocaleDateString('vi-VN');
    } else {
      formattedDate = d.toLocaleString('vi-VN');
    }
  } catch {
    formattedDate = '';
  }

  return <>{formattedDate}</>;
}
