import React from 'react';

interface Row { label: string; sublabel?: string; value?: string | number }
interface LeaderboardCardProps {
  title: string;
  rows: Row[];
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ title, rows }) => {
  return (
    <div className="card-soft">
      <div className="px-5 pt-5">
        <div className="text-base font-semibold">{title}</div>
      </div>
      <div className="p-5 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
            <div>
              <div className="text-sm font-medium text-[#0F172A]">{r.label}</div>
              {r.sublabel && <div className="text-xs text-gray-500">{r.sublabel}</div>}
            </div>
            {r.value !== undefined && <div className="text-sm font-semibold">{r.value}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardCard;