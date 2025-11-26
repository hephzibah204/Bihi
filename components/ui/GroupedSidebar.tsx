import React, { useState } from 'react';
import XMarkIcon from '../icons/XMarkIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface SidebarGroup {
  title: string;
  items: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  defaultExpanded?: boolean;
}

interface GroupedSidebarProps {
  groups: SidebarGroup[];
  onSelect?: (key: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const GroupedSidebar: React.FC<GroupedSidebarProps> = ({ groups, onSelect, isOpen = false, onClose }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter(g => g.defaultExpanded).map(g => g.title))
  );

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
    }
    setExpandedGroups(newExpanded);
  };

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
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#1E3A8A] text-white p-4 transform transition-transform duration-300 ease-in-out overflow-y-auto
        md:translate-x-0 md:flex md:flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
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
        
        {/* Navigation Groups */}
        <nav className="flex-1 space-y-2">
          {groups.map(group => {
            const isExpanded = expandedGroups.has(group.title);
            return (
              <div key={group.title} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span>{group.title}</span>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
                
                {/* Group Items */}
                {isExpanded && (
                  <div className="ml-2 space-y-1">
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => handleItemClick(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          item.active ? 'bg-white/10 ring-1 ring-white/10 text-white' : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-white/10">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-[11px] text-white/70">School Management System</div>
          <div className="text-[11px] text-white/50">Made with ♥ by ReportSheet</div>
        </div>
      </aside>
    </>
  );
};

export default GroupedSidebar;
