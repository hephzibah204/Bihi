import React from 'react';

const BarChartMini: React.FC = () => {
  const bars = [60, 90, 50, 110, 70, 95, 60, 100, 80, 120, 85, 105];
  return (
    <svg viewBox="0 0 600 200" className="w-full h-48">
      <rect x="0" y="0" width="600" height="200" fill="#F5F7FF" rx="16" />
      <g stroke="#E5E7EB">
        <line x1="40" y1="160" x2="560" y2="160" />
        <line x1="40" y1="120" x2="560" y2="120" />
        <line x1="40" y1="80" x2="560" y2="80" />
        <line x1="40" y1="40" x2="560" y2="40" />
      </g>
      {bars.map((h, i) => (
        <rect key={i} x={40 + i * 40} y={160 - h} width={18} height={h} rx={6} fill="#2563EB" />
      ))}
      {bars.map((h, i) => (
        <rect key={`g-${i}`} x={40 + i * 40 + 20} y={160 - Math.max(20, h - 25)} width={18} height={Math.max(20, h - 25)} rx={6} fill="#06B6D4" opacity="0.7" />
      ))}
      <g fill="#9CA3AF" fontSize="9">
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
          <text key={m} x={45 + i * 40} y={175}>{m}</text>
        ))}
      </g>
    </svg>
  );
};

export default BarChartMini;
