'use client';

import { useEffect, useState } from 'react';

/** Rendering policy only: SSR always has a complete, stable image fallback. */
export function useVisualPolicy() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string; addEventListener?: (type: string, listener: () => void) => void; removeEventListener?: (type: string, listener: () => void) => void };
    };
    const update = () => setAllowed(!reduced.matches && !device.connection?.saveData
      && device.connection?.effectiveType !== '2g'
      && (device.deviceMemory === undefined || device.deviceMemory > 2));
    update();
    reduced.addEventListener('change', update);
    device.connection?.addEventListener?.('change', update);
    return () => {
      reduced.removeEventListener('change', update);
      device.connection?.removeEventListener?.('change', update);
    };
  }, []);
  return allowed;
}
