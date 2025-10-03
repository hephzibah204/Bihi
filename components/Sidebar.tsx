import React from 'react';
import { DashboardView, UserRole } from '../types';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import ArrowUpOnSquareIcon from './icons/ArrowUpOnSquareIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import ClockIcon from './icons/ClockIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import WalletIcon from './icons/WalletIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import XIcon from './icons/XIcon';
import Logo from './icons/Logo';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import Assignments from './Assignments';

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole;
}

const NavLink = ({ icon, label, view, activeView, setActiveView }) => (
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

const Sidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView, userRole }: SidebarProps) => {
    
    const adminNavLinks = [
        { view: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.TEACHERS, label: 'Teachers', icon: <UsersIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <BookOpenIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.RESULTS, label: 'Enter Scores', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.REPORT_CARDS, label: 'Report Cards', icon: <DocumentArrowDownIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <ArrowUpOnSquareIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.ID_CARDS, label: 'ID Cards', icon: <IdentificationIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <ClockIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.COMMUNICATIONS, label: 'Communications', icon: <EnvelopeIcon className="h-5 w-5" /> },
    ];

    const bursarNavLinks = [
        { view: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-5 w-5" /> },
    ];
    
    const navLinks = userRole === USER_ROLES.BURSAR ? bursarNavLinks : adminNavLinks;
    const bottomNavLinks = [
        { view: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="h-5 w-5" /> },
        { view: ADMIN_VIEWS.SETTINGS, label: 'Settings', icon: <Cog6ToothIcon className="h-5 w-5" /> },
    ];

    return (
        <>
            {/* Mobile overlay */}
            <div 
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <aside 
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                id="sidebar"
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
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {/* Fix: The key prop is handled by React and not passed to the component. The explicit props are correct. */}
                    {navLinks.map(link => <NavLink key={link.view} view={link.view} label={link.label} icon={link.icon} activeView={activeView} setActiveView={setActiveView} />)}
                    <div className="pt-4 mt-4 border-t">
                        {/* Fix: The key prop is handled by React and not passed to the component. The explicit props are correct. */}
                        {bottomNavLinks.map(link => <NavLink key={link.view} view={link.view} label={link.label} icon={link.icon} activeView={activeView} setActiveView={setActiveView} />)}
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;