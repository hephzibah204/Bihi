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
        <header className="flex justify-between items-center py-4 px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
            <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none md:hidden">
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                </button>
                <button 
                    onClick={handleLogout} 
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Logout"
                >
                    <LogoutIcon className="h-5 w-5 mr-1" />
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
