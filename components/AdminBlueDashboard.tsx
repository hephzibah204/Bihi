import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAppShellWithGroups from './ui/AdminAppShellWithGroups';
import Card from './ui/Card';
import StatPill from './ui/StatPill';
import Table from './ui/Table';
import CalendarMini from './ui/CalendarMini';
import RightPanel from './ui/RightPanel';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import WalletIcon from './icons/WalletIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import SchoolVitals from './SchoolVitals';
import DashboardInsights from './DashboardInsights';
import IdleClassesAlertWidget from './IdleClassesAlertWidget';
import TeacherPerformanceWidget from './TeacherPerformanceWidget';
import EarlyIntervention from './EarlyIntervention';
import AttendanceSnapshotWidget from './AttendanceSnapshotWidget';
import FinancialVitalsPro from './FinancialVitalsPro';
import IncomeExpenseTrendChart from './IncomeExpenseTrendChart';
import ExpenseCategoryBreakdown from './ExpenseCategoryBreakdown';
import TopDebtorsByClassAlt from './TopDebtorsByClassAlt';
import HighPriorityDebtorsWidget from './HighPriorityDebtorsWidget';
import FinancialQAWidget from './FinancialQAWidget';
import ClassPerformanceRanking from './ClassPerformanceRanking';
import SubjectHotColdChart from './SubjectHotColdChart';
import AnalystQAWidget from './AnalystQAWidget';
import LineChartMini from './ui/LineChartMini';
import BarChartMini from './ui/BarChartMini';
import SchoolOverviewChart from './SchoolOverviewChart';
import LeaderboardShortcuts from './LeaderboardShortcuts';
import DashboardKPI from './DashboardKPI';
import HighRiskStudentsQuickList from './HighRiskStudentsQuickList';
import TopDebtorsQuickList from './TopDebtorsQuickList';
import RecentActivityWidget from './RecentActivityWidget';
import DataChampionsWidget from './DataChampionsWidget';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardFilterProvider } from '../contexts/DashboardFilterContext';
import DashboardFilterBar from './DashboardFilterBar';
import { DashboardView } from '../types';
import ErrorBoundary from './ErrorBoundary';
import { ContentLoader } from './ui/LoadingSpinner';

interface AdminBlueDashboardProps {
  setActiveView?: (view: DashboardView) => void;
}

// Safe wrapper for potentially problematic widgets
const SafeWidget: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
    <div className="text-sm font-medium">Widget Error</div>
    <div className="text-xs mt-1">This widget failed to load. Check console for details.</div>
  </div> 
}) => (
  <ErrorBoundary fallback={fallback}>
    <div className="widget-container">
      {children}
    </div>
  </ErrorBoundary>
);

