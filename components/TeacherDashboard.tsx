import React, { useState, useEffect, lazy, Suspense } from 'react';
import TeacherSidebar from './TeacherSidebar';
import Header from './Header';
import { TeacherView } from '../types';
import SyncStatusIndicator from './SyncStatusIndicator';
import { TEACHER_VIEWS } from '../utils/constants';
import Chatbot from './Chatbot';
import { USER_ROLES } from '../utils/constants';
import SpinnerIcon from './icons/SpinnerIcon';
import TeacherBottomNavBar from './TeacherBottomNavBar';

const TeacherDashboardContent = lazy(() => import('./TeacherDashboardContent'));
const TeacherMoreView = lazy(() => import('./TeacherMoreView'));

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const getViewFromUrl = () => new URLSearchParams(window.location.search).get('view');
const getStudentIdFromUrl = () => new URLSearchParams(window.location.search).get('studentId');

const TeacherDashboard = ({ onLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<TeacherView>(getViewFromUrl() as TeacherView || TEACHER_VIEWS.DASHBOARD);
    const [headerTitle, setHeaderTitle] = useState('Dashboard');
    const [profileStudentId, setProfileStudentId] = useState<string | null>(getStudentIdFromUrl());

    useEffect(() => {
        const handlePopState = () => {
            setActiveView(getViewFromUrl() as TeacherView || TEACHER_VIEWS.DASHBOARD);
            setProfileStudentId(getStudentIdFromUrl());
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const viewName = (activeView || '').replace(/-/g, ' ');
        const capitalizedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        setHeaderTitle(capitalizedTitle);
        document.title = `${capitalizedTitle} | ReportSheet`;
    }, [activeView]);

    const handleViewChange = (view: TeacherView) => {
        const url = new URL(window.location.toString());
        url.searchParams.set('view', view);
        if (view !== TEACHER_VIEWS.STUDENT_PROFILE) {
            url.searchParams.delete('studentId');
            setProfileStudentId(null);
        }
        window.history.pushState({}, '', url.toString());
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleViewStudentProfile = (studentId: string) => {
        const url = new URL(window.location.toString());
        url.searchParams.set('view', TEACHER_VIEWS.STUDENT_PROFILE);
        url.searchParams.set('studentId', studentId);
        window.history.pushState({}, '', url.toString());
        setProfileStudentId(studentId);
        setActiveView(TEACHER_VIEWS.STUDENT_PROFILE as TeacherView);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <TeacherSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} activeView={activeView} setActiveView={handleViewChange} />
            <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} isSidebarOpen={isSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <Suspense fallback={<ContentLoader />}>
                            {activeView === TEACHER_VIEWS.MORE 
                                ? <TeacherMoreView setActiveView={handleViewChange} /> 
                                : <TeacherDashboardContent 
                                    activeView={activeView} 
                                    setActiveView={handleViewChange} 
                                    profileStudentId={profileStudentId}
                                    onViewStudentProfile={handleViewStudentProfile}
                                  />
                            }
                        </Suspense>
                    </div>
                </main>
                <TeacherBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
            </div>
            <SyncStatusIndicator />
            <Chatbot userRole={USER_ROLES.TEACHER} activeView={activeView} />
        </div>
    );
};

export default TeacherDashboard;
