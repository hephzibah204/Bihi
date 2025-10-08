import React from 'react';
import { TeacherView } from '../types';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import { TEACHER_VIEWS, USER_ROLES } from '../utils/constants';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import { useTenant } from '../contexts/TenantContext';

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; view: TeacherView; activeView: TeacherView; setActiveView: (view: TeacherView) => void; }> = ({ icon, label, view, activeView, setActiveView }) => (
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

const TeacherSidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }: SidebarProps) => {
    const { hasFeature } = useTenant();

    const allNavLinks = [
        { view: TEACHER_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, alwaysVisible: true },
        { view: TEACHER_VIEWS.MY_STUDENTS, label: 'My Students', icon: <UsersIcon className="h-5 w-5" /> },
        { view: TEACHER_VIEWS.ENTER_SCORES, label: 'Enter Scores', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: TEACHER_VIEWS.MESSAGES, label: 'Messages', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
        { view: TEACHER_VIEWS.MY_SCHEDULE, label: 'My Schedule', icon: <CalendarDaysIcon className="h-5 w-5" /> },
        { view: TEACHER_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="h-5 w-5" /> },
    ];

    const navLinks = allNavLinks.filter(link => link.alwaysVisible || hasFeature(USER_ROLES.TEACHER, link.view));

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
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navLinks.map(link => <NavLink key={link.view} view={link.view} label={link.label} icon={link.icon} activeView={activeView} setActiveView={setActiveView} />)}
                </nav>
            </aside>
        </>
    );
};

export default TeacherSidebar;