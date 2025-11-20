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
        onClick={() => onClick(view)}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
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
        // Fix: Cast string constants to TeacherView
        { view: TEACHER_VIEWS.DASHBOARD as TeacherView, label: 'Home', icon: <IconHome className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.ENTER_SCORES as TeacherView, label: 'Scores', icon: <IconScoreEntry className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.ATTENDANCE as TeacherView, label: 'Attendance', icon: <IconAttendance className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.REPORT_CARDS as TeacherView, label: 'Report Card', icon: <IconReportCards className="h-6 w-6" /> },
        { view: TEACHER_VIEWS.AI_TOOLS as TeacherView, label: 'AI Tools', icon: <IconAITools className="h-6 w-6" /> },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
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