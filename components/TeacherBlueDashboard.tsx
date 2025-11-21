import React, { useEffect, useState, lazy, Suspense } from 'react';
import AppShell from './ui/AppShell';
import RightPanel from './ui/RightPanel';
import { TEACHER_VIEWS } from '../utils/constants';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import BellIcon from './icons/BellIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import TeacherBottomNavBar from './TeacherBottomNavBar';
import { DashboardFilterProvider } from '../contexts/DashboardFilterContext';
import DashboardFilterBar from './DashboardFilterBar';
import TopBarTeacher from './ui/TopBarTeacher';

import TeacherDashboardContent from './TeacherDashboardContent';
const TeacherMoreView = lazy(() => import('./TeacherMoreView'));
const TeacherProfile = lazy(() => import('./TeacherProfile'));
const TeacherSettings = lazy(() => import('./TeacherSettings'));

const TeacherBlueDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<string>(new URLSearchParams(window.location.search).get('view') || TEACHER_VIEWS.DASHBOARD);
  const [headerTitle, setHeaderTitle] = useState('Dashboard');

  useEffect(() => {
    const viewName = (activeView || '').replace(/-/g, ' ');
    const capitalizedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    setHeaderTitle(capitalizedTitle);
    document.title = `${capitalizedTitle} | ReportSheet`;
  }, [activeView]);

  const handleViewChange = (view: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url.toString());
    setActiveView(view);
  };

  const sidebarItems = [
    { key: TEACHER_VIEWS.DASHBOARD, label: 'Dashboard', icon: <CalendarDaysIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.DASHBOARD },
    { key: TEACHER_VIEWS.MY_SCHEDULE, label: 'My Schedule', icon: <CalendarDaysIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.MY_SCHEDULE },
    { key: TEACHER_VIEWS.MY_STUDENTS, label: 'My Students', icon: <UsersIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.MY_STUDENTS },
    { key: TEACHER_VIEWS.ENTER_SCORES, label: 'Enter Scores', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.ENTER_SCORES },
    { key: TEACHER_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.BROADSHEET },
    { key: TEACHER_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <MegaphoneIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.ASSIGNMENTS },
    { key: TEACHER_VIEWS.ATTENDANCE, label: 'Attendance', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.ATTENDANCE },
    { key: TEACHER_VIEWS.REPORT_CARDS, label: 'Report Cards', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.REPORT_CARDS },
    { key: TEACHER_VIEWS.LESSON_TEMPLATES, label: 'Lesson Templates', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.LESSON_TEMPLATES },
    { key: TEACHER_VIEWS.RESOURCE_HUB, label: 'Resource Hub', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.RESOURCE_HUB },
    { key: TEACHER_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.AI_TOOLS },
    { key: TEACHER_VIEWS.AI_COACH, label: 'AI Coach', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.AI_COACH },
    { key: TEACHER_VIEWS.CLASSROOM_MONITORING, label: 'Classroom Monitoring', icon: <HeadsetIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.CLASSROOM_MONITORING },
    { key: TEACHER_VIEWS.MESSAGES, label: 'Messages', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.MESSAGES },
    { key: TEACHER_VIEWS.NOTIFICATIONS, label: 'Notifications', icon: <BellIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.NOTIFICATIONS },
    { key: TEACHER_VIEWS.MY_PAYSLIPS, label: 'My Payslips', icon: <BanknotesIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.MY_PAYSLIPS },
    { key: TEACHER_VIEWS.HELP, label: 'Help & Support', icon: <QuestionMarkCircleIcon className="w-5 h-5" />, active: activeView === TEACHER_VIEWS.HELP },
  ];

  const rightPanel = (
    <RightPanel
      students={[
        { id: 's1', name: 'Jane Doe', className: 'JSS2 Blue' },
        { id: 's2', name: 'John Smith', className: 'SS1 Science' },
        { id: 's3', name: 'Amina Bello', className: 'JSS3 Red' },
      ]}
      messages={[
        { id: 'm1', sender: 'Admin', snippet: 'Staff meeting tomorrow 9AM.', time: '1h' },
        { id: 'm2', sender: 'Parent', snippet: 'Please share last week’s summary.', time: '3h' },
      ]}
    />
  );

  return (
    <AppShell pageTitle={headerTitle} sidebarItems={sidebarItems} onSelectSidebarItem={handleViewChange} rightPanel={rightPanel} topBar={<TopBarTeacher pageTitle={headerTitle} />}>
      <DashboardFilterProvider>
        <DashboardFilterBar />
        <Suspense fallback={<div className="p-4">Loading…</div>}>
          {activeView === TEACHER_VIEWS.MORE ? (
            <TeacherMoreView setActiveView={handleViewChange} />
          ) : activeView === (TEACHER_VIEWS as any).PROFILE ? (
            <TeacherProfile />
          ) : activeView === (TEACHER_VIEWS as any).SETTINGS ? (
            <TeacherSettings />
          ) : (
            <TeacherDashboardContent activeView={activeView as any} setActiveView={handleViewChange as any} profileStudentId={null} onViewStudentProfile={(studentId: string) => {
              // Navigate to student profile view
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'STUDENT_PROFILE');
              url.searchParams.set('studentId', studentId);
              window.history.pushState({}, '', url.toString());
              
              // Update active view to trigger profile display
              setActiveView('STUDENT_PROFILE');
              
              // Log the action for debugging
              console.log('Viewing student profile:', studentId);
            }} />
          )}
        </Suspense>
      </DashboardFilterProvider>
      <TeacherBottomNavBar activeView={activeView as any} setActiveView={handleViewChange as any} />
    </AppShell>
  );
};

export default TeacherBlueDashboard;
