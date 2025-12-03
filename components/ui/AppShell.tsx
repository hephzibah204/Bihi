import React, { PropsWithChildren, useState } from 'react';
import BlueSidebar from './BlueSidebar';
import TopBar from './TopBar';
import Bars3Icon from '../icons/Bars3Icon';

interface AppShellProps {
  pageTitle: string;
  sidebarItems: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  onSelectSidebarItem?: (key: string) => void;
  rightPanel?: React.ReactNode;
  topBar?: React.ReactNode;
}

const AppShell: React.FC<PropsWithChildren<AppShellProps>> = ({ pageTitle, sidebarItems, onSelectSidebarItem, rightPanel, topBar, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#EEF2FF]">
      <BlueSidebar 
        items={sidebarItems} 
        onSelect={onSelectSidebarItem}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />
      <div className="flex-1 flex flex-col">
        {/* Mobile Menu Button */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="text-sm font-semibold text-gray-700">{pageTitle}</span>
        </div>
        
        {topBar ? topBar : <TopBar pageTitle={pageTitle} />}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0">{children}</div>
              {rightPanel && (
                <aside className="hidden xl:block bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                  {rightPanel}
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;