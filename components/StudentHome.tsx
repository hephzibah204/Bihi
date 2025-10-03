import React from 'react';
import ClipboardListIcon from './icons/ClipboardListIcon';
import ClockIcon from './icons/ClockIcon';
import { StudentView } from '../types';
import HeadsetIcon from './icons/HeadsetIcon';
import { STUDENT_VIEWS } from '../utils/constants';

const StudentHome = ({ setActiveView }: { setActiveView: (view: StudentView) => void }) => {
    const quickLinks = [
        { view: STUDENT_VIEWS.RESULTS, title: "View My Results", icon: <ClipboardListIcon className="w-8 h-8"/>, description: "Check your latest scores and grades." },
        { view: STUDENT_VIEWS.AI_TUTOR, title: "AI Academic Tutor", icon: <HeadsetIcon className="w-8 h-8"/>, description: "Have a voice conversation with an AI tutor." },
        { view: STUDENT_VIEWS.TIMETABLE, title: "Check Timetable", icon: <ClockIcon className="w-8 h-8"/>, description: "See your class schedule for the week." },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Welcome, Student!</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Here's a quick overview of your portal.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
             <div className="card mt-6">
                <div className="p-6">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <p className="mt-2 text-gray-500">No new notifications.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentHome;
