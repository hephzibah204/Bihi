import React from 'react';
import AppShell from './ui/AppShell';
import Card from './ui/Card';
import StatPill from './ui/StatPill';
import Table from './ui/Table';
import CalendarMini from './ui/CalendarMini';
import RightPanel from './ui/RightPanel';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
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
import FinancialVitalsWidget from './FinancialVitalsWidget';
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

const AdminBlueDashboard: React.FC = () => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatPill icon={<UsersIcon className="w-5 h-5" />} label="Students" value={932} accentColor="#2563EB" />
        <StatPill icon={<BriefcaseIcon className="w-5 h-5" />} label="Teachers" value={754} accentColor="#F97316" />
        <StatPill icon={<CalendarDaysIcon className="w-5 h-5" />} label="Events" value={40} accentColor="#FACC15" />
        <StatPill icon={<WalletIcon className="w-5 h-5" />} label="Fees Collected" value={'₦32,000,000'} accentColor="#06B6D4" />
      </div>
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
        <Card header={<div className="bg-[#F5F7FF] rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="text-base font-semibold">School Overview</div>
          <div className="flex items-center gap-2">
            <button className="toggle-pill">Week</button>
            <button className="toggle-pill">Month</button>
            <button className="toggle-pill">Year</button>
            <button className="toggle-pill">All</button>
          </div>
        </div>}>
          <BarChartMini />
        </Card>
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
    </AppShell>
  );
};

export default AdminBlueDashboard;
