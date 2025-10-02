import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
// Fix: Import ParentView from the central types file to break a circular dependency.
import { ParentView } from '../types';
import BellIcon from './icons/BellIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';


interface NavItemProps {
    icon: React.ReactNode;
    children: React.ReactNode;
    view: ParentView;
    activeView: ParentView;
    onClick: (view: ParentView) => void;
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
    activeView: ParentView;
    setActiveView: (view: ParentView) => void;
}

const ParentSidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }: SidebarProps) => {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 shadow-lg md:shadow-none`}>
                <div className="flex items-center justify-center mt-8">
                    <div className="flex items-center">
                         <span className="text-gray-800 dark:text-white text-2xl font-semibold">Parent Portal</span>
                    </div>
                </div>
                <nav className="mt-10 px-2">
                    <ul className="space-y-2">
                        <NavItem icon={<HomeIcon className="h-6 w-6" />} view="dashboard" activeView={activeView} onClick={setActiveView}>Dashboard</NavItem>
                        <NavItem icon={<ClipboardListIcon className="h-6 w-6" />} view="results" activeView={activeView} onClick={setActiveView}>Results</NavItem>
                        <NavItem icon={<BellIcon className="h-6 w-6" />} view="notifications" activeView={activeView} onClick={setActiveView}>Notifications</NavItem>
                        <NavItem icon={<CheckBadgeIcon className="h-6 w-6" />} view="attendance" activeView={activeView} onClick={setActiveView}>Attendance</NavItem>
                        <NavItem icon={<ShieldExclamationIcon className="h-6 w-6" />} view="behavioral" activeView={activeView} onClick={setActiveView}>Behavioral</NavItem>
                        <NavItem icon={<BrainCircuitIcon className="h-6 w-6" />} view="ai-assistant" activeView={activeView} onClick={setActiveView}>AI Assistant</NavItem>
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default ParentSidebar;