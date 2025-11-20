import React, { useState } from 'react';
import { TeacherView } from '../types';
import Logo from './icons/Logo';
import XIcon from './icons/XIcon';
import { IconHome, IconScoreEntry, IconSchedule, IconAITools, IconHelp, IconPayslips, IconStudents, IconAttendance, IconBroadsheet, IconAssignments, IconResourceHub, IconAICoach, IconMessages, IconNotifications, IconReportCards, IconMonitoring, IconTimetable } from './icons/Standard';
import { TEACHER_VIEWS } from '../utils/constants';
import BookmarkSquareIcon from './icons/BookmarkSquareIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import Bars3Icon from './icons/Bars3Icon';
import UsersIcon from './icons/UsersIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import BellIcon from './icons/BellIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import HeadsetIcon from './icons/HeadsetIcon';

interface SidebarProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; view: TeacherView; activeView: TeacherView; setActiveView: (view: TeacherView) => void; compact?: boolean; }> = ({ icon, label, view, activeView, setActiveView, compact }) => (
    <button
        onClick={() => setActiveView(view)}
        className={`w-full flex items-center ${compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5'} rounded-lg transition-colors duration-200 ${
            activeView === view
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
        }`}
    >
        {icon}
        <span className={`ml-3 ${compact ? 'leading-tight' : ''}`}>{label}</span>
    </button>
);

const TeacherSidebar = ({ isSidebarOpen, setSidebarOpen, activeView, setActiveView }: SidebarProps) => {
    const [compact, setCompact] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        overview: true,
        class: false,
        teaching: false,
        communication: false,
        resources: false,
        support: false,
    });

    const toggle = (sectionId: string) =>
        setExpanded(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

    const groups = [
        {
            id: 'overview',
            title: 'Overview',
            items: [
                { view: TEACHER_VIEWS.DASHBOARD, label: 'Dashboard', icon: <IconHome /> },
                { view: TEACHER_VIEWS.MY_SCHEDULE, label: 'My Schedule', icon: <IconSchedule /> },
                { view: TEACHER_VIEWS.MY_PAYSLIPS, label: 'My Payslips', icon: <IconPayslips /> },
            ]
        },
        {
            id: 'class',
            title: 'Class & Students',
            items: [
                { view: TEACHER_VIEWS.MY_STUDENTS, label: 'My Students', icon: <IconStudents /> },
                { view: TEACHER_VIEWS.ATTENDANCE, label: 'Attendance', icon: <IconAttendance /> },
                { view: TEACHER_VIEWS.ENTER_SCORES, label: 'Enter Scores', icon: <IconScoreEntry /> },
                { view: TEACHER_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <IconBroadsheet /> },
                { view: TEACHER_VIEWS.ASSIGNMENTS, label: 'Assignments', icon: <IconAssignments /> },
                { view: TEACHER_VIEWS.BEHAVIORAL, label: 'Behavioral', icon: <IconReportCards /> },
                { view: TEACHER_VIEWS.REPORT_CARDS, label: 'Report Cards', icon: <IconReportCards /> },
            ]
        },
        {
            id: 'teaching',
            title: 'Teaching & AI',
            items: [
                { view: TEACHER_VIEWS.LESSON_TEMPLATES, label: 'Lesson Templates', icon: <IconReportCards /> },
                { view: TEACHER_VIEWS.RESOURCE_HUB, label: 'Resource Hub', icon: <IconResourceHub /> },
                { view: TEACHER_VIEWS.OPEN_BOOKS, label: 'Open Books', icon: <IconResourceHub /> },
                { view: TEACHER_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <IconAITools /> },
                { view: TEACHER_VIEWS.AI_COACH, label: 'AI Coach', icon: <IconAICoach /> },
                { view: TEACHER_VIEWS.CLASSROOM_MONITORING, label: 'Classroom Monitoring', icon: <IconMonitoring /> },
                { view: TEACHER_VIEWS.MONITORING_CONSENT, label: 'Monitoring Consent', icon: <IconMonitoring /> },
                { view: TEACHER_VIEWS.CBT_ITEM_BANK, label: 'CBT Item Bank', icon: <IconResourceHub /> },
                { view: TEACHER_VIEWS.CBT_EXAM_BUILDER, label: 'CBT Exam Builder', icon: <IconAssignments /> },
                { view: TEACHER_VIEWS.CBT_TIMETABLE, label: 'Exam Timetable', icon: <IconTimetable /> },
            ]
        },
        {
            id: 'communication',
            title: 'Communication',
            items: [
                { view: TEACHER_VIEWS.MESSAGES, label: 'Messages', icon: <IconMessages /> },
                { view: TEACHER_VIEWS.NOTIFICATIONS, label: 'Notifications', icon: <IconNotifications /> },
            ]
        },
        {
            id: 'support',
            title: 'Support',
            items: [
                { view: TEACHER_VIEWS.SETTINGS, label: 'Settings', icon: <DocumentTextIcon className="h-5 w-5" /> },
                { view: TEACHER_VIEWS.HELP, label: 'Help & Support', icon: <IconHelp /> },
                { view: TEACHER_VIEWS.MORE, label: 'More', icon: <Bars3Icon className="h-5 w-5" /> },
                { view: TEACHER_VIEWS.PROFILE, label: 'My Profile', icon: <UsersIcon className="h-5 w-5" /> },
            ]
        },
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
                        <span className="text-xl font-bold">Teacher Portal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                            <input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} />
                            Compact
                        </label>
                        <button className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
                            <XIcon className="h-6 w-6"/>
                        </button>
                    </div>
                </div>
                <nav className="flex-1 p-2 space-y-2">
                    {groups.map(section => (
                        <div key={section.id} className="">
                            <button
                                onClick={() => toggle(section.id)}
                                className={`w-full flex items-center justify-between ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700`}
                                aria-expanded={expanded[section.id]}
                            >
                                <span className="font-medium text-sm">{section.title}</span>
                                <span className="text-xs text-gray-500">{expanded[section.id] ? '−' : '+'}</span>
                            </button>
                            {expanded[section.id] && (
                                <div className={`mt-1 space-y-1 ${compact ? '' : 'pl-1'}`}>
                                    {section.items.map(link => (
                                        <NavLink key={link.view} {...link} activeView={activeView} setActiveView={setActiveView} compact={compact} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default TeacherSidebar;
