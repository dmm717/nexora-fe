import Image from 'next/image';
import { NEXORA_BRAND_ASSETS } from '@/config/brandAssets';

interface NexoraLogoProps {
  className?: string;
  variant?: 'horizontal' | 'stacked';
  alt?: string;
}

const LOGO_DIMENSIONS = {
  horizontal: { width: 607, height: 197 },
  stacked: { width: 389, height: 273 },
} as const;

export function NexoraLogo({
  className,
  variant = 'horizontal',
  alt = 'Nexora',
}: NexoraLogoProps) {
  const dimensions = LOGO_DIMENSIONS[variant];

  return (
    <Image
      src={NEXORA_BRAND_ASSETS[variant]}
      width={dimensions.width}
      height={dimensions.height}
      alt={alt}
      className={className}
      sizes={variant === 'horizontal' ? '(max-width: 640px) 112px, 132px' : '144px'}
    />
  );
}
