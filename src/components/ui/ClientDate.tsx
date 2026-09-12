/* eslint-disable react-doctor/no-adjust-state-on-prop-change */
'use client';

import React, { useEffect, useState } from 'react';

interface ClientDateProps {
  date: Date | string | number;
  fallback?: React.ReactNode;
  format?: 'datetime' | 'date';
}

export function ClientDate({ date, fallback = '', format = 'datetime' }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      const d = new Date(date);
      if (format === 'date') {
        setFormattedDate(d.toLocaleDateString('vi-VN'));
      } else {
        setFormattedDate(d.toLocaleString('vi-VN'));
      }
    } catch {
      setFormattedDate('');
    }
  }, [date, format]);

  if (formattedDate === null) {
    return <>{fallback}</>;
  }

  return <>{formattedDate}</>;
}
