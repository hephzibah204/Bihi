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
import { STUDENT_VIEWS } from '../../utils/constants';

const IconBtn = ({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) => (
  <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600" onClick={onClick} title={title}>{children}</button>
);

const TopBarStudent: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const navigateView = (view: string) => { const url = new URL(window.location.toString()); url.searchParams.set('view', view); navigate(url.pathname + url.search + url.hash); };
  const toggleTheme = (dark: boolean) => { if (dark) document.body.setAttribute('data-theme','dark'); else document.body.removeAttribute('data-theme'); };
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-2xl font-semibold text-[#0F172A]">{pageTitle}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 border rounded-full px-3 py-1.5">
          <SearchIcon className="w-4 h-4 text-gray-500" />
          <input className="outline-none text-sm placeholder:text-gray-400" placeholder="Search results, subjects…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') navigateView(STUDENT_VIEWS.RESULTS as any); }} />
        </div>
        <IconBtn title="Light" onClick={() => toggleTheme(false)}><SunIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Dark" onClick={() => toggleTheme(true)}><MoonIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Help" onClick={() => navigateView(STUDENT_VIEWS.PROFILE as any)}><QuestionMarkCircleIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Messages" onClick={() => navigateView(STUDENT_VIEWS.NOTIFICATIONS as any)}><ChatBubbleLeftRightIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Notifications" onClick={() => navigateView(STUDENT_VIEWS.NOTIFICATIONS as any)}><BellIcon className="w-5 h-5" /></IconBtn>
        <IconBtn title="Settings" onClick={() => navigateView(STUDENT_VIEWS.PROFILE as any)}><Cog6ToothIcon className="w-5 h-5" /></IconBtn>
        <div className="relative flex items-center gap-2 ml-2">
          <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1D4ED8]" onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
            <UserCircleIcon className="w-6 h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow p-2 w-40">
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm" onClick={() => { navigateView(STUDENT_VIEWS.PROFILE as any); setMenuOpen(false); }}>Profile</button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm" onClick={() => { navigateView(STUDENT_VIEWS.RESULTS as any); setMenuOpen(false); }}>Results</button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm text-red-600" onClick={() => { logout?.(); setMenuOpen(false); }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBarStudent;