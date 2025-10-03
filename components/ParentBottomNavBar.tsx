import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
// Fix: Import ParentView from the central types file to break a circular dependency.
import { ParentView } from '../types';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import { PARENT_VIEWS } from '../utils/constants';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: ParentView;
    isActive: boolean;
    onClick: (view: ParentView) => void;
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
    activeView: ParentView;
    setActiveView: (view: ParentView) => void;
}

const ParentBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: ParentView; label: string; icon: React.ReactNode }[] = [
        { view: PARENT_VIEWS.DASHBOARD, label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
        { view: PARENT_VIEWS.RESULTS, label: 'Results', icon: <ClipboardListIcon className="h-6 w-6" /> },
        { view: PARENT_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <DocumentDuplicateIcon className="h-6 w-6" /> },
        { view: PARENT_VIEWS.ATTENDANCE, label: 'Attendance', icon: <CheckBadgeIcon className="h-6 w-6" /> },
        { view: PARENT_VIEWS.BEHAVIORAL, label: 'Behavior', icon: <ShieldExclamationIcon className="h-6 w-6" /> },
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

export default ParentBottomNavBar;
