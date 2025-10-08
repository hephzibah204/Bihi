import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import Bars3Icon from './icons/Bars3Icon';
import { DashboardView } from '../types';
import { ADMIN_VIEWS } from '../utils/constants';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    view: DashboardView;
    isActive: boolean;
    onClick: (view: DashboardView) => void;
}

const NavItem: FC<NavItemProps> = ({ icon, label, view, isActive, onClick }) => (
    <button 
        onClick={() => onClick(view)}
        className={`flex flex-col items-center justify-center w-full h-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
    >
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);

interface BottomNavBarProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
}

const AdminBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: DashboardView; label: string; icon: React.ReactNode }[] = [
        { view: ADMIN_VIEWS.DASHBOARD, label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.REPORT_CARDS, label: 'Dossier', icon: <DocumentArrowDownIcon className="h-8 w-8" /> },
        { view: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <ClipboardListIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.MORE, label: 'More', icon: <Bars3Icon className="h-6 w-6" /> },
    ];

    return (
        <nav className="bottom-nav md:hidden" style={{ height: '70px' }}>
            <div className="flex justify-around items-center h-full">
                {navItems.map((item, index) => {
                    const isActive = activeView === item.view;
                    if (index === 2) { // The middle "Dossier" button
                        return (
                            <div key={item.view} className="w-full flex justify-center">
                                <button 
                                    onClick={() => setActiveView(item.view)}
                                    className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg transform -translate-y-4 transition-transform hover:scale-110"
                                    aria-label={item.label}
                                >
                                    {item.icon}
                                </button>
                            </div>
                        );
                    }
                    return (
                        <NavItem 
                            key={item.view}
                            icon={item.icon}
                            label={item.label}
                            view={item.view}
                            isActive={isActive}
                            onClick={setActiveView}
                        />
                    );
                })}
            </div>
        </nav>
    );
};

export default AdminBottomNavBar;