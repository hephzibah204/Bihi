import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CommentGenerator from './CommentGenerator';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { TeacherView } from '../types';
import Logo from './icons/Logo';

interface NavItemProps {
    icon: React.ReactNode;
    children: React.ReactNode;
    view: TeacherView;
    activeView: TeacherView;
    onClick: (view: TeacherView) => void;
}

const NavItem: FC<NavItemProps> = ({ icon, children, view, activeView, onClick }) => {
    const isActive = view === activeView;
    const activeClasses = 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white';
    const inactiveClasses = 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700';

    return (
        <li>
            <button 
                onClick={() => onClick(view)} 
                className={`flex items-center w-full px-4 py-2 rounded-md transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
            >
                {icon}
                <span className="mx-4 font-medium">{children}</span>
            </button>
        </li>
    );
};

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const TeacherSidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }: SidebarProps) => {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col border-r border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                         <Logo className="h-8 w-8" />
                         <span className="text-gray-800 dark:text-white text-xl font-semibold">Teacher Portal</span>
                    </div>
                </div>
                <nav className="mt-6 px-2">
                    <ul className="space-y-2">
                        <NavItem icon={<HomeIcon className="h-6 w-6" />} view="dashboard" activeView={activeView} onClick={setActiveView}>Dashboard</NavItem>
                        <NavItem icon={<UsersIcon className="h-6 w-6" />} view="my-students" activeView={activeView} onClick={setActiveView}>My Students</NavItem>
                        <NavItem icon={<ClipboardListIcon className="h-6 w-6" />} view="enter-scores" activeView={activeView} onClick={setActiveView}>Enter Scores</NavItem>
                        <NavItem icon={<CalendarDaysIcon className="h-6 w-6" />} view="my-schedule" activeView={activeView} onClick={setActiveView}>My Schedule</NavItem>
                        <NavItem icon={<BrainCircuitIcon className="h-6 w-6" />} view="ai-tools" activeView={activeView} onClick={setActiveView}>AI Tools</NavItem>
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default TeacherSidebar;