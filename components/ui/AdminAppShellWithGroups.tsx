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
      {/* Mobile menu button - Fixed positioning */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-700 bg-white shadow-sm hover:bg-gray-50 transition-colors"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      <GroupedSidebar 
        groups={sidebarGroups} 
        onSelect={onSelectSidebarItem}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
          onClick={closeMobileMenu}
        />
      )}

      <div className="flex-1 flex flex-col md:ml-64">
        {topBar ? topBar : <TopBar pageTitle={pageTitle} />}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_18rem] gap-4 md:gap-6 p-3 md:p-6 pt-16 md:pt-6">
          <div className="min-w-0">{children}</div>
          {rightPanel && (
            <aside className="hidden xl:block bg-white border-l border-gray-200 rounded-3xl p-4">{rightPanel}</aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppShellWithGroups;
