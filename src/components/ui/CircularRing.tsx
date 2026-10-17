import React from 'react';

interface CircularRingProps {
  percent: number | string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  reducedMotion?: boolean;
}

export function CircularRing({
  percent,
  color = '#818cf8',
  size = 56,
  strokeWidth = 5,
  reducedMotion = false
}: CircularRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={
            reducedMotion
              ? ''
              : 'transition-[stroke-dashoffset] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
          }
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-100">{clamped}%</span>
    </div>
  );
}
