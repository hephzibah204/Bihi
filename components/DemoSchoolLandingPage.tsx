import React, { FC, useState, useEffect } from 'react';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import UsersGroupIcon from './icons/UsersGroupIcon';
import { apiGetStudents } from '../services/api';
import { DEMO_TENANT_ID } from '../utils/demoData';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { USER_ROLES } from '../utils/constants';

interface RoleCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const RoleCard: FC<RoleCardProps> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-200 flex items-start space-x-4"
    >
        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="mt-1 text-gray-600">{description}</p>
        </div>
    </button>
);

interface DemoSchoolLandingPageProps {
    onSelectProfile: (profile: { role: string, userId?: string }) => void;
}

const DemoSchoolLandingPage: FC<DemoSchoolLandingPageProps> = ({ onSelectProfile }) => {
    const schoolLogo = "https://i.imgur.com/gKEBi1f.png";
    const [selectionStep, setSelectionStep] = useState('role'); // 'role', 'student', 'parent'
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleExitDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        sessionStorage.removeItem('isDemoMode');
        sessionStorage.removeItem('activeUser'); // Ensure full cleanup
        window.location.href = '/';
    };

    const handleRoleClick = async (role: string) => {
        if (role === USER_ROLES.STUDENT || role === USER_ROLES.PARENT) {
            setLoading(true);
            // Fix: Corrected apiGetStudents call to match its definition (0-1 arguments).
            const demoStudents = await apiGetStudents();
            setStudents(demoStudents);
            setSelectionStep(role);
            setLoading(false);
        } else {
            onSelectProfile({ role });
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading students...</div>;
    }

    if (selectionStep === USER_ROLES.STUDENT || selectionStep === USER_ROLES.PARENT) {
        return (
             <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold text-center mb-6">Select a {selectionStep} profile to view</h1>
                <div className="w-full max-w-2xl space-y-4">
                    {students.map(student => (
                        <button 
                            key={student.id} 
                            onClick={() => onSelectProfile({ role: selectionStep, userId: student.id })}
                            className="w-full flex items-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
                        >
                            <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full mr-4"/>
                            <span className="font-semibold text-lg">{student.name}</span>
                        </button>
                    ))}
                </div>
                 <button onClick={() => setSelectionStep('role')} className="mt-8 flex items-center text-indigo-600 font-semibold">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Roles
                </button>
                <div className="mt-8 text-center">
                    <a href="/" onClick={handleExitDemo} className="font-medium text-gray-500 hover:text-indigo-500 text-sm">
                        Exit Demo and return to Main Site
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <header className="text-center">
                <img src={schoolLogo} alt="School Logo" className="w-20 h-20 mx-auto mb-4 rounded-full" />
                <h1 className="text-4xl font-bold text-gray-800">Welcome to Brightstar Academy</h1>
                <p className="mt-2 text-lg text-gray-600">
                    Experience the platform from every perspective.
                </p>
            </header>

            <main className="mt-12 w-full max-w-4xl">
                <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Choose a role to sign in as:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <RoleCard 
                        icon={<UsersIcon className="w-6 h-6" />}
                        title={USER_ROLES.ADMIN}
                        description="Manage school settings, students, teachers, and view analytics."
                        onClick={() => handleRoleClick(USER_ROLES.ADMIN)}
                    />
                    <RoleCard 
                        icon={<BriefcaseIcon className="w-6 h-6" />}
                        title={USER_ROLES.TEACHER}
                        description="Manage your classes, enter scores, and generate report cards."
                        onClick={() => handleRoleClick(USER_ROLES.TEACHER)}
                    />
                    <RoleCard 
                        icon={<AcademicCapIcon className="w-6 h-6" />}
                        title={USER_ROLES.STUDENT}
                        description="View your results, check your timetable, and access the AI tutor."
                        onClick={() => handleRoleClick(USER_ROLES.STUDENT)}
                    />
                    <RoleCard 
                        icon={<UsersGroupIcon className="w-6 h-6" />}
                        title={USER_ROLES.PARENT}
                        description="Monitor your child's performance, attendance, and results."
                        onClick={() => handleRoleClick(USER_ROLES.PARENT)}
                    />
                </div>
            </main>
             <div className="mt-12 text-center">
                <a href="/" onClick={handleExitDemo} className="font-medium text-gray-500 hover:text-indigo-500">
                    Exit Demo and return to Main Site
                </a>
            </div>
        </div>
    );
};

export default DemoSchoolLandingPage;
