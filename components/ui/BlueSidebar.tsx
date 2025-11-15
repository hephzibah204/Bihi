import React from 'react';

interface BlueSidebarProps {
  items: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  onSelect?: (key: string) => void;
}

const BlueSidebar: React.FC<BlueSidebarProps> = ({ items, onSelect }) => {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-[#0F172A] text-white p-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-lg bg-white/10" />
        <span className="text-lg font-semibold">School OS</span>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              item.active ? 'bg-[#1D4ED8] font-semibold' : 'hover:bg-white/5'
            }`}
          >
            <span className="text-white/90">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-6 text-[11px] text-white/60">School OS • © {new Date().getFullYear()}</div>
    </aside>
  );
};

export default BlueSidebar;
