import React, { FC } from 'react';
import { TeacherView } from '../types';
import { TEACHER_VIEWS } from '../utils/constants';
import { IconHome, IconScoreEntry, IconAttendance, IconReportCards, IconAITools } from './icons/Standard';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: TeacherView;
    isActive: boolean;
    onClick: (view: TeacherView) => void;
}

const NavItem: FC<NavItemProps> = ({ icon, label, view, isActive, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(view)}
        className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 transition-colors duration-200 relative ${
            isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        <span
            className={`absolute top-0 h-1 w-8 bg-indigo-600 rounded-full transition-opacity duration-300 ${
                isActive ? 'opacity-100' : 'opacity-0'
            }`}
        ></span>
        {icon}
        <span className={`text-xs mt-1 font-semibold ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>{label}</span>
    </button>
);

interface BottomNavBarProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const TeacherBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: TeacherView; label: string; icon: React.ReactNode }[] = [
        // Fix: Cast string constants to TeacherView
        { view: TEACHER_VIEWS.DASHBOARD as TeacherView, label: 'Home', icon: <IconHome className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.ENTER_SCORES as TeacherView, label: 'Scores', icon: <IconScoreEntry className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.ATTENDANCE as TeacherView, label: 'Attendance', icon: <IconAttendance className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.REPORT_CARDS as TeacherView, label: 'Report Card', icon: <IconReportCards className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.AI_TOOLS as TeacherView, label: 'AI Tools', icon: <IconAITools className="h-6 w-6" /> },
    ];

    return (
        <nav className="bottom-nav">
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

export default TeacherBottomNavBar;