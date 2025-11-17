import React from 'react';

interface BlueSidebarProps {
  items: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  onSelect?: (key: string) => void;
}

const BlueSidebar: React.FC<BlueSidebarProps> = ({ items, onSelect }) => {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-[#1E3A8A] text-white p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">A</div>
        <span className="text-xl font-semibold">Akademi</span>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onSelect?.(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              item.active ? 'bg-white/10 ring-1 ring-white/10' : 'hover:bg-white/5'
            }`}
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/10">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-6 text-[11px] text-white/70">School Admission Dashboard</div>
      <div className="text-[11px] text-white/50">Made with ♥ by DesignZone</div>
    </aside>
  );
};

export default BlueSidebar;
