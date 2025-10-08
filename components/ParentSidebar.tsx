import React from 'react';
import { ParentView } from '../types';
import HomeIcon from './icons/HomeIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import BellIcon from './icons/BellIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import { PARENT_VIEWS, USER_ROLES } from '../utils/constants';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import { useTenant } from '../contexts/TenantContext';

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: ParentView;
    setActiveView: (view: ParentView) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; view: ParentView; activeView: ParentView; setActiveView: (view: ParentView) => void; }> = ({ icon, label, view, activeView, setActiveView }) => (
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

const ParentSidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }: SidebarProps) => {
    const { hasFeature } = useTenant();

    const allNavLinks = [
        { view: PARENT_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" />, alwaysVisible: true },
        { view: PARENT_VIEWS.RESULTS, label: 'Results', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <DocumentDuplicateIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.MESSAGES, label: 'Messages', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.ATTENDANCE, label: 'Attendance', icon: <CheckBadgeIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.BEHAVIORAL, label: 'Behavior', icon: <ShieldExclamationIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.NOTIFICATIONS, label: 'Notifications', icon: <BellIcon className="h-5 w-5" />, alwaysVisible: true },
    ];

    const navLinks = allNavLinks.filter(link => link.alwaysVisible || hasFeature(USER_ROLES.PARENT, link.view));

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

export default ParentSidebar;