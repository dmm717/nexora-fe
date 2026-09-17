import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white border border-dashed border-outline-variant overflow-hidden ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute w-36 h-36 rounded-full border border-primary/10 animate-float-slow pointer-events-none"
      />
      {icon && (
        <div className="mb-3 text-primary z-10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <strong className="text-base sm:text-lg font-bold text-on-surface mb-1.5 z-10">
        {title}
      </strong>
      <p className="max-w-md text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-4 z-10">
        {description}
      </p>
      {action && <div className="z-10 mt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;
