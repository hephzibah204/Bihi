import React from 'react';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import UsersIcon from './icons/UsersIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { TeacherView } from '../types';

const TeacherHome = ({ setActiveView }: { setActiveView: (view: TeacherView) => void }) => {
    // Fix: Explicitly type the `quickLinks` array to ensure `link.view` is of type `TeacherView`, not a generic `string`.
    const quickLinks: { view: TeacherView; title: string; icon: React.ReactNode; description: string; }[] = [
        { view: 'enter-scores', title: "Enter Scores", icon: <ClipboardListIcon className="w-8 h-8"/>, description: "Input the latest CA and exam scores." },
        { view: 'my-schedule', title: "View My Schedule", icon: <CalendarDaysIcon className="w-8 h-8"/>, description: "Check your weekly teaching timetable." },
        { view: 'my-students', title: "My Students", icon: <UsersIcon className="w-8 h-8"/>, description: "View students in your assigned classes." },
        { view: 'ai-tools', title: "AI Teacher Tools", icon: <BrainCircuitIcon className="w-8 h-8"/>, description: "Use AI to plan lessons and write comments." },
    ];

    return (
        <div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome! Here are some quick actions to get you started.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {quickLinks.map(link => (
                    <button 
                        key={link.view} 
                        onClick={() => setActiveView(link.view)}
                        className="card p-6 text-center hover:shadow-lg hover:scale-105 transition-transform duration-200"
                    >
                        <div className="text-indigo-500 mx-auto w-16 h-16 flex items-center justify-center bg-indigo-100 dark:bg-gray-700 rounded-full">
                            {link.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{link.title}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TeacherHome;