import React from 'react';
import Bars3Icon from './icons/Bars3Icon';
import LogoutIcon from './icons/LogoutIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../hooks/useTheme';

const Header = ({ setSidebarOpen, onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    const defaultLogoutHandler = async () => {
        if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error logging out:', error.message);
            }
        }
    };

    const handleLogout = onLogout || defaultLogoutHandler;

    return (
        <header className="flex-shrink-0 flex justify-between items-center h-20 px-6 bg-card-bg-light dark:bg-card-bg-dark shadow-sm">
            <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="text-slate-500 focus:outline-none md:hidden">
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            <div className="flex items-center space-x-2">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                </button>
                <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    aria-label="Logout"
                >
                    <LogoutIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;