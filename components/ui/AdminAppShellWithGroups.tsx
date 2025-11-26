import React, { PropsWithChildren, useState } from 'react';
import GroupedSidebar from './GroupedSidebar';
import TopBar from './TopBar';
import Bars3Icon from '../icons/Bars3Icon';

interface SidebarGroup {
  title: string;
  items: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  defaultExpanded?: boolean;
}

interface AdminAppShellWithGroupsProps {
  pageTitle: string;
  sidebarGroups: SidebarGroup[];
  onSelectSidebarItem?: (key: string) => void;
  rightPanel?: React.ReactNode;
  topBar?: React.ReactNode;
}

const AdminAppShellWithGroups: React.FC<PropsWithChildren<AdminAppShellWithGroupsProps>> = ({ 
  pageTitle, 
  sidebarGroups, 
  onSelectSidebarItem, 
  rightPanel, 
  topBar, 
  children 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#EEF2FF]">
      <GroupedSidebar 
        groups={sidebarGroups} 
        onSelect={onSelectSidebarItem}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
      <div className="flex-1 flex flex-col">
        {/* Mobile Menu Button */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
        
        {topBar ? topBar : <TopBar pageTitle={pageTitle} />}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_18rem] gap-6 p-6">
          <div>{children}</div>
          {rightPanel && (
            <aside className="hidden xl:block bg-white border-l border-gray-200 rounded-3xl p-4">{rightPanel}</aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppShellWithGroups;
