'use client';

import { useState } from 'react';
import { resolveApiAssetUrl } from '@/services/apiClient';
import { getAvatarColor } from '@/utils/colorUtils';

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  className?: string;
  decorative?: boolean;
}

export function UserAvatar({ avatarUrl, displayName, email, className = '', decorative = false }: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const resolvedUrl = resolveApiAssetUrl(avatarUrl);
  const name = displayName?.trim() || email?.split('@')[0] || 'Người dùng Nexora';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-white font-semibold ${className}`}
      style={{ backgroundColor: getAvatarColor(email || name) }}
    >
      {resolvedUrl && failedUrl !== resolvedUrl ? (
        // The configured API origin is dynamic; Next Image host allowlisting is not appropriate here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedUrl}
          alt={decorative ? '' : `Ảnh đại diện của ${name}`}
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(resolvedUrl)}
          referrerPolicy="no-referrer"
        />
      ) : initials}
    </span>
  );
}
