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
    <button 
      onClick={onClick} 
      className="kpi-card w-full text-left group transition-all duration-200 hover:shadow-lg active:scale-95 md:hover:scale-105 touch-manipulation"
      disabled={!onClick}
    >
      <div className="p-4 md:p-6 grid grid-cols-[auto_1fr_auto] items-start gap-3 md:gap-4 min-h-[120px] sm:min-h-[140px] md:min-h-[160px]">
        {/* Icon */}
        <div 
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" 
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex min-w-0 flex-col justify-center flex-1">
          <div className="min-w-0 space-y-1 md:space-y-2">
            {/* Label with ellipsis */}
            <div 
              className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed truncate"
              title={typeof label === 'string' ? label : undefined}
            >
              {label}
            </div>
            
            {/* Value with responsive sizing */}
            <div 
              className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 leading-tight break-words"
              title={typeof value === 'string' ? value : undefined}
            >
              {value}
            </div>
            
            {/* Delta indicator */}
            {deltaText && (
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                deltaDirection === 'down' 
                  ? 'bg-red-100 text-red-700 group-hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 group-hover:bg-green-200'
              }`}>
                <span className="truncate">{deltaText}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Sparkline */}
        {data && (
          <div className="flex-shrink-0">
            <svg 
              viewBox="0 0 140 50" 
              className="w-20 h-8 sm:w-24 sm:h-10 md:w-32 md:h-12 transition-opacity group-hover:opacity-80"
            >
              <polyline 
                fill="none" 
                stroke={spColor} 
                strokeWidth="2" 
                points={points}
                className="transition-all duration-300"
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      {typeof progress === 'number' && (
        <div className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="text-xs text-gray-500 mb-2 font-medium">Progress</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ 
                  width: `${Math.max(0, Math.min(100, progress))}%`, 
                  backgroundColor: accent 
                }} 
              />
            </div>
            <div className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right tabular-nums">
              {Math.round(Math.max(0, Math.min(100, progress)))}%
            </div>
          </div>
        </div>
      )}
    </button>
  );
};

export default KpiCard;
