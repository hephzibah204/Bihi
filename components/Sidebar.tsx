import React, { useState, useEffect, ReactNode } from 'react';
import { DashboardView, UserRole } from '../types';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import ArrowUpOnSquareIcon from './icons/ArrowUpOnSquareIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import ClockIcon from './icons/ClockIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import WalletIcon from './icons/WalletIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import XIcon from './icons/XIcon';
import Logo from './icons/Logo';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import CreditCardIcon from './icons/CreditCardIcon';
import UsersGroupIcon from './icons/UsersGroupIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import TableCellsIcon from './icons/TableCellsIcon';

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; view: DashboardView; activeView: DashboardView; setActiveView: (view: DashboardView) => void; isSubLink?: boolean; }> = ({ icon, label, view, activeView, setActiveView, isSubLink = false }) => (
    <button
        onClick={() => setActiveView(view)}
        className={`w-full flex items-center rounded-lg transition-colors duration-200 ${
            isSubLink ? 'px-4 py-2 text-sm' : 'px-4 py-2.5'
        } ${
            activeView === view
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

// Fix: Explicitly typed the props for the AccordionMenu component to resolve TypeScript error.
interface AccordionMenuProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    id: string;
    activeView: DashboardView;
    openMenu: string | null;
    setOpenMenu: (id: string | null) => void;
}

// Fix: Explicitly typing AccordionMenu as a React.FC resolves an issue where TypeScript incorrectly flags the 'key' prop as an error.
const AccordionMenu: React.FC<AccordionMenuProps> = ({ title, icon, children, id, activeView, openMenu, setOpenMenu }) => {
    const isOpen = openMenu === id;
    const isActive = React.Children.toArray(children).some(
        (child: any) => child.props.view === activeView
    );

    return (
        <div>
            <button
                onClick={() => setOpenMenu(isOpen ? null : id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                    isActive && !isOpen ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                <div className="flex items-center">
                    {icon}
                    <span className="ml-3 font-semibold">{title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pl-6 pt-2 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView, userRole }: SidebarProps) => {
    const { hasFeature } = usePlanFeatures();
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // --- ADMIN links and structure ---
    const menuStructure = [
        {
            id: 'academics',
            title: 'Academics',
            icon: <BookOpenIcon className="h-5 w-5" />,
            links: [
                { view: ADMIN_VIEWS.REPORT_CARDS, label: 'Dossier', icon: <DocumentArrowDownIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <TableCellsIcon className="h-5 w-5" /> },
            ]
        },
        {
            id: 'records',
            title: 'Records & Setup',
            icon: <PencilSquareIcon className="h-5 w-5" />,
            links: [
                { view: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <BookOpenIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.RESULTS, label: 'Enter Scores', icon: <ClipboardListIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.GENERAL_REMARKS, label: 'General Remarks', icon: <PencilSquareIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <ClipboardListIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <ClockIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <ArrowUpOnSquareIcon className="h-5 w-5" /> },
            ]
        },
        {
            id: 'management',
            title: 'Management',
            icon: <UsersIcon className="h-5 w-5" />,
            links: [
                { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.TEACHERS, label: 'Teachers', icon: <UsersIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <ClipboardListIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.BEHAVIORAL, label: 'Behavioral Remarks', icon: <ShieldExclamationIcon className="h-5 w-5" /> },
            ]
        },
        {
            id: 'finance',
            title: 'Finance',
            icon: <WalletIcon className="h-5 w-5" />,
            links: [
                { view: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.BILLING, label: 'Billing & Plan', icon: <CreditCardIcon className="h-5 w-5" /> },
            ]
        },
        {
            id: 'tools',
            title: 'Tools',
            icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
            links: [
                { view: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="h-5 w-5" /> },
                { view: ADMIN_VIEWS.ID_CARDS, label: 'ID Cards', icon: <IdentificationIcon className="h-5 w-5" /> },
            ]
        },
        {
            id: 'alumni',
            title: 'Alumni',
            icon: <UsersGroupIcon className="h-5 w-5" />,
            links: [
                 { view: ADMIN_VIEWS.ALUMNI, label: 'Alumni Directory', icon: <UsersGroupIcon className="h-5 w-5" /> },
            ]
        }
    ];

    useEffect(() => {
        // Find which group the active view belongs to and open that accordion
        const parentMenu = menuStructure.find(group => group.links.some(link => link.view === activeView));
        if (parentMenu) {
            setOpenMenu(parentMenu.id);
        }
    }, [activeView]);
    
    // --- BURSAR-specific links ---
    if (userRole === USER_ROLES.BURSAR) {
        const bursarNavLinks = [
            { view: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
            { view: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="h-5 w-5" /> },
            { view: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersIcon className="h-5 w-5" /> },
        ];
        return (
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* ... header ... */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {bursarNavLinks.map(link => hasFeature(link.view) && <NavLink key={link.view} {...link} activeView={activeView} setActiveView={setActiveView} />)}
                </nav>
            </aside>
        );
    }

    return (
        <>
            {/* Mobile overlay */}
            <div 
                className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            <aside 
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                id="sidebar"
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
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Top-level static links */}
                    <NavLink view={ADMIN_VIEWS.DASHBOARD} label="Dashboard" icon={<HomeIcon className="h-5 w-5" />} activeView={activeView} setActiveView={setActiveView} />
                    <NavLink view={ADMIN_VIEWS.COMMUNICATIONS} label="Communications" icon={<EnvelopeIcon className="h-5 w-5" />} activeView={activeView} setActiveView={setActiveView} />

                    <div className="pt-2 mt-2 border-t"></div>

                    {/* Accordion Menus */}
                    {menuStructure.map(group => (
                        hasFeature(group.id) && 
                        <AccordionMenu key={group.id} id={group.id} title={group.title} icon={group.icon} activeView={activeView} openMenu={openMenu} setOpenMenu={setOpenMenu}>
                            {group.links.filter(link => hasFeature(link.view)).map(link => (
                                <NavLink key={link.view} view={link.view} label={link.label} icon={link.icon} activeView={activeView} setActiveView={setActiveView} isSubLink />
                            ))}
                        </AccordionMenu>
                    ))}
                    
                    {/* Bottom static link */}
                    <div className="pt-2 mt-2 border-t">
                        <NavLink view={ADMIN_VIEWS.SETTINGS} label="Settings" icon={<Cog6ToothIcon className="h-5 w-5" />} activeView={activeView} setActiveView={setActiveView} />
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;