import React, { useState, useEffect } from 'react';
import StudentSidebar from './StudentSidebar';
import Header from './Header';
import StudentDashboardContent from './StudentDashboardContent';
import StudentBottomNavBar from './StudentBottomNavBar';
import SandboxBanner from './SandboxBanner';
// Fix: Import StudentView from the central types file to break a circular dependency.
import { StudentView } from '../types';
import Chatbot from './Chatbot';

interface StudentDashboardProps {
    isDemo?: boolean;
    onLogout?: (() => void) | null;
    demoUserId?: string | null;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ isDemo = false, onLogout = null, demoUserId = null }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<StudentView>('dashboard');
    // Fix: Add headerTitle state to dynamically update the header.
    const [headerTitle, setHeaderTitle] = useState('Dashboard');

    const handleViewChange = (view: StudentView) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Fix: Add useEffect to update header title when activeView changes.
    useEffect(() => {
        const viewName = activeView.replace(/-/g, ' ').replace('ai', 'AI');
        setHeaderTitle(viewName.charAt(0).toUpperCase() + viewName.slice(1));
    }, [activeView]);

    return (
        <>
            {isDemo && <SandboxBanner />}
            <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isDemo ? 'pt-12' : ''}`}>
                <StudentSidebar 
                    isSidebarOpen={isSidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    activeView={activeView}
                    setActiveView={handleViewChange}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Fix: Pass the missing 'title' prop to the Header component. */}
                    <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
                        <div className="container mx-auto px-6 py-8">
                            <StudentDashboardContent activeView={activeView} setActiveView={handleViewChange} demoUserId={demoUserId} />
                        </div>
                    </main>
                    <StudentBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
                </div>
                <Chatbot />
            </div>
        </>
    );
};

export default StudentDashboard;
