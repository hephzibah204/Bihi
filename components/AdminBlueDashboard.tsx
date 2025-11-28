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
import SchoolVitals from './SchoolVitals';
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
import HighRiskStudentsQuickList from './HighRiskStudentsQuickList';
import TopDebtorsQuickList from './TopDebtorsQuickList';
import RecentActivityWidget from './RecentActivityWidget';
import DataChampionsWidget from './DataChampionsWidget';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardFilterProvider } from '../contexts/DashboardFilterContext';
import { DashboardView } from '../types';
import ErrorBoundary from './ErrorBoundary';
import { ContentLoader } from './ui/LoadingSpinner';
import { 
  apiGetStudents, 
  apiGetTeachers, 
  apiGetInvoices, 
  apiGetPayments, 
  apiGetAttendance, 
  apiGetEvents,
  apiGetActivityLog,
  apiGetCommunicationLogs,
  apiGetScores
} from '../services/api';

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

// Helper function to get dynamic greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Helper function to format time ago
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

const AdminBlueDashboard: React.FC<AdminBlueDashboardProps> = ({ setActiveView }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    students: [],
    teachers: [],
    invoices: [],
    payments: [],
    attendance: [],
    events: [],
    activities: [],
    communications: [],
    scores: []
  });

  // Computed statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    monthlyRevenue: 0,
    presentStudents: 0,
    activeTeachers: 0,
    pendingFees: 0,
    newApplications: 0,
    averageScore: 0,
    totalReports: 0,
    studentsToPromote: 0
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all required data in parallel
        const [
          students,
          teachers,
          invoices,
          payments,
          attendance,
          events,
          activities,
          communications,
          scores
        ] = await Promise.all([
          apiGetStudents(),
          apiGetTeachers(),
          apiGetInvoices(),
          apiGetPayments(),
          apiGetAttendance(),
          apiGetEvents(),
          apiGetActivityLog(),
          apiGetCommunicationLogs(),
          apiGetScores()
        ]);

        setDashboardData({
          students,
          teachers,
          invoices,
          payments,
          attendance,
          events,
          activities,
          communications,
          scores
        });

        // Calculate statistics
        const totalStudents = students.length;
        const totalTeachers = teachers.length;
        
        // Calculate monthly revenue from payments
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.paymentDate || payment.createdAt);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Calculate attendance statistics
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.find(record => record.date === today);
        const presentStudents = todayAttendance ? 
          Object.values(todayAttendance.statuses || {}).filter(status => status === 'present').length : 0;

        // Calculate pending fees
        const unpaidInvoices = invoices.filter(invoice => 
          invoice.status === 'unpaid' || invoice.status === 'partially-paid' || invoice.status === 'overdue'
        );
        const pendingFees = unpaidInvoices.reduce((sum, invoice) => 
          sum + ((invoice.totalAmount || 0) - (invoice.amountPaid || 0)), 0);

        // Calculate average score
        const validScores = scores.filter(score => score.totalScore && score.totalScore > 0);
        const averageScore = validScores.length > 0 ? 
          validScores.reduce((sum, score) => sum + score.totalScore, 0) / validScores.length : 0;

        setStats({
          totalStudents,
          totalTeachers,
          monthlyRevenue,
          presentStudents,
          activeTeachers: totalTeachers, // Assume all teachers are active for now
          pendingFees,
          newApplications: 23, // This would come from admissions API
          averageScore: Math.round(averageScore),
          totalReports: scores.length,
          studentsToPromote: Math.floor(totalStudents * 0.85) // Estimate based on typical promotion rate
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  // Get recent students and messages for right panel
  const recentStudents = dashboardData.students.slice(0, 4).map(student => ({
    id: student.id,
    name: student.name || `${student.firstName} ${student.lastName}`,
    className: student.class || 'N/A'
  }));

  const recentMessages = dashboardData.communications.slice(0, 3).map(comm => ({
    id: comm.id,
    sender: comm.sender || 'System',
    snippet: comm.content ? comm.content.substring(0, 50) + '...' : 'No content',
    time: comm.sentAt ? getTimeAgo(comm.sentAt) : 'N/A'
  }));

  const rightPanel = (
    <RightPanel
      students={recentStudents}
      messages={recentMessages}
    />
  );

  // Get teacher data for table
  const teacherData = dashboardData.teachers.slice(0, 4).map(teacher => ({
    name: teacher.name || teacher.full_name || 'N/A',
    subject: Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : (teacher.subjects || 'N/A'),
    qualification: teacher.qualification || 'N/A',
    salary: teacher.baseSalary ? `₦${teacher.baseSalary.toLocaleString()}` : 'N/A'
  }));

  if (loading) {
    return <ContentLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminAppShellWithGroups pageTitle="Dashboard" sidebarGroups={sidebarGroups} onSelectSidebarItem={handleSidebarClick} rightPanel={rightPanel}>
      {/* Centered content wrapper with max width */}
      <div className="space-y-10 max-w-6xl mx-auto pb-10">
        
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-brand to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">{getGreeting()}, Admin! 👋</h1>
              <p className="text-purple-100 text-lg">Here's what's happening at your school today</p>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalStudents.toLocaleString()}</div>
                <div className="text-purple-200 text-sm">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalTeachers}</div>
                <div className="text-purple-200 text-sm">Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">₦{(stats.monthlyRevenue / 1000000).toFixed(1)}M</div>
                <div className="text-purple-200 text-sm">Monthly Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => handleViewChange(ADMIN_VIEWS.STUDENTS)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <UsersIcon className="w-7 h-7 text-brand" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Students</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Students</h3>
              <p className="text-gray-600 text-sm">Add, edit, or import student records and manage enrollment.</p>
            </button>
        
            <button 
              onClick={() => handleViewChange(ADMIN_VIEWS.RESULTS)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <ClipboardListIcon className="w-7 h-7 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
                  <div className="text-sm text-gray-500">Avg Score</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Scores</h3>
              <p className="text-gray-600 text-sm">Input CA and exam scores for all subjects and classes.</p>
            </button>
        
            <button 
              onClick={() => handleViewChange(ADMIN_VIEWS.REPORT_CARDS)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <DocumentArrowDownIcon className="w-7 h-7 text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalReports}</div>
                  <div className="text-sm text-gray-500">Reports</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Reports</h3>
              <p className="text-gray-600 text-sm">Create and print professional report cards and transcripts.</p>
            </button>
        
            <button 
              onClick={() => handleViewChange(ADMIN_VIEWS.PROMOTIONS)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <GraduationCapIcon className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{stats.studentsToPromote}</div>
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
                  <span className="font-semibold text-green-600">{stats.presentStudents} / {stats.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Teachers</span>
                  <span className="font-semibold text-blue-600">{stats.activeTeachers} / {stats.totalTeachers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending Fees</span>
                  <span className="font-semibold text-orange-600">₦{(stats.pendingFees / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">New Applications</span>
                  <span className="font-semibold text-brand">{stats.newApplications}</span>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {dashboardData.events.length > 0 ? (
                  dashboardData.events.slice(0, 3).map((event, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-brand'];
                    const eventDate = new Date(event.date || event.startDate);
                    const formattedDate = eventDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    });
                    
                    return (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 ${colors[index % colors.length]} rounded-full mt-2`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{event.title || event.name}</p>
                          <p className="text-sm text-gray-600">{formattedDate}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 text-sm">No upcoming events scheduled</div>
                )}
              </div>
            </div>

            {/* Quick Tools */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tools</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-xl bg-brand-soft hover:bg-purple-100 transition-colors">
                  <div className="font-medium text-brand">Send Announcement</div>
                  <div className="text-sm text-purple-700">Notify all parents</div>
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                  <div className="font-medium text-green-900">Generate Report</div>
                  <div className="text-sm text-green-700">Monthly summary</div>
                </button>
                <button className="w-full text-left p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="font-medium text-blue-900">Backup Data</div>
                  <div className="text-sm text-blue-700">Secure your records</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* School Overview Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">School Overview</h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <Card header={<div className="bg-brand-soft rounded-xl px-4 py-3">
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

          <SafeWidget>
            <LeaderboardShortcuts />
          </SafeWidget>
        </section>

        {/* Academic Performance Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Academic Performance</h2>
          
          <SafeWidget>
            <AcademicKPIGroup />
          </SafeWidget>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <ClassPerformanceRanking />
            </SafeWidget>
            <SafeWidget>
              <SubjectHotColdChart />
            </SafeWidget>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <TeacherPerformanceWidget />
            </SafeWidget>
            <SafeWidget>
              <AttendanceSnapshotWidget />
            </SafeWidget>
          </div>
        </section>

        {/* Financial Health & Debtors Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Financial Health & Debtors</h2>
          
          <SafeWidget>
            <FinancialKPIGroup />
          </SafeWidget>

          <DashboardFilterProvider>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">School Vitals</h3>
                <SafeWidget>
                  <SchoolVitals />
                </SafeWidget>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Vitals</h3>
                <SafeWidget>
                  <FinancialVitalsPro />
                </SafeWidget>
              </div>
            </div>
          </DashboardFilterProvider>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <IncomeExpenseTrendChart />
            </SafeWidget>
            <SafeWidget>
              <ExpenseCategoryBreakdown />
            </SafeWidget>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <TopDebtorsByClassAlt />
            </SafeWidget>
            <SafeWidget>
              <HighPriorityDebtorsWidget />
            </SafeWidget>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <TopDebtorsQuickList />
            </SafeWidget>
            <SafeWidget>
              <FinancialQAWidget />
            </SafeWidget>
          </div>
        </section>

        {/* Student Risk & Attendance Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Student Risk & Attendance</h2>
          
          <SafeWidget>
            <AttendanceKPIGroup />
          </SafeWidget>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <HighRiskStudentsQuickList />
            </SafeWidget>
          </div>
        </section>

        {/* Operations & AI Insights Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Operations & AI Insights</h2>
          
          <SafeWidget>
            <OperationalKPIGroup />
          </SafeWidget>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

          <SafeWidget>
            <DataChampionsWidget />
          </SafeWidget>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SafeWidget>
              <AnalystQAWidget />
            </SafeWidget>
            <SafeWidget>
              <Card header={<div className="text-base font-semibold">Performance Metrics</div>}>
                <BarChartMini />
              </Card>
            </SafeWidget>
          </div>
        </section>

      </div>
    </AdminAppShellWithGroups>
  );
};

export default AdminBlueDashboard;