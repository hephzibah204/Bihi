

// components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { DashboardView, UserRole } from '../types';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import { IconHome, IconStudents, IconScoreEntry, IconReportCards, IconBroadsheet, IconSubjects, IconTimetable, IconAssignments, IconPromotions, IconAttendance, IconStaff, IconParents, IconCommunications, IconBursary, IconAITools, IconAICoach, IconAnalytics, IconPrintCenter, IconIDCards, IconAlumni, IconSettings, IconHelp, IconMonitoring } from './icons/Standard';
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
    collapsed?: boolean;
    onToggle?: () => void;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, items, activeView, setActiveView, hasFeature, collapsed, onToggle }) => {
    return (
        <div>
            <button className="w-full flex items-center justify-between px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider" onClick={onToggle} aria-expanded={!collapsed} aria-controls={`group-${title}`}>
                <span>{title}</span>
                <span className={`transition-transform ${collapsed ? '-rotate-90' : 'rotate-0'}`}>›</span>
            </button>
            <div id={`group-${title}`} className={`mt-2 space-y-1 ${collapsed ? 'hidden' : 'block'}`}>
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
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    useEffect(() => {
        try {
            const raw = localStorage.getItem('sidebarCollapsedGroups');
            if (raw) setCollapsedGroups(JSON.parse(raw));
        } catch {}
    }, []);
    const toggleGroup = (id: string) => {
        setCollapsedGroups(prev => {
            const next = { ...prev, [id]: !prev[id] };
            try { localStorage.setItem('sidebarCollapsedGroups', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    // Bursar: show dedicated sidebar with only Bursary tabs
    if (userRole === USER_ROLES.BURSAR) {
        const bursarItems = [
          { id: 'dashboard', label: 'Dashboard', icon: <IconHome /> },
          { id: 'fees', label: 'Fee Setup', icon: <IconBursary /> },
          { id: 'invoices', label: 'Invoices', icon: <IconReportCards /> },
          { id: 'debt-management', label: 'Debt Management', icon: <ScaleIcon className="h-5 w-5" /> },
          { id: 'verify', label: 'Verify Payments', icon: <CheckIcon className="h-5 w-5" /> },
          { id: 'expenses', label: 'Expenses', icon: <ArrowTrendingDownIcon className="h-5 w-5" /> },
          { id: 'income', label: 'Other Income', icon: <ArrowTrendingUpIcon className="h-5 w-5" /> },
          { id: 'payroll', label: 'Payroll', icon: <UsersGroupIcon className="h-5 w-5" /> },
          { id: 'reports', label: 'Reports', icon: <IconAnalytics /> },
          { id: 'audit', label: 'Audit Log', icon: <HistoryIcon className="h-5 w-5" /> },
          { id: 'scratch-cards', label: 'Scratch Cards', icon: <CreditCardIcon className="h-5 w-5" /> },
          { id: 'print-center', label: 'Print Center', icon: <IconPrintCenter /> },
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
                { view: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <IconHome /> },
            ]
        },
        {
            group: 'Finance',
            groupId: 'finance',
            items: [
                { view: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <IconBursary /> },
                { view: ADMIN_VIEWS.REPORTS, label: 'Reports', icon: <IconAnalytics /> },
            ]
        },
        {
            group: 'Academics',
            groupId: 'academics',
            items: [
                { view: ADMIN_VIEWS.RESULTS, label: 'Score Entry', icon: <IconScoreEntry /> },
                { view: ADMIN_VIEWS.REPORT_CARDS, label: 'Dossier', icon: <IconReportCards /> },
                { view: ADMIN_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <IconBroadsheet /> },
                { view: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <IconSubjects /> },
                { view: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <IconTimetable /> },
                { view: ADMIN_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <IconAssignments /> },
                { view: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <IconPromotions /> },
                { view: ADMIN_VIEWS.LEADERBOARD_STUDENTS, label: 'Top Students', icon: <IconStudents /> },
                { view: ADMIN_VIEWS.LEADERBOARD_SUBJECTS, label: 'Top Subjects', icon: <IconSubjects /> },
                { view: ADMIN_VIEWS.LEADERBOARD_CLASSES, label: 'Top Classes', icon: <IconBroadsheet /> },
            ]
        },
        {
            group: 'Records',
            groupId: 'records',
            items: [
                { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <IconStudents /> },
                { view: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <IconAttendance /> },
                { view: ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY, label: 'Teacher Attendance History', icon: <IconAttendance /> },
                { view: ADMIN_VIEWS.BEHAVIORAL_REMARKS, label: 'Behavioral', icon: <IconReportCards /> },
            ]
        },
        {
            group: 'Management',
            groupId: 'management',
            items: [
                { view: ADMIN_VIEWS.STAFF, label: 'Staff', icon: <IconStaff /> },
                { view: ADMIN_VIEWS.PARENTS, label: 'Parents', icon: <IconParents /> },
            ]
        },
        {
            group: 'Tools',
            groupId: 'tools',
            items: [
                { view: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <IconAITools /> },
                { view: ADMIN_VIEWS.AI_COACH_MANAGER, label: 'AI Coach Manager', icon: <IconAICoach /> },
                { view: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <IconAnalytics /> },
                { view: ADMIN_VIEWS.REPORTS, label: 'Reports', icon: <IconAnalytics /> },
                { view: ADMIN_VIEWS.OER_ADMIN, label: 'OER Admin', icon: <IconSubjects /> },
                { view: ADMIN_VIEWS.PRINT_CENTER, label: 'Print Center', icon: <IconPrintCenter /> },
                { view: ADMIN_VIEWS.ID_CARDS, label: 'ID Cards', icon: <IconIDCards /> },
                { view: ADMIN_VIEWS.ALUMNI, label: 'Alumni', icon: <IconAlumni /> },
                { view: ADMIN_VIEWS.CLASSROOM_MONITORING, label: 'Classroom Monitoring', icon: <IconMonitoring /> },
                { view: ADMIN_VIEWS.LEADERBOARD_TEACHERS, label: 'Top Teachers', icon: <IconStaff /> },
            ]
        },
        {
            group: 'System',
            groupId: 'system',
            items: [
                { view: ADMIN_VIEWS.SETTINGS, label: 'Settings', icon: <IconSettings /> },
                { view: ADMIN_VIEWS.HELP, label: 'Help & Support', icon: <IconHelp /> },
                { view: ADMIN_VIEWS.ADMIN_PROFILE, label: 'Admin Profile', icon: <IconStudents /> },
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
                <nav className="flex-1 p-3 space-y-2 overflow-y-auto h-[calc(100vh-4rem)]">
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
                            collapsed={!!collapsedGroups[group.groupId]}
                            onToggle={() => toggleGroup(group.groupId)}
                        />
                     ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
