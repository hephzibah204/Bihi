import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import { TeacherView } from '../types';
import ClipboardListIcon from './icons/ClipboardListIcon';
import Bars3Icon from './icons/Bars3Icon';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: TeacherView;
    isActive: boolean;
    onClick: (view: TeacherView) => void;
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
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const TeacherBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: TeacherView; label: string; icon: React.ReactNode }[] = [
        { view: 'dashboard', label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
        { view: 'my-students', label: 'Students', icon: <UsersIcon className="h-6 w-6" /> },
        { view: 'enter-scores', label: 'Scores', icon: <ClipboardListIcon className="h-6 w-6" /> },
        { view: 'more', label: 'More', icon: <Bars3Icon className="h-6 w-6" /> },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
            <div className="flex justify-around">
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
            </div>
        </nav>
    );
};

export default TeacherBottomNavBar;