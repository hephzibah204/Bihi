import React from 'react';
import SearchIcon from '../icons/SearchIcon';
import BellIcon from '../icons/BellIcon';
import Cog6ToothIcon from '../icons/Cog6ToothIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import SunIcon from '../icons/SunIcon';
import MoonIcon from '../icons/MoonIcon';
import QuestionMarkCircleIcon from '../icons/QuestionMarkCircleIcon';

interface TopBarProps {
  pageTitle: string;
}

const IconBtn = ({ children }: { children: React.ReactNode }) => (
  <button className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">{children}</button>
);

const TopBar: React.FC<TopBarProps> = ({ pageTitle }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-2xl font-semibold text-[#0F172A]">{pageTitle}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 border rounded-full px-3 py-1.5">
          <SearchIcon className="w-4 h-4 text-gray-500" />
          <input className="outline-none text-sm placeholder:text-gray-400" placeholder="Search students, teachers, invoices…" />
        </div>
        <IconBtn><SunIcon className="w-5 h-5" /></IconBtn>
        <IconBtn><MoonIcon className="w-5 h-5" /></IconBtn>
        <IconBtn><QuestionMarkCircleIcon className="w-5 h-5" /></IconBtn>
        <IconBtn><BellIcon className="w-5 h-5" /></IconBtn>
        <IconBtn><Cog6ToothIcon className="w-5 h-5" /></IconBtn>
        <div className="flex items-center gap-2 ml-2">
          <UserCircleIcon className="w-8 h-8 text-[#1D4ED8]" />
          <div className="hidden sm:block">
            <div className="text-sm font-medium">Admin</div>
            <div className="text-xs text-gray-500">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
