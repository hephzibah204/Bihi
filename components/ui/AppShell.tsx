import React, { PropsWithChildren } from 'react';
import BlueSidebar from './BlueSidebar';
import TopBar from './TopBar';

interface AppShellProps {
  pageTitle: string;
  sidebarItems: Array<{ key: string; label: string; icon: React.ReactNode; active?: boolean }>;
  onSelectSidebarItem?: (key: string) => void;
  rightPanel?: React.ReactNode;
}

const AppShell: React.FC<PropsWithChildren<AppShellProps>> = ({ pageTitle, sidebarItems, onSelectSidebarItem, rightPanel, children }) => {
  return (
    <div className="min-h-screen flex bg-[#EEF2FF]">
      <BlueSidebar items={sidebarItems} onSelect={onSelectSidebarItem} />
      <div className="flex-1 flex flex-col">
        <TopBar pageTitle={pageTitle} />
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

export default AppShell;