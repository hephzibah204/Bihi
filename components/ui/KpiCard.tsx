import React from 'react';

interface KpiCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  deltaText?: string;
  deltaDirection?: 'up' | 'down';
  accentColor?: string;
  sparkline?: number[];
  sparklineColor?: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, deltaText, deltaDirection, accentColor, sparkline, sparklineColor, onClick }) => {
  const accent = accentColor || 'var(--brand-color-primary)';
  const spColor = sparklineColor || accent;
  const data = Array.isArray(sparkline) && sparkline.length > 1 ? sparkline : undefined;
  let min = 0, max = 0;
  if (data) { min = Math.min(...data); max = Math.max(...data); if (min === max) { max = min + 1; } }
  const points = data ? data.map((v, i) => {
    const x = 10 + (i * (120 / (data.length - 1)));
    const y = 40 - ((v - min) / (max - min)) * 30;
    return `${x},${y}`;
  }).join(' ') : '';

  return (
    <button onClick={onClick} className="kpi-card w-full text-left">
      <div className="p-4 md:p-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4 min-h-[96px]">
        <div className="kpi-icon" style={{ backgroundColor: `${accent}20`, color: accent }}>
          {icon}
        </div>
        <div className="flex min-w-0 items-center justify-between">
          <div className="min-w-0">
            <div className="kpi-label clamp-2" title={typeof label==='string'?label:undefined}>{label}</div>
            <div className="kpi-value ellipsis-1" title={typeof value==='string'?value:undefined}>{value}</div>
            {deltaText && (
              <div className={`delta-chip ${deltaDirection === 'down' ? 'delta-down' : 'delta-up'} mt-1`}>{deltaText}</div>
            )}
          </div>
        </div>
        {data && (
          <svg viewBox="0 0 140 50" className="kpi-spark">
            <polyline fill="none" stroke={spColor} strokeWidth="2" points={points} />
          </svg>
        )}
      </div>
    </button>
  );
};

export default KpiCard;
