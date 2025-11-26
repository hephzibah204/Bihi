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
  progress?: number; // 0-100 for percentage metrics
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, deltaText, deltaDirection, accentColor, sparkline, sparklineColor, progress, onClick }) => {
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
      <div className="p-4 md:p-6 grid grid-cols-[auto_1fr_auto] items-start gap-3 md:gap-4 min-h-[100px] md:min-h-[120px]">
        <div className="kpi-icon flex-shrink-0" style={{ backgroundColor: `${accent}20`, color: accent }}>
          {icon}
        </div>
        <div className="flex min-w-0 flex-col justify-center flex-1">
          <div className="min-w-0 space-y-1">
            <div className="text-xs text-gray-600 font-medium leading-relaxed" title={typeof label==='string'?label:undefined}>
              {label}
            </div>
            <div className="text-base md:text-xl font-semibold text-gray-900 leading-snug break-words" title={typeof value==='string'?value:undefined}>
              {value}
            </div>
            {deltaText && (
              <div className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${deltaDirection === 'down' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} mt-1`}>
                {deltaText}
              </div>
            )}
          </div>
        </div>
        {data && (
          <div className="flex-shrink-0">
            <svg viewBox="0 0 140 50" className="kpi-spark">
              <polyline fill="none" stroke={spColor} strokeWidth="2" points={points} />
            </svg>
          </div>
        )}
      </div>
      {typeof progress === 'number' && (
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="text-xs text-gray-500 mb-2">Progress</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-gray-200 rounded-full">
              <div className="h-2.5 rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: accent }} />
            </div>
            <div className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">{Math.round(Math.max(0, Math.min(100, progress)))}%</div>
          </div>
        </div>
      )}
    </button>
  );
};

export default KpiCard;
