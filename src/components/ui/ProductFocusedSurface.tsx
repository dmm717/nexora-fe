import React from 'react';

export interface ProductFocusedSurfaceProps {
  theme?: 'interview' | 'light';
  children: React.ReactNode;
  className?: string;
}

export const ProductFocusedSurface: React.FC<ProductFocusedSurfaceProps> = ({
  theme = 'interview',
  children,
  className = '',
}) => {
  const themeClass =
    theme === 'interview'
      ? 'product-focused-surface bg-[#10182f] text-[#f3f5ff]'
      : 'bg-surface text-on-surface';

  return (
    <div className={`w-full transition-colors duration-200 ${themeClass} ${className}`}>
      {children}
    </div>
  );
};

export default ProductFocusedSurface;
