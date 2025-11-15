

// components/Sidebar.tsx
import React from 'react';
import { DashboardView, UserRole } from '../types';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import HandRaisedIcon from './icons/HandRaisedIcon';
import TableCellsIcon from './icons/TableCellsIcon';
import WalletIcon from './icons/WalletIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UsersGroupIcon from './icons/UsersGroupIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import LockIcon from './icons/LockIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import DocumentCheckIcon from './icons/DocumentCheckIcon';
import PencilIcon from './icons/PencilIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ScaleIcon from './icons/ScaleIcon';
import CheckIcon from './icons/CheckIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import HistoryIcon from './icons/HistoryIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import PrinterIcon from './icons/PrinterIcon';


interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole | null;
}

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  view: DashboardView;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  disabled?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, view, activeView, setActiveView, disabled }) => (
    <button
        onClick={() => !disabled && setActiveView(view)}
        className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
            activeView === view
                ? 'bg-indigo-600 text-white'
                : disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
        }`}
        disabled={disabled}
    >
        {icon}
        <span className="ml-3">{label}</span>
        {disabled && <LockIcon className="w-4 h-4 ml-auto text-gray-400" />}
    </button>
);

interface NavGroupProps {
    title: string;
    items: Array<{
        view: DashboardView;
        label: string;
        icon: React.ReactNode;
    }>;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    hasFeature: (feature: string) => boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, items, activeView, setActiveView, hasFeature }) => {
    return (
        <div>
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
            <div className="mt-2 space-y-1">
                {items.map((link, index) => (
                    <NavLink 
                        key={`${title}-${link.view}-${index}`}
                        {...link}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        disabled={!hasFeature(link.view)}
                    />
                ))}
            </div>
        </div>
    );
};


const Sidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView, userRole }: SidebarProps) => {
    const { hasFeature } = usePlanFeatures();

    // Bursar: show dedicated sidebar with only Bursary tabs
    if (userRole === USER_ROLES.BURSAR) {
        const bursarItems = [
          { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
          { id: 'fees', label: 'Fee Setup', icon: <BanknotesIcon className="h-5 w-5" /> },
          { id: 'invoices', label: 'Invoices', icon: <DocumentTextIcon className="h-5 w-5" /> },
          { id: 'debt-management', label: 'Debt Management', icon: <ScaleIcon className="h-5 w-5" /> },
          { id: 'verify', label: 'Verify Payments', icon: <CheckIcon className="h-5 w-5" /> },
          { id: 'expenses', label: 'Expenses', icon: <ArrowTrendingDownIcon className="h-5 w-5" /> },
          { id: 'income', label: 'Other Income', icon: <ArrowTrendingUpIcon className="h-5 w-5" /> },
          { id: 'payroll', label: 'Payroll', icon: <UsersGroupIcon className="h-5 w-5" /> },
          { id: 'reports', label: 'Reports', icon: <ChartBarIcon className="h-5 w-5" /> },
          { id: 'audit', label: 'Audit Log', icon: <HistoryIcon className="h-5 w-5" /> },
          { id: 'scratch-cards', label: 'Scratch Cards', icon: <CreditCardIcon className="h-5 w-5" /> },
          { id: 'print-center', label: 'Print Center', icon: <PrinterIcon className="h-5 w-5" /> },
        ];
        const onClickItem = (id: string) => {
          try { localStorage.setItem('bursaryInitialTab', id); } catch (e) { /* noop */ }
          setActiveView(ADMIN_VIEWS.BURSARY);
        };
        return (
          <>
            <div 
                role="button"
                tabIndex={0}
                aria-label="Close sidebar"
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(false); }}
            ></div>
            <aside 
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b">
                    <div className="flex items-center space-x-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold">Bursar</span>
                    </div>
                    <button className="md:hidden icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
                  {bursarItems.map(item => (
                    <button key={item.id} onClick={() => onClickItem(item.id)} className="w-full flex items-center px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </button>
                  ))}
                </nav>
            </aside>
          </>
        );
    }

    const navLinks = [
        {
            group: 'Main',
            groupId: 'main',
            items: [
                { view: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
            ]
        },
        {
            group: 'Academics',
            groupId: 'academics',
            items: [
                { view: ADMIN_VIEWS.RESULTS, label: 'Score Entry', icon: <ClipboardListIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.REPORT_CARDS, label: 'Dossier', icon: <DocumentArrowDownIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <TableCellsIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <BookOpenIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <TableCellsIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <DocumentCheckIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <GraduationCapIcon className="h-5 w-5" /> },
            ]
        },
        {
            group: 'Records',
            groupId: 'records',
            items: [
                { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <HandRaisedIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY, label: 'Teacher Attendance History', icon: <HistoryIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.BEHAVIORAL_REMARKS, label: 'Behavioral', icon: <PencilIcon className="h-5 w-5" /> },
            ]
        },
        {
            group: 'Management',
            groupId: 'management',
            items: [
                { view: ADMIN_VIEWS.STAFF, label: 'Staff', icon: <BriefcaseIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.PARENTS, label: 'Parents', icon: <UsersGroupIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.COMMUNICATIONS, label: 'Communications', icon: <MegaphoneIcon className="h-5 w-5" /> },
            ]
        },
        {
            group: 'Finance',
            groupId: 'finance',
            items: [
                { view: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="h-5 w-5" /> },
            ]
        },
        {
            group: 'Tools',
            groupId: 'tools',
            items: [
                { view: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.AI_COACH_MANAGER, label: 'AI Coach Manager', icon: <DocumentTextIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.PRINT_CENTER, label: 'Print Center', icon: <PrinterIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ID_CARDS, label: 'ID Cards', icon: <IdentificationIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ALUMNI, label: 'Alumni', icon: <GraduationCapIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.CLASSROOM_MONITORING, label: 'Classroom Monitoring', icon: <HeadsetIcon className="h-5 w-5" /> },
            ]
        },
        {
            group: 'System',
            groupId: 'system',
            items: [
                { view: ADMIN_VIEWS.SETTINGS, label: 'Settings', icon: <Cog6ToothIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.HELP, label: 'Help & Support', icon: <QuestionMarkCircleIcon className="h-5 w-5" /> },
            ]
        },
    ];

    return (
        <>
            <div 
                role="button"
                tabIndex={0}
                aria-label="Close sidebar"
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(false); }}
            ></div>
            <aside 
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b">
                    <div className="flex items-center space-x-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold">ReportSheet</span>
                    </div>
                    <button className="md:hidden icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
                   {navLinks
                     .filter(group => {
                        // Show only Finance (and optionally Main) for Bursar
                        if (userRole === USER_ROLES.BURSAR) {
                            return group.groupId === 'finance' || group.groupId === 'main';
                        }
                        const isGroupVisible = hasFeature(group.groupId) || group.groupId === 'main' || group.groupId === 'system';
                        return isGroupVisible;
                     })
                     .map(group => (
                        <NavGroup 
                            key={group.group} 
                            title={group.group}
                            items={group.items}
                            activeView={activeView}
                            setActiveView={setActiveView}
                            hasFeature={hasFeature}
                        />
                     ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
