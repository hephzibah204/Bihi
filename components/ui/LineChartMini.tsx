import React from 'react';

const LineChartMini: React.FC = () => {
  return (
    <svg viewBox="0 0 600 200" className="w-full h-48">
      <rect x="0" y="0" width="600" height="200" fill="#F5F7FF" rx="16" />
      <g stroke="#E5E7EB">
        <line x1="50" y1="160" x2="560" y2="160" />
        <line x1="50" y1="120" x2="560" y2="120" />
        <line x1="50" y1="80" x2="560" y2="80" />
        <line x1="50" y1="40" x2="560" y2="40" />
      </g>
      <path d="M50,140 C120,120 180,150 240,110 C300,80 360,160 420,100 C480,60 520,140 560,80" fill="none" stroke="#2563EB" strokeWidth="3" />
      <path d="M50,130 C120,150 180,100 240,140 C300,120 360,70 420,150 C480,120 520,90 560,140" fill="none" stroke="#F97316" strokeWidth="3" />
      <g fill="#9CA3AF" fontSize="10">
        <text x="50" y="175">Week 01</text>
        <text x="140" y="175">Week 02</text>
        <text x="230" y="175">Week 03</text>
        <text x="320" y="175">Week 04</text>
        <text x="410" y="175">Week 05</text>
        <text x="500" y="175">Week 06</text>
      </g>
    </svg>
  );
};

export default LineChartMini;