const AdminBlueDashboard: React.FC<AdminBlueDashboardProps> = ({ setActiveView }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time for dashboard initialization
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleSidebarClick = (key: string) => {
    if (setActiveView) {
      // Direct mapping to admin views
      if (Object.values(ADMIN_VIEWS).includes(key as any)) {
        setActiveView(key as DashboardView);
      }
    } else {
      // Fallback to URL navigation
      const url = new URL(window.location.toString());
      url.searchParams.set('view', key);
      navigate(url.pathname + url.search + url.hash);
    }
  };

  const sidebarGroups = [
    {
      title: 'Dashboard',
      defaultExpanded: true,
      items: [
        { key: ADMIN_VIEWS.DASHBOARD, label: 'Overview', icon: <ChartBarIcon className="w-4 h-4" />, active: true },
      ]
    },
    {
      title: 'People Management',
      defaultExpanded: true,
      items: [
        { key: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.STAFF, label: 'Teachers', icon: <BriefcaseIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.PARENTS, label: 'Parents', icon: <UsersIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.ALUMNI, label: 'Alumni', icon: <GraduationCapIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Academic Management',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <BookOpenIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <CalendarDaysIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.RESULTS, label: 'Score Entry', icon: <ClipboardListIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.REPORT_CARDS, label: 'Report Cards', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.COMPREHENSIVE_ENTRY, label: 'Comprehensive Entry', icon: <ClipboardListIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <GraduationCapIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'CBT & Exams',
      defaultExpanded: false,
      items: [
        { key: 'cbt-items', label: 'Item Bank', icon: <ClipboardListIcon className="w-4 h-4" /> },
        { key: 'cbt-exams', label: 'Exam Builder', icon: <ClipboardListIcon className="w-4 h-4" /> },
        { key: 'cbt-timetable', label: 'CBT Timetable', icon: <CalendarDaysIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Attendance & Behavior',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.ATTENDANCE, label: 'Student Attendance', icon: <UsersIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY, label: 'Teacher Attendance', icon: <BriefcaseIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.BEHAVIORAL_REMARKS, label: 'Behavioral Remarks', icon: <ClipboardListIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.GENERAL_REMARKS, label: 'General Remarks', icon: <ClipboardListIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.ABSENCE_MANAGEMENT, label: 'Absence Management', icon: <CalendarDaysIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Financial Management',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.BILLING, label: 'Billing', icon: <WalletIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Communication',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.COMMUNICATIONS, label: 'Communications', icon: <MegaphoneIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.EVENTS, label: 'Events', icon: <CalendarDaysIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'AI Tools',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools Hub', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.AI_COACH_MANAGER, label: 'AI Coach Manager', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.AI_COACH_PROGRESS, label: 'AI Coach Progress', icon: <ChartBarIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Analytics & Reports',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.REPORTS, label: 'Reports', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Leaderboards',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.LEADERBOARD_STUDENTS, label: 'Students', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.LEADERBOARD_TEACHERS, label: 'Teachers', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.LEADERBOARD_CLASSES, label: 'Classes', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.LEADERBOARD_SUBJECTS, label: 'Subjects', icon: <ChartBarIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.LEADERBOARD_DEBTORS, label: 'Debtors', icon: <WalletIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Utilities',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.ID_CARDS, label: 'ID Cards', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.PRINT_CENTER, label: 'Print Center', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.TEACHER_CERTIFICATES, label: 'Teacher Certificates', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.CLASSROOM_MONITORING, label: 'Classroom Monitoring', icon: <ChartBarIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Resources',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.RESOURCE_HUB, label: 'Resource Hub', icon: <BookOpenIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.OER_ADMIN, label: 'OER Admin', icon: <BookOpenIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Content Management',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.PAGES, label: 'Pages', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.MENUS, label: 'Menus', icon: <Cog6ToothIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.BLOG_ARTICLES, label: 'Blog Articles', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.KB_ARTICLES, label: 'Knowledge Base', icon: <BookOpenIcon className="w-4 h-4" /> },
      ]
    },
    {
      title: 'System & Settings',
      defaultExpanded: false,
      items: [
        { key: ADMIN_VIEWS.SETTINGS, label: 'School Settings', icon: <Cog6ToothIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.PLATFORM_SETTINGS, label: 'Platform Settings', icon: <Cog6ToothIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.USERS, label: 'User Management', icon: <UsersIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.ADMIN_PROFILE, label: 'Admin Profile', icon: <UsersIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.HELP, label: 'Help', icon: <Cog6ToothIcon className="w-4 h-4" /> },
        { key: ADMIN_VIEWS.MORE, label: 'More', icon: <Cog6ToothIcon className="w-4 h-4" /> },
      ]
    },
  ];

  const rightPanel = (
    <RightPanel
      students={[
        { id: 's1', name: 'Jane Doe', className: 'JSS2 Blue' },
        { id: 's2', name: 'John Smith', className: 'SS1 Science' },
        { id: 's3', name: 'Amina Bello', className: 'JSS3 Red' },
        { id: 's4', name: 'Chinedu Okeke', className: 'SS2 Arts' },
      ]}
      messages={[
        { id: 'm1', sender: 'Principal', snippet: 'Meeting at 2PM today.', time: '2h' },
        { id: 'm2', sender: 'Bursar', snippet: 'Fees summary available.', time: '5h' },
        { id: 'm3', sender: 'Teacher Funke', snippet: 'Updated lesson plan.', time: '1d' },
      ]}
    />
  );

  const teacherData = [
    { name: 'Mr. Ade', subject: 'Mathematics', qualification: 'B.Sc', salary: '₦200,000' },
    { name: 'Mrs. Uche', subject: 'English', qualification: 'B.Ed', salary: '₦180,000' },
    { name: 'Mr. Musa', subject: 'Physics', qualification: 'M.Sc', salary: '₦220,000' },
    { name: 'Ms. Grace', subject: 'Biology', qualification: 'B.Sc', salary: '₦190,000' },
  ];

  if (loading) {
    return <ContentLoader />;
  }

  return (
    <AdminAppShellWithGroups pageTitle="Dashboard" sidebarGroups={sidebarGroups} onSelectSidebarItem={handleSidebarClick} rightPanel={rightPanel}>
      {/* Welcome Message */}
      <div className="text-sm text-gray-600 mb-6">Here are some quick actions to get you started.</div>
      
      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { view: ADMIN_VIEWS.STUDENTS, title: 'Manage Students', icon: <UsersIcon className="w-7 h-7" />, description: 'Add, edit, or import student records.' },
          { view: ADMIN_VIEWS.RESULTS, title: 'Enter Scores', icon: <ClipboardListIcon className="w-7 h-7" />, description: 'Input the latest CA and exam scores.' },
          { view: ADMIN_VIEWS.REPORT_CARDS, title: 'Generate Reports', icon: <DocumentArrowDownIcon className="w-7 h-7" />, description: 'Create and print report cards.' },
          { view: ADMIN_VIEWS.PROMOTIONS, title: 'Promote Students', icon: <GraduationCapIcon className="w-7 h-7" />, description: 'Move students to the next class.' },
        ].map(link => (
          <button
            key={String(link.view)}
            onClick={() => {
              if (setActiveView) {
                setActiveView(link.view as DashboardView);
              } else {
                const url = new URL(window.location.toString());
                url.searchParams.set('view', link.view as any);
                navigate(url.pathname + url.search + url.hash);
              }
            }}
            className="card p-6 md:p-8 text-center hover:shadow-lg hover:scale-105 transition-all duration-200 min-h-[140px] md:min-h-[160px] flex flex-col justify-center"
          >
            <div className="text-[#2563EB] mx-auto w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-[#EEF2FF] rounded-xl mb-4">
              {link.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug">{link.title}</h3>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed px-2">{link.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* School Vitals */}
      <SafeWidget>
        <SchoolVitals />
      </SafeWidget>

      {/* Dashboard Insights */}
      <div className="mt-6">
        <SafeWidget>
          <DashboardInsights />
        </SafeWidget>
      </div>

      {/* Alert Widgets Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <IdleClassesAlertWidget />
        </SafeWidget>
        <SafeWidget>
          <EarlyIntervention />
        </SafeWidget>
      </div>

      {/* Performance Widgets Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <TeacherPerformanceWidget />
        </SafeWidget>
        <SafeWidget>
          <AttendanceSnapshotWidget />
        </SafeWidget>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <SafeWidget>
          <RecentActivityWidget />
        </SafeWidget>
      </div>

      {/* Data Champions Leaderboard */}
      <div className="mt-6">
        <SafeWidget>
          <DataChampionsWidget />
        </SafeWidget>
      </div>

      {/* Dashboard KPI and Filters */}
      <DashboardFilterProvider>
        <div className="mt-6">
          <SafeWidget>
            <DashboardFilterBar />
          </SafeWidget>
        </div>
        <div className="mt-6">
          <SafeWidget>
            <DashboardKPI />
          </SafeWidget>
        </div>
        
        {/* Financial Widgets (moved inside DashboardFilterProvider) */}
        <div className="mt-6">
          <SafeWidget>
            <FinancialVitalsPro />
          </SafeWidget>
        </div>
      </DashboardFilterProvider>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <Card header={<div className="bg-[#F5F7FF] rounded-xl px-4 py-3">
            <div className="text-base font-semibold">School Performance</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="chip chip-blue">This Week 1,245</span>
              <span className="chip chip-orange">Last Week 1,356</span>
            </div>
          </div>}>
            <LineChartMini />
          </Card>
        </SafeWidget>
        <SafeWidget>
          <SchoolOverviewChart />
        </SafeWidget>
      </div>

      {/* Academic Performance Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <ClassPerformanceRanking />
        </SafeWidget>
        <SafeWidget>
          <SubjectHotColdChart />
        </SafeWidget>
      </div>

      {/* Leaderboard Shortcuts */}
      <div className="mt-6">
        <SafeWidget>
          <LeaderboardShortcuts />
        </SafeWidget>
      </div>

      {/* Calendar and Teacher Details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <CalendarMini />
        </SafeWidget>
        <SafeWidget>
          <Card header={<div className="text-base font-semibold">Teacher Details</div>} footer={<div className="text-xs text-gray-500">Showing 1 to 4 of 14 entries</div>}>
            <Table
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'subject', header: 'Subject' },
                { key: 'qualification', header: 'Qualification' },
                { key: 'salary', header: 'Fees / Salary' },
              ]}
              data={teacherData}
            />
          </Card>
        </SafeWidget>
      </div>


      {/* Financial Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <IncomeExpenseTrendChart />
        </SafeWidget>
        <SafeWidget>
          <ExpenseCategoryBreakdown />
        </SafeWidget>
      </div>

      {/* Debtors Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <TopDebtorsByClassAlt />
        </SafeWidget>
        <SafeWidget>
          <HighPriorityDebtorsWidget />
        </SafeWidget>
      </div>

      {/* Quick Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <HighRiskStudentsQuickList />
        </SafeWidget>
        <SafeWidget>
          <TopDebtorsQuickList />
        </SafeWidget>
      </div>

      {/* AI-Powered Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SafeWidget>
          <FinancialQAWidget />
        </SafeWidget>
        <SafeWidget>
          <AnalystQAWidget />
        </SafeWidget>
      </div>

      {/* Additional Chart */}
      <div className="mt-6">
        <SafeWidget>
          <Card header={<div className="text-base font-semibold">Performance Metrics</div>}>
            <BarChartMini />
          </Card>
        </SafeWidget>
      </div>
    </AdminAppShellWithGroups>
  );
};

export default AdminBlueDashboard;