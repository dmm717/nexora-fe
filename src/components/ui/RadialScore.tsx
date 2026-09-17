import React from 'react';

export interface RadialScoreProps {
  score: number | null; // null if insufficient evidence
  size?: 'sm' | 'md' | 'lg' | number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const RadialScore: React.FC<RadialScoreProps> = ({
  score,
  size = 'md',
  strokeWidth,
  label,
  sublabel,
  className = '',
}) => {
  const sizeConfig = {
    sm: { dimension: 64, stroke: 5, fontSize: 'text-lg', labelSize: 'text-[10px]' },
    md: { dimension: 96, stroke: 7, fontSize: 'text-2xl', labelSize: 'text-xs' },
    lg: { dimension: 128, stroke: 9, fontSize: 'text-3xl', labelSize: 'text-sm' },
  };

  let dimension = 96;
  let stroke = 7;
  let fontSize = 'text-2xl';
  let labelSize = 'text-xs';

  if (typeof size === 'number') {
    dimension = size;
    stroke = strokeWidth || Math.round(size / 12);
    fontSize = size > 110 ? 'text-3xl' : 'text-xl';
    labelSize = 'text-xs';
  } else if (size in sizeConfig) {
    dimension = sizeConfig[size].dimension;
    stroke = strokeWidth || sizeConfig[size].stroke;
    fontSize = sizeConfig[size].fontSize;
    labelSize = sizeConfig[size].labelSize;
  }

  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;

  const getScoreColor = (val: number | null) => {
    if (val === null) return 'text-outline-variant';
    if (val >= 80) return 'text-emerald-700';
    if (val >= 60) return 'text-primary';
    return 'text-amber-700';
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: dimension, height: dimension }}
      >
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox={`0 0 ${dimension} ${dimension}`}
        >
          {/* Background circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="#eaedff"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            className={`${getScoreColor(score)} transition-all duration-700 ease-out`}
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner score or status */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
          {score !== null ? (
            <>
              <span className={`font-bold font-sans ${fontSize} text-on-surface leading-none`}>
                {score}
              </span>
              <span className={`font-medium ${labelSize} text-on-surface-variant mt-0.5`}>
                /100
              </span>
            </>
          ) : (
            <span className="font-semibold text-[11px] text-on-surface-variant leading-tight px-1 text-center">
              Chưa đủ dữ liệu
            </span>
          )}
        </div>
      </div>

      {(label || sublabel) && (
        <div className="min-w-0">
          {label && <div className="font-semibold text-on-surface text-base truncate">{label}</div>}
          {sublabel && (
            <div className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
};
