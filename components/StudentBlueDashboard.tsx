import React, { useEffect, useState, lazy, Suspense } from 'react';
import AppShell from './ui/AppShell';
import RightPanel from './ui/RightPanel';
import { STUDENT_VIEWS } from '../utils/constants';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import BellIcon from './icons/BellIcon';
import StudentBottomNavBar from './StudentBottomNavBar';

const StudentDashboardContent = lazy(() => import('./StudentDashboardContent'));

const StudentBlueDashboard: React.FC<{ onLogout: () => void; demoUserId?: string }> = ({ onLogout, demoUserId }) => {
  const [activeView, setActiveView] = useState<string>(new URLSearchParams(window.location.search).get('view') || STUDENT_VIEWS.DASHBOARD);
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
    { key: STUDENT_VIEWS.DASHBOARD, label: 'Dashboard', icon: <CalendarDaysIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.DASHBOARD },
    { key: STUDENT_VIEWS.TIMETABLE, label: 'Timetable', icon: <CalendarDaysIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.TIMETABLE },
    { key: STUDENT_VIEWS.RESULTS, label: 'Results', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.RESULTS },
    { key: STUDENT_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <MegaphoneIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.ASSIGNMENTS },
    { key: STUDENT_VIEWS.SUBJECTS, label: 'Subjects', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.SUBJECTS },
    { key: STUDENT_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.AI_TOOLS },
    { key: STUDENT_VIEWS.MESSAGES, label: 'Messages', icon: <UsersIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.MESSAGES },
    { key: STUDENT_VIEWS.NOTIFICATIONS, label: 'Notifications', icon: <BellIcon className="w-5 h-5" />, active: activeView === STUDENT_VIEWS.NOTIFICATIONS },
  ];

  const rightPanel = (
    <RightPanel
      students={[
        { id: 's1', name: 'You', className: 'SS2 Science' },
      ]}
      messages={[
        { id: 'm1', sender: 'Admin', snippet: 'Welcome to the new dashboard.', time: '1d' },
      ]}
    />
  );

  const resolvedDemoId = demoUserId || 'stud_1';

  return (
    <AppShell pageTitle={headerTitle} sidebarItems={sidebarItems} onSelectSidebarItem={handleViewChange} rightPanel={rightPanel}>
      <Suspense fallback={<div className="p-4">Loading…</div>}>
        <StudentDashboardContent activeView={activeView as any} setActiveView={handleViewChange as any} demoUserId={resolvedDemoId} />
      </Suspense>
      <StudentBottomNavBar activeView={activeView as any} setActiveView={handleViewChange as any} />
    </AppShell>
  );
};

export default StudentBlueDashboard;
