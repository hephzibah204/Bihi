import React from 'react';
import { useNavigate } from 'react-router-dom';

const ShortcutCard: React.FC<{ title: string; view: string }> = ({ title, view }) => {
  const navigate = useNavigate();
  return (
    <div className="card-soft p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#0F172A]">{title}</div>
        <button className="toggle-pill" onClick={() => { const url = new URL(window.location.toString()); url.searchParams.set('view', view); navigate(url.pathname + url.search + url.hash); }}>View full</button>
      </div>
    </div>
  );
};

const LeaderboardShortcuts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <ShortcutCard title="Top Students" view="leaderboard-students" />
      <ShortcutCard title="Best Teachers" view="leaderboard-teachers" />
      <ShortcutCard title="Best Subjects" view="leaderboard-subjects" />
      <ShortcutCard title="Best Classes" view="leaderboard-classes" />
    </div>
  );
};

export default LeaderboardShortcuts;