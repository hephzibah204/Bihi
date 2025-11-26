import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface BlueSidebarProps {
  items: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  onSelect?: (key: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const BlueSidebar: React.FC<BlueSidebarProps> = ({ items, onSelect, isOpen = false, onClose }) => {
  const handleItemClick = (key: string) => {
    onSelect?.(key);
    // Close mobile menu after selection
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1E3A8A] text-white p-4 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:flex md:flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between mb-6 md:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">A</div>
            <span className="text-xl font-semibold">Akademi</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1">
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => handleItemClick(item.key)}
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
    </>
  );
};

export default BlueSidebar;
