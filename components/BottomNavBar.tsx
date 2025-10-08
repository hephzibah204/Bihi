import React from 'react';
import HomeIcon from './icons/HomeIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';

// This is a generic placeholder for a bottom nav bar.
// The app uses StudentBottomNavBar and ParentBottomNavBar specifically.
const BottomNavBar = () => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
            <div className="flex justify-around p-2">
                <button className="flex flex-col items-center text-indigo-600 p-2">
                    <HomeIcon className="w-6 h-6" />
                    <span className="text-xs">Home</span>
                </button>
                <button className="flex flex-col items-center text-gray-500 p-2">
                    <Cog6ToothIcon className="w-6 h-6" />
                    <span className="text-xs">Settings</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNavBar;