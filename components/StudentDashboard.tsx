import React, { useState, useEffect } from 'react';
import StudentSidebar from './StudentSidebar';
import StudentDashboardContent from './StudentDashboardContent';
import Header from './Header';
import { StudentView } from '../types';
import StudentBottomNavBar from './StudentBottomNavBar';
import { STUDENT_VIEWS } from '../utils/constants';
import Chatbot from './Chatbot';
import { USER_ROLES } from '../utils/constants';

const StudentDashboard = ({ onLogout, demoUserId }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<StudentView>(STUDENT_VIEWS.DASHBOARD);
    const [headerTitle, setHeaderTitle] = useState('Dashboard');

    useEffect(() => {
        const viewName = activeView.replace(/-/g, ' ');
        const capitalizedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        setHeaderTitle(capitalizedTitle);
    }, [activeView]);

    const handleViewChange = (view: StudentView) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <StudentSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} activeView={activeView} setActiveView={handleViewChange} />
            <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} isSidebarOpen={isSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <StudentDashboardContent activeView={activeView} setActiveView={handleViewChange} demoUserId={demoUserId} />
                    </div>
                </main>
                <StudentBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
            </div>
            <Chatbot userRole={USER_ROLES.STUDENT} demoUserId={demoUserId}/>
        </div>
    );
};

export default StudentDashboard;
