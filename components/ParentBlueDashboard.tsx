import React, { useEffect, useState, lazy, Suspense } from 'react';
import AppShell from './ui/AppShell';
import RightPanel from './ui/RightPanel';
import { PARENT_VIEWS } from '../utils/constants';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import BellIcon from './icons/BellIcon';
import ParentBottomNavBar from './ParentBottomNavBar';

const ParentDashboardContent = lazy(() => import('./ParentDashboardContent'));

const ParentBlueDashboard: React.FC<{ onLogout: () => void; demoUserId?: string | null }> = ({ onLogout, demoUserId }) => {
  const [activeView, setActiveView] = useState<string>(new URLSearchParams(window.location.search).get('view') || PARENT_VIEWS.DASHBOARD);
  const [headerTitle, setHeaderTitle] = useState('Dashboard');

  useEffect(() => {
    const viewName = (activeView || '').replace(/-/g, ' ');
    const capitalizedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    setHeaderTitle(capitalizedTitle);
  }, [activeView]);

  const handleViewChange = (view: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url.toString());
    setActiveView(view);
  };

  const sidebarItems = [
    { key: PARENT_VIEWS.DASHBOARD, label: 'Dashboard', icon: <CalendarDaysIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.DASHBOARD },
    { key: PARENT_VIEWS.ATTENDANCE, label: 'Attendance', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.ATTENDANCE },
    { key: PARENT_VIEWS.RESULTS, label: 'Results', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.RESULTS },
    { key: PARENT_VIEWS.FEES, label: 'Fees', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.FEES },
    { key: PARENT_VIEWS.COMMUNICATION, label: 'Communication', icon: <MegaphoneIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.COMMUNICATION },
    { key: PARENT_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.AI_TOOLS },
    { key: PARENT_VIEWS.MESSAGES, label: 'Messages', icon: <UsersIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.MESSAGES },
    { key: PARENT_VIEWS.NOTIFICATIONS, label: 'Notifications', icon: <BellIcon className="w-5 h-5" />, active: activeView === PARENT_VIEWS.NOTIFICATIONS },
  ];

  const rightPanel = (
    <RightPanel
      students={[
        { id: 's1', name: 'Your Child', className: 'JSS2 Blue' },
      ]}
      messages={[
        { id: 'm1', sender: 'Admin', snippet: 'PTA meeting date announced.', time: '2d' },
      ]}
    />
  );

  const resolvedChildId = demoUserId || 'stud_1';

  return (
    <AppShell pageTitle={headerTitle} sidebarItems={sidebarItems} onSelectSidebarItem={handleViewChange} rightPanel={rightPanel}>
      <Suspense fallback={<div className="p-4">Loading…</div>}>
        <ParentDashboardContent activeView={activeView as any} setActiveView={handleViewChange as any} demoUserId={resolvedChildId} />
      </Suspense>
      <ParentBottomNavBar activeView={activeView as any} setActiveView={handleViewChange as any} />
    </AppShell>
  );
};

export default ParentBlueDashboard;