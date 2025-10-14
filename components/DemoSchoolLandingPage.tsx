
import React from 'react';
import { USER_ROLES } from '../utils/constants';
import Logo from './icons/Logo';
import BriefcaseIcon from './icons/BriefcaseIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import UsersIcon from './icons/UsersIcon';
import WalletIcon from './icons/WalletIcon';

const profiles = [
    { id: 'admin_demo', role: USER_ROLES.ADMIN, name: 'Admin', description: 'Full access to manage the school portal.', icon: <BriefcaseIcon className="w-8 h-8"/> },
    { id: 'bursar_demo', role: USER_ROLES.BURSAR, name: 'Bursar', description: 'Focused access to financial management.', icon: <WalletIcon className="w-8 h-8"/> },
    { id: 'teacher_demo', role: USER_ROLES.TEACHER, name: 'Teacher', description: 'Enter scores, manage students, use AI tools.', icon: <AcademicCapIcon className="w-8 h-8"/> },
    { id: 'stud_1', role: USER_ROLES.STUDENT, name: 'Student', description: 'View results, assignments, and AI tutor.', icon: <UsersIcon className="w-8 h-8"/> },
    { id: 'parent_3', role: USER_ROLES.PARENT, name: 'Parent', description: 'Check your child\'s performance and fees.', icon: <UsersIcon className="w-8 h-8"/> },
];

const DemoSchoolLandingPage = ({ onSelectProfile }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="text-center">
                <Logo className="w-16 h-16 mx-auto text-indigo-600" />
                <h1 className="text-3xl font-bold mt-4 text-gray-800">Brightstar Demo Academy</h1>
                <p className="mt-2 text-gray-600">Choose a profile to explore the ReportSheet platform.</p>
            </div>

            <div className="mt-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map(profile => (
                    <button 
                        key={profile.id}
                        onClick={() => onSelectProfile(profile)}
                        className="card p-6 text-left hover:shadow-lg hover:scale-105 transition-transform duration-200"
                    >
                        <div className="text-indigo-500 w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-lg">
                            {profile.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{profile.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{profile.description}</p>
                    </button>
                ))}
            </div>

             <p className="text-center text-sm text-gray-500 mt-12">
                This is a demo environment. Your changes will not be saved.
                <br/>
                <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                    &larr; Back to Main Site
                </a>
            </p>
        </div>
    );
};

export default DemoSchoolLandingPage;
