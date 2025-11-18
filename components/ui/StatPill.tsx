import React from 'react';

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accentColor?: string; // hex or css color
}

const StatPill: React.FC<StatPillProps> = ({ icon, label, value, accentColor }) => {
  const accent = accentColor || 'var(--brand-color-primary)';
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-xl font-semibold text-[#0F172A]">{value}</div>
      </div>
    </div>
  );
};

export default StatPill;