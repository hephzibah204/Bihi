
import React, { FC } from 'react';
// FIX: Correctly import DashboardView from the central types file.
import { DashboardView } from '../types';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import WalletIcon from './icons/WalletIcon';
import LogoutIcon from './icons/LogoutIcon';
import { supabase } from '../services/supabaseClient';
import { ADMIN_VIEWS } from '../utils/constants';

interface MoreViewProps {
    setActiveView: (view: DashboardView) => void;
}

const MoreView: FC<MoreViewProps> = ({ setActiveView }) => {

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    const menuItems = [
        { view: ADMIN_VIEWS.BURSARY, icon: <WalletIcon className="h-6 w-6" />, label: 'Bursary' },
        { view: ADMIN_VIEWS.ANALYTICS, icon: <ChartBarIcon className="h-6 w-6" />, label: 'Analytics' },
        { view: ADMIN_VIEWS.AI_TOOLS, icon: <BrainCircuitIcon className="h-6 w-6" />, label: 'AI Tools' },
        { view: ADMIN_VIEWS.SETTINGS, icon: <Cog6ToothIcon className="h-6 w-6" />, label: 'Settings' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700">More</h1>
            <div className="mt-6 space-y-2">
                {menuItems.map(item => (
                    <button 
                        key={item.view}
                        onClick={() => setActiveView(item.view as DashboardView)}
                        className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm"
                    >
                        {item.icon}
                        <span className="ml-4 font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-8">
                 <button 
                    onClick={handleLogout}
                    className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm text-red-600"
                >
                    <LogoutIcon className="h-6 w-6" />
                    <span className="ml-4 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default MoreView;
