

import React, { useState } from 'react';
import ReportCardDashboard from './ReportCardDashboard';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import SparklesIcon from './icons/SparklesIcon';
import ChartBarIcon from './icons/ChartBarIcon';
// FIX: Corrected import path for types.
import { DashboardView, TeacherView } from '../types';
// Fix: Corrected the import path for constants to be a relative path.
import { ADMIN_VIEWS } from '../utils/constants';
import PencilSquareIcon from './icons/PencilSquareIcon';

interface ReportCardProps {
    setActiveView: (view: DashboardView | TeacherView) => void;
}

const ReportCard = ({ setActiveView }: ReportCardProps) => {
    const [showGenerator, setShowGenerator] = useState(false);

    if (showGenerator) {
        return <ReportCardDashboard onBack={() => setShowGenerator(false)} />;
    }

    const hubItems = [
         {
            title: 'Dossier',
            description: 'Enter scores, comments, and skills for each student in one place.',
            icon: <PencilSquareIcon className="w-8 h-8" />,
            // FIX: Cast ADMIN_VIEWS constant to DashboardView type.
            action: () => setActiveView(ADMIN_VIEWS.COMPREHENSIVE_ENTRY as DashboardView),
        },
        {
            title: 'Generate & Print Reports',
            description: 'Select a class to generate, view, and print individual reports.',
            icon: <DocumentArrowDownIcon className="w-8 h-8" />,
            action: () => setShowGenerator(true),
        },
        // Removed AI Comment Generator from Dossier Hub; accessible via AI Tools
        {
            title: 'Performance Analytics',
            description: 'View class performance, subject averages, and trends.',
            icon: <ChartBarIcon className="w-8 h-8" />,
            // FIX: Cast ADMIN_VIEWS constant to DashboardView type.
            action: () => setActiveView(ADMIN_VIEWS.ANALYTICS as DashboardView),
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold">Dossier Hub</h1>
            <p className="mt-2 text-gray-600">
                Manage all aspects of report card generation and analysis from here.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {hubItems.map(item => (
                    <button key={item.title} onClick={item.action} className="card p-6 text-left hover:shadow-lg hover:scale-105 transition-transform duration-200">
                        <div className="text-indigo-500 w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-lg">
                            {item.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReportCard;