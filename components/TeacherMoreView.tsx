import React, { FC } from 'react';
import { TeacherView } from '../types';
import LogoutIcon from './icons/LogoutIcon';
import { supabase } from '../functions/supabaseClient';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { TEACHER_VIEWS } from '../utils/constants';

interface TeacherMoreViewProps {
    setActiveView: (view: TeacherView) => void;
}

const TeacherMoreView: FC<TeacherMoreViewProps> = ({ setActiveView }) => {

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };
    
    const menuItems = [
        { view: TEACHER_VIEWS.MY_SCHEDULE, icon: <CalendarDaysIcon className="h-6 w-6" />, label: 'My Schedule' },
        { view: TEACHER_VIEWS.AI_TOOLS, icon: <BrainCircuitIcon className="h-6 w-6" />, label: 'AI Tools' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">More Options</h1>
             <div className="mt-6 space-y-2">
                {menuItems.map(item => (
                    <button 
                        key={item.view}
                        onClick={() => setActiveView(item.view as TeacherView)}
                        className="w-full flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                        {item.icon}
                        <span className="ml-4 font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
            <div className="mt-8">
                 <button 
                    onClick={handleLogout}
                    className="w-full flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-red-600"
                >
                    <LogoutIcon className="h-6 w-6" />
                    <span className="ml-4 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default TeacherMoreView;