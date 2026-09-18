import React from 'react';

interface AccountSecurityAssetProps {
  className?: string;
}

/**
 * Lightweight, vector-only decorative asset representing "personal account + secure identity".
 * Built with semantic design tokens, responsive viewBox, dark-mode compatible, aria-hidden.
 */
export const AccountSecurityAsset: React.FC<AccountSecurityAssetProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Subtle radial gradient for the background shield glow */}
          <radialGradient
            id="accountShieldGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(80 80) rotate(90) scale(70)"
          >
            <stop stopColor="var(--primary, #6366f1)" stopOpacity="0.16" />
            <stop offset="0.7" stopColor="var(--primary, #6366f1)" stopOpacity="0.04" />
            <stop offset="1" stopColor="var(--primary, #6366f1)" stopOpacity="0" />
          </radialGradient>

          {/* Linear gradient for identity circle */}
          <linearGradient
            id="accountIdentityGrad"
            x1="48"
            y1="40"
            x2="112"
            y2="120"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--primary-container, #4f46e5)" />
            <stop offset="1" stopColor="var(--primary, #6366f1)" />
          </linearGradient>
        </defs>

        {/* Ambient Glow */}
        <circle cx="80" cy="80" r="70" fill="url(#accountShieldGlow)" />

        {/* Outer Orbit / Connected Nodes */}
        <circle
          cx="80"
          cy="80"
          r="62"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="text-outline-variant/60"
        />

        {/* Outer security badge/shield frame */}
        <path
          d="M80 22C98 32 120 34 128 40C128 82 110 118 80 138C50 118 32 82 32 40C40 34 62 32 80 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          className="text-primary/40 fill-surface-container-low/80"
        />

        {/* Inner Protective Core */}
        <path
          d="M80 34C94 42 110 44 116 48C116 80 102 108 80 124C58 108 44 80 44 48C50 44 66 42 80 34Z"
          fill="url(#accountShieldGlow)"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          className="text-primary/30"
        />

        {/* Identity Silhouette (Profile + Shoulders) */}
        {/* Head */}
        <circle
          cx="80"
          cy="66"
          r="14"
          fill="url(#accountIdentityGrad)"
          className="shadow-sm"
        />
        {/* Shoulders */}
        <path
          d="M60 100C60 88 69 84 80 84C91 84 100 88 100 100"
          stroke="url(#accountIdentityGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Security Key / Checkmark Node */}
        <g transform="translate(104, 96)">
          <circle
            cx="10"
            cy="10"
            r="12"
            className="fill-surface stroke-primary"
            strokeWidth="2"
          />
          <path
            d="M6 10L9 13L14 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />
        </g>

        {/* AI Context Sparkles / Satellite Nodes */}
        {/* Sparkle 1 (Top Right) */}
        <path
          d="M124 24L125.5 28.5L130 30L125.5 31.5L124 36L122.5 31.5L118 30L122.5 28.5L124 24Z"
          className="fill-primary"
        />

        {/* Sparkle 2 (Left Bottom) */}
        <path
          d="M32 106L33 109L36 110L33 111L32 114L31 111L28 110L31 109L32 106Z"
          className="fill-primary/60"
        />

        {/* Small Connection Nodes */}
        <circle cx="28" cy="64" r="3" className="fill-primary/40" />
        <circle cx="132" cy="72" r="2.5" className="fill-primary/50" />
      </svg>
    </div>
  );
};
export default AccountSecurityAsset;
