import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from './ui/AppShell';
import Card from './ui/Card';
import UsersIcon from './icons/UsersIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import WalletIcon from './icons/WalletIcon';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardView } from '../types';

interface SimpleAdminDashboardProps {
  setActiveView?: (view: DashboardView) => void;
}

const SimpleAdminDashboard: React.FC<SimpleAdminDashboardProps> = ({ setActiveView }) => {
  const navigate = useNavigate();
  
  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <ChartBarIcon className="w-5 h-5" />, active: true },
    { key: 'academics', label: 'Academics', icon: <BookOpenIcon className="w-5 h-5" /> },
    { key: 'cbt', label: 'CBT & Exams', icon: <ClipboardListIcon className="w-5 h-5" /> },
    { key: 'finance', label: 'Finance', icon: <WalletIcon className="w-5 h-5" /> },
    { key: 'people', label: 'People & Attendance', icon: <UsersIcon className="w-5 h-5" /> },
    { key: 'communication', label: 'Communication', icon: <MegaphoneIcon className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  const quickActions = [
    { 
      view: ADMIN_VIEWS.STUDENTS, 
      title: 'Manage Students', 
      icon: <UsersIcon className="w-8 h-8" />, 
      description: 'Add, edit, or import student records.',
      color: 'bg-blue-500'
    },
    { 
      view: ADMIN_VIEWS.RESULTS, 
      title: 'Enter Scores', 
      icon: <ClipboardListIcon className="w-8 h-8" />, 
      description: 'Input the latest CA and exam scores.',
      color: 'bg-green-500'
    },
    { 
      view: ADMIN_VIEWS.REPORT_CARDS, 
      title: 'Generate Reports', 
      icon: <DocumentArrowDownIcon className="w-8 h-8" />, 
      description: 'Create and print report cards.',
      color: 'bg-purple-500'
    },
    { 
      view: ADMIN_VIEWS.PROMOTIONS, 
      title: 'Promote Students', 
      icon: <GraduationCapIcon className="w-8 h-8" />, 
      description: 'Move students to the next class.',
      color: 'bg-orange-500'
    },
  ];

  const handleActionClick = (view: DashboardView) => {
    if (setActiveView) {
      setActiveView(view);
    } else {
      const url = new URL(window.location.toString());
      url.searchParams.set('view', view as any);
      navigate(url.pathname + url.search + url.hash);
    }
  };

  return (
    <AppShell pageTitle="Admin Dashboard" sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Welcome to Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">Manage your school efficiently with these quick actions.</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <button
              key={String(action.view)}
              onClick={() => handleActionClick(action.view as DashboardView)}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 hover:shadow-md hover:scale-105 transition-all duration-200 p-6 md:p-8 text-left group min-h-[140px] md:min-h-[160px] flex flex-col justify-center"
            >
              <div className={`${action.color} text-white w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug">{action.title}</h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{action.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6 md:p-8 min-h-[120px] md:min-h-[140px]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl">
                  <UsersIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-2 leading-relaxed">Total Students</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">1,234</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 md:p-8 min-h-[120px] md:min-h-[140px]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-xl">
                  <BookOpenIcon className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-2 leading-relaxed">Active Classes</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">24</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 md:p-8 min-h-[120px] md:min-h-[140px]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-xl">
                  <ChartBarIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-2 leading-relaxed">Attendance Rate</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight">94.5%</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600">New student registration: John Doe</p>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Exam scores updated for JSS2</p>
                <span className="text-xs text-gray-400">4 hours ago</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Fee payment received from Jane Smith</p>
                <span className="text-xs text-gray-400">1 day ago</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default SimpleAdminDashboard;
