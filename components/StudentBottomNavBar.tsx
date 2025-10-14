import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { StudentView } from '../types';
import { STUDENT_VIEWS } from '../utils/constants';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: StudentView;
    isActive: boolean;
    onClick: (view: StudentView) => void;
}

const NavItem: FC<NavItemProps> = ({ icon, label, view, isActive, onClick }) => (
    <button 
        onClick={() => onClick(view)}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
    >
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);

interface BottomNavBarProps {
    activeView: StudentView;
    setActiveView: (view: StudentView) => void;
}

const StudentBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems = [
        { view: STUDENT_VIEWS.DASHBOARD, label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
        { view: STUDENT_VIEWS.RESULTS, label: 'Results', icon: <ClipboardListIcon className="h-6 w-6" /> },
        { view: STUDENT_VIEWS.TIMETABLE, label: 'Timetable', icon: <CalendarDaysIcon className="h-6 w-6" /> },
        { view: STUDENT_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="h-6 w-6" /> },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="flex justify-around">
                {navItems.map(({ view, label, icon }) => (
                    <NavItem 
                        key={view}
                        icon={icon}
                        label={label}
                        view={view as StudentView}
                        isActive={activeView === view}
                        onClick={setActiveView}
                    />
                ))}
            </div>
        </nav>
    );
};

export default StudentBottomNavBar;
