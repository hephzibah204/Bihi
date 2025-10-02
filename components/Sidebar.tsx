import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import GraduationCapIcon from './icons/GraduationCapIcon';
import WalletIcon from './icons/WalletIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import ArrowUpOnSquareIcon from './icons/ArrowUpOnSquareIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import { DashboardView } from '../types';
import CreditCardIcon from './icons/CreditCardIcon';
import Logo from './icons/Logo';

const rolePermissions: Record<string, 'all' | DashboardView[]> = {
    Admin: 'all',
    Bursar: ['dashboard', 'bursary', 'billing', 'settings', 'communications'],
    Teacher: [], // Teachers have their own separate dashboard
};

export const hasPermission = (role: string, view: DashboardView): boolean => {
    if (!role) return false;
    // Teachers use a different dashboard and should not have access to any of these views.
    if (role === 'Teacher') return false; 
    
    const permissions = rolePermissions[role];
    if (permissions === 'all') return true;
    if (Array.isArray(permissions)) {
        return permissions.includes(view);
    }
    return false;
};

interface NavItemProps {
    icon: React.ReactNode;
    children: React.ReactNode;
    view: DashboardView;
    activeView: DashboardView;
    onClick: (view: DashboardView) => void;
}

const NavItem: FC<NavItemProps> = ({ icon, children, view, activeView, onClick }) => {
    const isActive = view === activeView;
    const activeClasses = 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-white font-semibold';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700';

    return (
        <li>
            <button 
                onClick={() => onClick(view)} 
                className={`flex items-center w-full px-4 py-2.5 rounded-md transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
            >
                {icon}
                <span className="mx-4">{children}</span>
            </button>
        </li>
    );
};

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: string;
}

const allNavItems = {
    menu: [
        { view: 'dashboard', icon: <HomeIcon className="h-6 w-6" />, label: 'Dashboard' },
        { view: 'students', icon: <UsersIcon className="h-6 w-6" />, label: 'Students' },
        { view: 'teachers', icon: <BriefcaseIcon className="h-6 w-6" />, label: 'Teachers' },
        { view: 'subjects', icon: <BookOpenIcon className="h-6 w-6" />, label: 'Subjects' },
    ],
    academics: [
        { view: 'results', icon: <ClipboardListIcon className="h-6 w-6" />, label: 'Enter Scores' },
        { view: 'report-cards', icon: <DocumentArrowDownIcon className="h-6 w-6" />, label: 'Report Cards' },
        { view: 'promotions', icon: <GraduationCapIcon className="h-6 w-6" />, label: 'Promotions' },
        { view: 'id-cards', icon: <IdentificationIcon className="h-6 w-6" />, label: 'ID Cards' },
        { view: 'timetable', icon: <CalendarDaysIcon className="h-6 w-6" />, label: 'Timetable' },
        { view: 'attendance', icon: <ArrowUpOnSquareIcon className="h-6 w-6" />, label: 'Attendance' },
        { view: 'behavioral', icon: <ShieldExclamationIcon className="h-6 w-6" />, label: 'Behavioral' },
    ],
    administration: [
        { view: 'bursary', icon: <WalletIcon className="h-6 w-6" />, label: 'Bursary' },
        { view: 'billing', icon: <CreditCardIcon className="h-6 w-6" />, label: 'Billing' },
        { view: 'communications', icon: <EnvelopeIcon className="h-6 w-6" />, label: 'Communications' },
        { view: 'analytics', icon: <ChartBarIcon className="h-6 w-6" />, label: 'Analytics' },
        { view: 'ai-tools', icon: <BrainCircuitIcon className="h-6 w-6" />, label: 'AI Tools' },
        { view: 'settings', icon: <Cog6ToothIcon className="h-6 w-6" />, label: 'Settings' },
    ],
};

const Sidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView, userRole }: SidebarProps) => {

    const NavGroup = ({ title, items }) => {
        const visibleItems = items.filter(item => hasPermission(userRole, item.view));
        if (visibleItems.length === 0) return null;

        return (
            <>
                <p className="px-4 mt-8 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
                <ul className="space-y-1">
                    {visibleItems.map(item => (
                        <NavItem key={item.view} icon={item.icon} view={item.view} activeView={activeView} onClick={setActiveView}>
                            {item.label}
                        </NavItem>
                    ))}
                </ul>
            </>
        );
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-card-bg-dark transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col border-r border-border-light dark:border-border-dark`}>
                <div className="flex items-center justify-center h-20 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center space-x-2">
                         <Logo className="h-8 w-8" />
                         <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">ReportSheet</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 py-4 overflow-y-auto">
                    <NavGroup title="Menu" items={allNavItems.menu} />
                    <NavGroup title="Academics" items={allNavItems.academics} />
                    <NavGroup title="Administration" items={allNavItems.administration} />
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;