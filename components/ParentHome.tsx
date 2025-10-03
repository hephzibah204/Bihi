import React, { useState, useEffect } from 'react';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import { ParentView } from '../types';
import { apiGetStudents } from '../services/api';
import { PARENT_VIEWS } from '../utils/constants';

const ParentHome = ({ setActiveView, demoUserId }: { setActiveView: (view: ParentView) => void, demoUserId: string }) => {
    const [studentName, setStudentName] = useState('');

    useEffect(() => {
        const fetchStudentName = async () => {
            if (demoUserId) {
                const students = await apiGetStudents();
                const student = students.find(s => s.id === demoUserId);
                if (student) {
                    setStudentName(student.name);
                }
            }
        };
        fetchStudentName();
    }, [demoUserId]);

    const quickLinks = [
        { view: PARENT_VIEWS.RESULTS, title: "View Results", icon: <ClipboardListIcon className="w-8 h-8"/>, description: "Check your child's latest academic performance." },
        { view: PARENT_VIEWS.ATTENDANCE, title: "Attendance Log", icon: <CheckBadgeIcon className="w-8 h-8"/>, description: "View your child's attendance records." },
        { view: PARENT_VIEWS.BEHAVIORAL, title: "Behavioral Remarks", icon: <ShieldExclamationIcon className="w-8 h-8"/>, description: "See comments from teachers about conduct." },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700">Welcome!</h1>
            <p className="mt-2 text-gray-600">You are viewing the portal for <strong>{studentName || 'your child'}</strong>.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {quickLinks.map(link => (
                    <button 
                        key={link.view} 
                        onClick={() => setActiveView(link.view)}
                        className="card p-6 text-center hover:shadow-lg hover:scale-105 transition-transform duration-200"
                    >
                        <div className="text-indigo-500 mx-auto w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full">
                            {link.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{link.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{link.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ParentHome;
