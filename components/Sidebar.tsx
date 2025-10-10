import React from 'react';
// Fix: Corrected import path for types.
import { DashboardView, UserRole } from '../types';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import ClockIcon from './icons/ClockIcon';
import BellIcon from './icons/BellIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import TableCellsIcon from './icons/TableCellsIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import WalletIcon from './icons/WalletIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UsersGroupIcon from './icons/UsersGroupIcon';
// Fix: Imported BriefcaseIcon to resolve missing component error.
import BriefcaseIcon from './icons/BriefcaseIcon';

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole | null;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; view: DashboardView; activeView: DashboardView; setActiveView: (view: DashboardView) => void; }> = ({ icon, label, view, activeView, setActiveView }) => (
    <button
        onClick={() => setActiveView(view)}
        className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
            activeView === view
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

const NavGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        <div className="mt-2 space-y-1">{children}</div>
    </div>
);

const Sidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView, userRole }: SidebarProps) => {
    const { hasFeature } = usePlanFeatures();

    const allNavLinks = [
        { view: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, group: 'main', alwaysVisible: true },
        
        { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-5 w-5" />, group: 'records' },
        { view: ADMIN_VIEWS.STAFF, label: 'Teachers', icon: <BriefcaseIcon className="h-5 w-5" />, group: 'records' },
        { view: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <BookOpenIcon className="h-5 w-5" />, group: 'records' },
        
        { view: ADMIN_VIEWS.RESULTS, label: 'Enter Scores', icon: <ClipboardListIcon className="h-5 w-5" />, group: 'academics' },
        { view: ADMIN_VIEWS.REPORT_CARDS, label: 'Dossier', icon: <DocumentArrowDownIcon className="h-5 w-5" />, group: 'academics' },
        { view: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <GraduationCapIcon className="h-5 w-5" />, group: 'management' },
        { view: ADMIN_VIEWS.ALUMNI, label: 'Alumni', icon: <UsersGroupIcon className="h-5 w-5" />, group: 'management' },

        { view: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <ClockIcon className="h-5 w-5" />, group: 'management' },
        { view: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <TableCellsIcon className="h-5 w-5" />, group: 'management' },
        
        { view: ADMIN_VIEWS.COMMUNICATIONS, label: 'Communications', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />, group: 'tools' },
        { view: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="h-5 w-5" />, group: 'finance' },
        { view: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" />, group: 'tools' },
        { view: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="h-5 w-5" />, group: 'tools' },
        
        { view: ADMIN_VIEWS.SETTINGS, label: 'Settings', icon: <Cog6ToothIcon className="h-5 w-5" />, group: 'main', alwaysVisible: true },
    ];

    const navLinks = allNavLinks.filter(link => link.alwaysVisible || hasFeature(USER_ROLES.ADMIN, link.view));
    
    const navGroups = [
        { id: 'main', title: 'Main' },
        { id: 'records', title: 'Records' },
        { id: 'academics', title: 'Academics', featureKey: 'results' },
        { id: 'management', title: 'Management' },
        { id: 'finance', title: 'Finance', featureKey: 'bursary' },
        { id: 'tools', title: 'Tools' },
    ].filter(group => {
        if (!group.featureKey) return true;
        return hasFeature(USER_ROLES.ADMIN, group.featureKey);
    });

    return (
        <>
            <div 
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>
            <aside 
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b">
                     <a href="/" className="flex items-center space-x-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold">ReportSheet</span>
                    </a>
                    <button className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {navGroups.map(group => {
                        const linksInGroup = navLinks.filter(link => link.group === group.id);
                        if (linksInGroup.length === 0) return null;
                        return (
                            <NavGroup key={group.id} title={group.title}>
                                {linksInGroup.map(link => <NavLink key={link.view} {...link} activeView={activeView} setActiveView={setActiveView} />)}
                            </NavGroup>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
