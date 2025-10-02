import React, { useState } from 'react';
import ReportCardDashboard from './ReportCardDashboard';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import SparklesIcon from './icons/SparklesIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import { DashboardView } from '../types';

interface ReportCardProps {
    setActiveView: (view: DashboardView) => void;
}

const ReportCard = ({ setActiveView }: ReportCardProps) => {
    const [showGenerator, setShowGenerator] = useState(false);

    if (showGenerator) {
        return <ReportCardDashboard />;
    }

    const hubItems = [
        {
            title: 'Generate Report Cards',
            description: 'Select a class to generate, view, and print individual reports.',
            icon: <DocumentArrowDownIcon className="w-8 h-8" />,
            action: () => setShowGenerator(true),
        },
        {
            title: 'AI Comment Generator',
            description: 'Use AI to write insightful and personalized student comments.',
            icon: <SparklesIcon className="w-8 h-8" />,
            action: () => setActiveView('ai-tools'),
        },
        {
            title: 'Performance Analytics',
            description: 'View class performance, subject averages, and trends.',
            icon: <ChartBarIcon className="w-8 h-8" />,
            action: () => setActiveView('analytics'),
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Report Cards Hub</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Manage all aspects of report card generation and analysis from here.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {hubItems.map(item => (
                    <button key={item.title} onClick={item.action} className="card p-6 text-left hover:shadow-lg hover:scale-105 transition-transform duration-200">
                        <div className="text-indigo-500 w-16 h-16 flex items-center justify-center bg-indigo-100 dark:bg-gray-700 rounded-lg">
                            {item.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReportCard;