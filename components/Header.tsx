import React, { useContext } from 'react';
import Bars3Icon from './icons/Bars3Icon';
import LogoutIcon from './icons/LogoutIcon';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    title: string;
    setSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, setSidebarOpen, onLogout, isSidebarOpen }) => {
    const auth = useAuth();
    const displayName = (() => {
        const u = auth?.user;
        if (!u) return null;
        return (u as any).name || (u as any).fullName || (u as any).firstName || (u as any).email?.split('@')[0] || null;
    })();
    return (
        <header className="flex justify-between items-center h-16 px-6 bg-white border-b border-gray-200">
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="md:hidden text-gray-500 focus:outline-none"
                aria-label="Open sidebar"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-baseline gap-3">
                <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
                {displayName && (
                    <span className="text-sm text-gray-500">Welcome {displayName}</span>
                )}
            </div>
            <button
                onClick={onLogout}
                className="flex items-center text-sm text-gray-500 hover:text-red-600"
                aria-label="Logout"
            >
                <LogoutIcon className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Logout</span>
            </button>
        </header>
    );
};

export default Header;