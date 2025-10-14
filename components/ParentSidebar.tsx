import React from 'react';
import { ParentView } from '../types';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import HomeIcon from './icons/HomeIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import WalletIcon from './icons/WalletIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { PARENT_VIEWS } from '../utils/constants';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import CalendarMinusIcon from './icons/CalendarMinusIcon';

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

export const ParentSidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }: SidebarProps) => {

    const navLinks = [
        { view: PARENT_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.RESULTS, label: 'Results', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.FEES, label: 'Fees', icon: <WalletIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.ATTENDANCE, label: 'Attendance', icon: <CheckBadgeIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.BEHAVIORAL, label: 'Behavioral', icon: <ShieldExclamationIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <DocumentTextIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.MESSAGES, label: 'Messages', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.PROFILE, label: 'My Profile', icon: <UserCircleIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.EVENTS, label: 'Events', icon: <CalendarDaysIcon className="h-5 w-5" /> },
        { view: PARENT_VIEWS.REPORT_ABSENCE, label: 'Report Absence', icon: <CalendarMinusIcon className="h-5 w-5" /> },
    ];

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
                     <div className="flex items-center space-x-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold">Parent Portal</span>
                    </div>
                    <button className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navLinks.map(link => (
                        <NavLink key={link.view} {...link} activeView={activeView} setActiveView={setActiveView} />
                    ))}
                </nav>
            </aside>
        </>
    );
};
