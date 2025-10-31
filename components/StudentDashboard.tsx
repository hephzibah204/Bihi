
import React, { useState, useEffect, lazy, Suspense } from 'react';
import StudentSidebar from './StudentSidebar';
import Header from './Header';
import { StudentView } from '../types';
import StudentBottomNavBar from './StudentBottomNavBar';
import { STUDENT_VIEWS } from '../utils/constants';
// Floating Chatbot removed; assistant is available under AI Tools
import SpinnerIcon from './icons/SpinnerIcon';

const StudentDashboardContent = lazy(() => import('./StudentDashboardContent'));

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const getViewFromUrl = () => new URLSearchParams(window.location.search).get('view');

const StudentDashboard = ({ onLogout, demoUserId }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<StudentView>(getViewFromUrl() as StudentView || STUDENT_VIEWS.DASHBOARD);
    const [headerTitle, setHeaderTitle] = useState('Dashboard');

    useEffect(() => {
        const handlePopState = () => {
            setActiveView(getViewFromUrl() as StudentView || STUDENT_VIEWS.DASHBOARD);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const viewName = (activeView || '').replace(/-/g, ' ');
        const capitalizedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        setHeaderTitle(capitalizedTitle);
    }, [activeView]);

    const handleViewChange = (view: StudentView) => {
        const url = new URL(window.location.toString());
        url.searchParams.set('view', view);
        window.history.pushState({}, '', url.toString());
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Resolve a reliable demo student id to pass to content
    let resolvedDemoId: string | undefined = demoUserId;
    if (!resolvedDemoId && typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem('activeUser');
            const active = raw ? JSON.parse(raw) : null;
            if (active?.userId) resolvedDemoId = active.userId;
        } catch {}
    }
    // Final fallback: default seeded demo student id
    if (!resolvedDemoId) {
        resolvedDemoId = 'stud_1';
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <StudentSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} activeView={activeView} setActiveView={handleViewChange} />
            <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} isSidebarOpen={isSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <Suspense fallback={<ContentLoader />}>
                            <StudentDashboardContent activeView={activeView} setActiveView={handleViewChange} demoUserId={resolvedDemoId} />
                        </Suspense>
                    </div>
                </main>
                <StudentBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
            </div>
            {/* Chat assistant moved under AI Tools */}
        </div>
    );
};

export default StudentDashboard;
