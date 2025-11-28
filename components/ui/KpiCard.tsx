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
  progress?: number;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  icon, 
  label, 
  value, 
  deltaText, 
  deltaDirection, 
  accentColor = '#6D28D9', 
  sparkline, 
  sparklineColor, 
  progress, 
  onClick 
}) => {
  const hasSparkline = Array.isArray(sparkline) && sparkline.length > 1;
  const spColor = sparklineColor || accentColor;
  
  // Generate sparkline path
  let sparklinePath = '';
  if (hasSparkline) {
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    
    const points = sparkline.map((value, index) => {
      const x = (index / (sparkline.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
    }).join(' ');
    
    sparklinePath = points;
  }

  return (
    <div
      className={`
        relative bg-white rounded-2xl border border-gray-100 shadow-sm 
        hover:shadow-lg hover:border-gray-200 transition-all duration-300
        p-6 group cursor-pointer overflow-hidden
        ${onClick ? 'hover:-translate-y-1' : ''}
      `}
      onClick={onClick} 
    >
      {/* Background Accent */}
      <div 
        className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
        style={{ backgroundColor: accentColor }}
      />
      
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: `${accentColor}15`,
                color: accentColor 
              }}
            >
              {icon}
              </div>
            )}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        
        {/* Delta Badge */}
        {deltaText && (
          <div className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${deltaDirection === 'down' 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-green-50 text-green-600 border border-green-200'
            }
          `}>
            {deltaDirection === 'down' ? '↓' : '↑'} {deltaText}
          </div>
        )}
        </div>
        
        {/* Sparkline */}
      {hasSparkline && (
        <div className="mb-4">
            <svg 
            viewBox="0 0 100 40" 
            className="w-full h-10 opacity-60 group-hover:opacity-80 transition-opacity"
            >
              <polyline 
                fill="none" 
                stroke={spColor} 
                strokeWidth="2" 
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparklinePath}
              className="drop-shadow-sm"
              />
            </svg>
          </div>
        )}
      
      {/* Progress Bar */}
      {typeof progress === 'number' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span className="text-xs font-bold text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${Math.max(0, Math.min(100, progress))}%`, 
                backgroundColor: accentColor
                }} 
              />
          </div>
        </div>
      )}

      {/* Hover Effect Overlay */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      )}
    </div>
  );
};

export default KpiCard;