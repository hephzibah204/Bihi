import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from './ui/AppShell';
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

interface AdminBlueDashboardProps {
  setActiveView?: (view: DashboardView) => void;
}

const AdminBlueDashboard: React.FC<AdminBlueDashboardProps> = ({ setActiveView }) => {
  const navigate = useNavigate();
  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" />, active: true },
    { key: 'academics', label: 'Academics', icon: <BookOpenIcon className="w-5 h-5" /> },
    { key: 'cbt', label: 'CBT & Exams', icon: <ClipboardListIcon className="w-5 h-5" /> },
    { key: 'finance', label: 'Finance', icon: <WalletIcon className="w-5 h-5" /> },
    { key: 'people', label: 'People & Attendance', icon: <UsersIcon className="w-5 h-5" /> },
    { key: 'communication', label: 'Communication', icon: <MegaphoneIcon className="w-5 h-5" /> },
    { key: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
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

  return (
    <AppShell pageTitle="Dashboard" sidebarItems={sidebarItems} rightPanel={rightPanel}>
      <div className="text-sm text-gray-600">Here are some quick actions to get you started.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {[
          { view: ADMIN_VIEWS.STUDENTS, title: 'Manage Students', icon: <UsersIcon className="w-8 h-8" />, description: 'Add, edit, or import student records.' },
          { view: ADMIN_VIEWS.RESULTS, title: 'Enter Scores', icon: <ClipboardListIcon className="w-8 h-8" />, description: 'Input the latest CA and exam scores.' },
          { view: ADMIN_VIEWS.REPORT_CARDS, title: 'Generate Reports', icon: <DocumentArrowDownIcon className="w-8 h-8" />, description: 'Create and print report cards.' },
          { view: ADMIN_VIEWS.PROMOTIONS, title: 'Promote Students', icon: <GraduationCapIcon className="w-8 h-8" />, description: 'Move students to the next class.' },
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
            className="card p-6 text-center hover:shadow-lg hover:scale-105 transition-transform duration-200"
          >
            <div className="text-[#2563EB] mx-auto w-16 h-16 flex items-center justify-center bg-[#EEF2FF] rounded-full">
              {link.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{link.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{link.description}</p>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <RecentActivityWidget />
      </div>

      {/* Data Champions Leaderboard */}
      <div className="mt-6">
        <DataChampionsWidget />
      </div>

      <DashboardFilterProvider>
        <DashboardFilterBar />
        <DashboardKPI />
      </DashboardFilterProvider>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card header={<div className="bg-[#F5F7FF] rounded-xl px-4 py-3">
          <div className="text-base font-semibold">School Performance</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="chip chip-blue">This Week 1,245</span>
            <span className="chip chip-orange">Last Week 1,356</span>
          </div>
        </div>}>
          <LineChartMini />
        </Card>
        <SchoolOverviewChart />
      </div>
      <div className="mt-6">
        <LeaderboardShortcuts />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <CalendarMini />
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
      </div>
      <div className="mt-6">
        <FinancialVitalsPro />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <HighRiskStudentsQuickList />
        <TopDebtorsQuickList />
      </div>
    </AppShell>
  );
};

export default AdminBlueDashboard;
