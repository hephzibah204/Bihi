import React, { PropsWithChildren } from 'react';
import AppShell from './AppShell';
import BlueSidebar from './BlueSidebar';
import TopBar from './TopBar';
import HomeIcon from '../icons/HomeIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import DocumentArrowDownIcon from '../icons/DocumentArrowDownIcon';
import TableCellsIcon from '../icons/TableCellsIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import GraduationCapIcon from '../icons/GraduationCapIcon';
import UsersGroupIcon from '../icons/UsersGroupIcon';
import HandRaisedIcon from '../icons/HandRaisedIcon';
import HistoryIcon from '../icons/HistoryIcon';
import PencilIcon from '../icons/PencilIcon';
import BrainCircuitIcon from '../icons/BrainCircuitIcon';
import ChartBarIcon from '../icons/ChartBarIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import PrinterIcon from '../icons/PrinterIcon';
import IdentificationIcon from '../icons/IdentificationIcon';
import WalletIcon from '../icons/WalletIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import Cog6ToothIcon from '../icons/Cog6ToothIcon';
import { ADMIN_VIEWS } from '../../utils/constants';

interface AdminAppShellProps {
  pageTitle: string;
  activeView: string;
  onChangeView: (view: string) => void;
}

const AdminAppShell: React.FC<PropsWithChildren<AdminAppShellProps>> = ({ pageTitle, activeView, onChangeView, children }) => {
  const sidebarItems = [
    { key: ADMIN_VIEWS.DASHBOARD, label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.DASHBOARD },
    { key: ADMIN_VIEWS.RESULTS, label: 'Score Entry', icon: <ClipboardListIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.RESULTS },
    { key: ADMIN_VIEWS.REPORT_CARDS, label: 'Dossier', icon: <DocumentArrowDownIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.REPORT_CARDS },
    { key: ADMIN_VIEWS.BROADSHEET, label: 'Broadsheet', icon: <TableCellsIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.BROADSHEET },
    { key: ADMIN_VIEWS.SUBJECTS, label: 'Subjects', icon: <BookOpenIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.SUBJECTS },
    { key: ADMIN_VIEWS.TIMETABLE, label: 'Timetable', icon: <TableCellsIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.TIMETABLE },
    { key: ADMIN_VIEWS.COMMUNICATIONS, label: 'Announcements', icon: <MegaphoneIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.COMMUNICATIONS },
    { key: ADMIN_VIEWS.PROMOTIONS, label: 'Promotions', icon: <GraduationCapIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.PROMOTIONS },
    { key: ADMIN_VIEWS.STUDENTS, label: 'Students', icon: <UsersGroupIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.STUDENTS },
    { key: ADMIN_VIEWS.ATTENDANCE, label: 'Attendance', icon: <HandRaisedIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.ATTENDANCE },
    { key: ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY, label: 'Teacher Attendance History', icon: <HistoryIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY },
    { key: ADMIN_VIEWS.BEHAVIORAL_REMARKS, label: 'Behavioral', icon: <PencilIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.BEHAVIORAL_REMARKS },
    { key: ADMIN_VIEWS.BURSARY, label: 'Bursary', icon: <WalletIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.BURSARY },
    { key: ADMIN_VIEWS.AI_TOOLS, label: 'AI Tools', icon: <BrainCircuitIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.AI_TOOLS },
    { key: ADMIN_VIEWS.ANALYTICS, label: 'Analytics', icon: <ChartBarIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.ANALYTICS },
    { key: ADMIN_VIEWS.REPORTS, label: 'Reports', icon: <DocumentTextIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.REPORTS },
    { key: ADMIN_VIEWS.PRINT_CENTER, label: 'Print Center', icon: <PrinterIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.PRINT_CENTER },
    { key: ADMIN_VIEWS.ID_CARDS, label: 'ID Cards', icon: <IdentificationIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.ID_CARDS },
    { key: ADMIN_VIEWS.STAFF, label: 'Staff', icon: <BriefcaseIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.STAFF },
    { key: ADMIN_VIEWS.PARENTS, label: 'Parents', icon: <UsersGroupIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.PARENTS },
    { key: ADMIN_VIEWS.SETTINGS, label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" />, active: activeView === ADMIN_VIEWS.SETTINGS },
  ];

  return (
    <div className="min-h-screen flex bg-[#EEF2FF]">
      <BlueSidebar items={sidebarItems} onSelect={onChangeView} />
      <div className="flex-1 flex flex-col">
        <TopBar pageTitle={pageTitle} />
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminAppShell;
