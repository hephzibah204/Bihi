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
import AcademicKPIGroup from './kpi/AcademicKPIGroup';
import FinancialKPIGroup from './kpi/FinancialKPIGroup';
import AttendanceKPIGroup from './kpi/AttendanceKPIGroup';
import OperationalKPIGroup from './kpi/OperationalKPIGroup';
import EngagementKPIGroup from './kpi/EngagementKPIGroup';
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

  const handleViewChange = (view: string) => {
    if (setActiveView) {
      setActiveView(view as DashboardView);
    } else {
      const url = new URL(window.location.toString());
      url.searchParams.set('view', view);
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
      {/* Modern Desktop Dashboard Layout */}
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3">Good morning, Admin! 👋</h1>
              <p className="text-blue-100 text-lg">Here's what's happening at your school today</p>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold">1,247</div>
                <div className="text-blue-200 text-sm">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">89</div>
                <div className="text-blue-200 text-sm">Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">₦2.4M</div>
                <div className="text-blue-200 text-sm">Monthly Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid - Desktop Optimized */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => {
                if (setActiveView) {
                  setActiveView(ADMIN_VIEWS.STUDENTS);
                } else {
                  const url = new URL(window.location.toString());
                  url.searchParams.set('view', ADMIN_VIEWS.STUDENTS);
                  navigate(url.pathname + url.search + url.hash);
                }
              }}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <UsersIcon className="w-7 h-7 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-sm text-gray-500">Students</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Students</h3>
              <p className="text-gray-600 text-sm">Add, edit, or import student records and manage enrollment.</p>
            </button>
        
            <button 
              onClick={() => {
                if (setActiveView) {
                  setActiveView(ADMIN_VIEWS.RESULTS);
                } else {
                  const url = new URL(window.location.toString());
                  url.searchParams.set('view', ADMIN_VIEWS.RESULTS);
                  navigate(url.pathname + url.search + url.hash);
                }
              }}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <ClipboardListIcon className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">89%</div>
                  <div className="text-sm text-gray-500">Avg Score</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Scores</h3>
              <p className="text-gray-600 text-sm">Input CA and exam scores for all subjects and classes.</p>
            </button>
        
            <button 
              onClick={() => {
                if (setActiveView) {
                  setActiveView(ADMIN_VIEWS.REPORT_CARDS);
                } else {
                  const url = new URL(window.location.toString());
                  url.searchParams.set('view', ADMIN_VIEWS.REPORT_CARDS);
                  navigate(url.pathname + url.search + url.hash);
                }
              }}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <DocumentArrowDownIcon className="w-7 h-7 text-purple-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">342</div>
                  <div className="text-sm text-gray-500">Reports</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Reports</h3>
              <p className="text-gray-600 text-sm">Create and print professional report cards and transcripts.</p>
            </button>
        
            <button 
              onClick={() => {
                if (setActiveView) {
                  setActiveView(ADMIN_VIEWS.PROMOTIONS);
                } else {
                  const url = new URL(window.location.toString());
                  url.searchParams.set('view', ADMIN_VIEWS.PROMOTIONS);
                  navigate(url.pathname + url.search + url.hash);
                }
              }}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <GraduationCapIcon className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-500">To Promote</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Promote Students</h3>
              <p className="text-gray-600 text-sm">Move students to the next class level efficiently.</p>
            </button>
          </div>
        </div>

        {/* Main Dashboard Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Alert Widgets Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SafeWidget>
                <IdleClassesAlertWidget />
              </SafeWidget>
              <SafeWidget>
                <EarlyIntervention />
              </SafeWidget>
            </div>

            {/* Recent Activities */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activities</h2>
              <SafeWidget>
                <RecentActivityWidget />
              </SafeWidget>
            </div>
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Present Students</span>
                  <span className="font-semibold text-green-600">1,189 / 1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Teachers</span>
                  <span className="font-semibold text-blue-600">87 / 89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Fees</span>
                  <span className="font-semibold text-orange-600">₦450K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">New Applications</span>
                  <span className="font-semibold text-purple-600">23</span>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Parent-Teacher Meeting</p>
                    <p className="text-sm text-gray-600">Tomorrow, 2:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Mid-term Exams</p>
                    <p className="text-sm text-gray-600">Next Week</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Sports Day</p>
                    <p className="text-sm text-gray-600">March 15, 2024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="font-medium text-blue-900">Send Announcement</div>
                  <div className="text-sm text-blue-700">Notify all parents</div>
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                  <div className="font-medium text-green-900">Generate Report</div>
                  <div className="text-sm text-green-700">Monthly summary</div>
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                  <div className="font-medium text-purple-900">Backup Data</div>
                  <div className="text-sm text-purple-700">Secure your records</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Content Section */}
        <div className="mt-12 space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          
          {/* KPI Categories Section */}
          <div className="space-y-8">
            {/* Academic Performance KPIs */}
            <SafeWidget>
              <AcademicKPIGroup />
            </SafeWidget>

            {/* Financial Health KPIs */}
            <SafeWidget>
              <FinancialKPIGroup />
            </SafeWidget>

            {/* Attendance & Behavior KPIs */}
            <SafeWidget>
              <AttendanceKPIGroup />
            </SafeWidget>

            {/* Operational Metrics KPIs */}
            <SafeWidget>
              <OperationalKPIGroup />
            </SafeWidget>

            {/* Engagement KPIs */}
            <SafeWidget>
              <EngagementKPIGroup />
            </SafeWidget>
          </div>

          {/* School Vitals */}
          <DashboardFilterProvider>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">School Overview</h3>
              <SchoolVitals />
            </div>

            {/* Financial Vitals */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Performance</h3>
              <FinancialVitalsPro />
            </div>
          </DashboardFilterProvider>

          {/* Charts and Analytics Section */}
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-900">Analytics & Reports</h3>

            {/* Performance Widgets Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SafeWidget>
                <TeacherPerformanceWidget teachers={teacherData} />
              </SafeWidget>
              <SafeWidget>
                <AttendanceSnapshotWidget />
              </SafeWidget>
            </div>

            {/* Data Champions Leaderboard */}
            <SafeWidget>
              <DataChampionsWidget />
            </SafeWidget>
          </div>
        </div>

      {/* Charts and Analytics Section */}
      <div className="space-y-6 md:space-y-8">

        {/* Performance Widgets Row */}
        <div className="mobile-widget-grid">
          <SafeWidget>
            <TeacherPerformanceWidget teachers={teacherData} />
          </SafeWidget>
          <SafeWidget>
            <AttendanceSnapshotWidget />
          </SafeWidget>
        </div>

        {/* Data Champions Leaderboard */}
        <SafeWidget>
          <DataChampionsWidget />
        </SafeWidget>
      </div>

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