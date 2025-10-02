import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import ArrowUpOnSquareIcon from './icons/ArrowUpOnSquareIcon';
import Bars3Icon from './icons/Bars3Icon';
import { DashboardView } from '../types';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: DashboardView;
    isActive: boolean;
    onClick: (view: DashboardView) => void;
}

const NavItem: FC<NavItemProps> = ({ icon, label, view, isActive, onClick }) => (
    <button 
        onClick={() => onClick(view)}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
    >
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);

interface BottomNavBarProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
}

const AdminBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: DashboardView; label: string; icon: React.ReactNode }[] = [
        { view: 'dashboard', label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
        { view: 'students', label: 'Students', icon: <UsersIcon className="h-6 w-6" /> },
        { view: 'results', label: 'Scores', icon: <ClipboardListIcon className="h-6 w-6" /> },
        { view: 'attendance', label: 'Attendance', icon: <ArrowUpOnSquareIcon className="h-6 w-6" /> },
        { view: 'more', label: 'More', icon: <Bars3Icon className="h-6 w-6" /> },
    ];

    return (
        <nav className="bottom-nav md:hidden">
            {navItems.map(({ view, label, icon }) => (
                <NavItem 
                    key={view}
                    icon={icon}
                    label={label}
                    view={view}
                    isActive={activeView === view}
                    onClick={setActiveView}
                />
            ))}
        </nav>
    );
};

export default AdminBottomNavBar;