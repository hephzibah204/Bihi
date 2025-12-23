import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '../icons/SearchIcon';
import BellIcon from '../icons/BellIcon';
import Cog6ToothIcon from '../icons/Cog6ToothIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import SunIcon from '../icons/SunIcon';
import MoonIcon from '../icons/MoonIcon';
import QuestionMarkCircleIcon from '../icons/QuestionMarkCircleIcon';
import ChatBubbleLeftRightIcon from '../icons/ChatBubbleLeftRightIcon';
import LogoutIcon from '../icons/LogoutIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ADMIN_VIEWS, TEACHER_VIEWS, STUDENT_VIEWS, PARENT_VIEWS, USER_ROLES } from '../../utils/constants';

interface TopBarProps {
  pageTitle: string;
}

const IconBtn = ({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) => (
  <button className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300" onClick={onClick} title={title}>{children}</button>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm1.5 0a.5.5 0 00-.5.5v.786l8 4.5 8-4.5V5.5a.5.5 0 00-.5-.5h-15zM16 11.382V6.5l-5.812 3.269L4 6.5v4.882A1.5 1.5 0 005.5 13h9a1.5 1.5 0 001.5-1.618z" />
    </svg>
);

const TopBar: React.FC<TopBarProps> = ({ pageTitle }) => {
  const { logout, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const navigateView = (view: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set('view', view);
    navigate(url.pathname + url.search + url.hash);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{pageTitle}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 border rounded-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700">
          <SearchIcon className="w-4 h-4 text-gray-500" />
          <input
            className="outline-none text-sm placeholder:text-gray-400 bg-transparent"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigateView(ADMIN_VIEWS.STUDENTS); }}
          />
        </div>
        <IconBtn title="Toggle Theme" onClick={toggleTheme}>
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </IconBtn>
        <IconBtn title="Help" onClick={() => navigateView(ADMIN_VIEWS.HELP)}><QuestionMarkCircleIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Messages" onClick={() => navigateView(ADMIN_VIEWS.COMMUNICATIONS)}><MessageIcon /></IconBtn>
        <IconBtn title="Notifications" onClick={() => navigateView(ADMIN_VIEWS.COMMUNICATIONS)}><BellIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Settings" onClick={() => navigateView(ADMIN_VIEWS.SETTINGS)}><Cog6ToothIcon className="w-5 h-5" /></IconBtn>
        <div className="relative flex items-center gap-2 ml-2">
          <button className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-blue-600" onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
            <UserCircleIcon className="w-6 h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow p-2 w-40">
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm" onClick={() => { 
                let view: string = ADMIN_VIEWS.ADMIN_PROFILE;
                if (role === USER_ROLES.TEACHER) view = (TEACHER_VIEWS as any).PROFILE;
                else if (role === USER_ROLES.STUDENT) view = (STUDENT_VIEWS as any).PROFILE;
                else if (role === USER_ROLES.PARENT) view = (PARENT_VIEWS as any).PROFILE;
                navigateView(view); setMenuOpen(false); 
              }}>Profile</button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm" onClick={() => { navigateView(ADMIN_VIEWS.SETTINGS); setMenuOpen(false); }}>Settings</button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-red-600" onClick={() => { logout?.(); setMenuOpen(false); }}>Logout</button>
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-sm font-medium dark:text-white">Admin</div>
            <div className="text-xs text-gray-500">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
