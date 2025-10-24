import React, { FC } from 'react';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import CheckIcon from './icons/CheckIcon';
import { DashboardView, UserRole } from '../types';
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
        className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 transition-colors duration-200 relative ${
            isActive 
                ? 'text-indigo-600' 
                : 'text-gray-500 hover:text-indigo-600'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        {/* Animated indicator for active state */}
        <span className={`absolute top-0 h-1 w-8 bg-indigo-600 rounded-full transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
        
        {/* The icon passed from navItems already has size classes */}
        {icon}
        
        <span className={`text-xs mt-1 font-semibold transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
            {label}
        </span>
    </button>
);

interface BottomNavBarProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole?: UserRole | null;
}

const AdminBottomNavBar: FC<BottomNavBarProps> = ({ activeView, setActiveView, userRole }) => {
    let navItems: { view: DashboardView; label: string; icon: React.ReactNode }[] = [
        // Fix: Cast string constants to DashboardView
        { view: ADMIN_VIEWS.DASHBOARD as DashboardView, label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.STUDENTS as DashboardView, label: 'Students', icon: <UsersIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.REPORT_CARDS as DashboardView, label: 'Dossier', icon: <DocumentArrowDownIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.ATTENDANCE as DashboardView, label: 'Attendance', icon: <ClipboardListIcon className="h-6 w-6" /> },
        { view: ADMIN_VIEWS.SETTINGS as DashboardView, label: 'Settings', icon: <Cog6ToothIcon className="h-6 w-6" /> },
    ];

    // Finance-focused nav for Bursar
    if (userRole === 'Bursar') {
        navItems = [
            { view: ADMIN_VIEWS.DASHBOARD as DashboardView, label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
            { view: ADMIN_VIEWS.BURSARY as DashboardView, label: 'Fee Setup', icon: <BanknotesIcon className="h-6 w-6" /> },
            { view: ADMIN_VIEWS.BURSARY as DashboardView, label: 'Record Payment', icon: <CheckIcon className="h-6 w-6" /> },
            { view: ADMIN_VIEWS.SETTINGS as DashboardView, label: 'Settings', icon: <Cog6ToothIcon className="h-6 w-6" /> },
        ];
    }

    return (
        <nav className="bottom-nav md:hidden">
            {/* The `bottom-nav` class from index.html is already display:flex.
                The NavItem components are now direct flex children and use flex-1 to distribute space correctly. */}
            {navItems.map((item, index) => (
                <NavItem 
                    key={`bottom-${item.view}-${index}`}
                    icon={item.icon}
                    label={item.label}
                    view={item.view}
                    isActive={activeView === item.view}
                    onClick={(view) => {
                        try {
                            if (item.label === 'Fee Setup') {
                                localStorage.setItem('bursaryInitialTab', 'fees');
                            } else if (item.label === 'Record Payment') {
                                localStorage.setItem('openQuickRecordPayment', 'true');
                                localStorage.setItem('bursaryInitialTab', 'dashboard');
                            } else {
                                localStorage.removeItem('bursaryInitialTab');
                            }
                        } catch (e) {
                            // no-op
                        }
                        setActiveView(view);
                    }}
                />
            ))}
        </nav>
    );
};

export default AdminBottomNavBar;