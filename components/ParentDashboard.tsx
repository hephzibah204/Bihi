import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ParentSidebar } from './ParentSidebar';
import Header from './Header';
import { ParentView } from '../types';
import SyncStatusIndicator from './SyncStatusIndicator';
import ParentBottomNavBar from './ParentBottomNavBar';
import { PARENT_VIEWS } from '../utils/constants';
// Floating Chatbot removed; assistant is available under AI Tools
import SpinnerIcon from './icons/SpinnerIcon';
import { apiGetStudents, getCurrentUser } from '../services/api';

const ParentDashboardContent = lazy(() => import('./ParentDashboardContent'));

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const getViewFromUrl = () => new URLSearchParams(window.location.search).get('view');

const ParentDashboard = ({ onLogout, demoUserId }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<ParentView>(getViewFromUrl() as ParentView || PARENT_VIEWS.DASHBOARD);
    const [headerTitle, setHeaderTitle] = useState('Parent Dashboard');
    const [resolvedChildId, setResolvedChildId] = useState<string | null>(null);

    useEffect(() => {
        const handlePopState = () => {
            setActiveView(getViewFromUrl() as ParentView || PARENT_VIEWS.DASHBOARD);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const viewName = (activeView || '').replace(/-/g, ' ');
        const capitalizedTitle = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        setHeaderTitle(capitalizedTitle);
    }, [activeView]);

    // Resolve a valid child (student) id for parent views
    useEffect(() => {
        const resolveChild = async () => {
            try {
                const students = await apiGetStudents();
                const effectiveId: string | null = demoUserId || null;

                // If the provided demoUserId is a student id, use it directly
                if (effectiveId && students.some(s => s.id === effectiveId)) {
                    setResolvedChildId(effectiveId);
                    return;
                }

                // If the provided demoUserId is a parent id, map to first child
                if (effectiveId) {
                    const child = students.find(s => s.parentId === effectiveId);
                    if (child) {
                        setResolvedChildId(child.id);
                        return;
                    }
                }

                // Try sessionStorage activeUser (demo landing page stores student id for parent profile)
                try {
                    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('activeUser') : null;
                    const active = raw ? JSON.parse(raw) : null;
                    if (active?.userId && students.some(s => s.id === active.userId)) {
                        setResolvedChildId(active.userId);
                        return;
                    }
                } catch {}

                // For authenticated parent, use current user id to map to child
                try {
                    const currentUser = await getCurrentUser();
                    if (currentUser?.id) {
                        const child = students.find(s => s.parentId === currentUser.id) || students[0];
                        if (child) {
                            setResolvedChildId(child.id);
                            return;
                        }
                    }
                } catch {}

                // Fallback to first student
                if (students.length > 0) {
                    setResolvedChildId(students[0].id);
                } else {
                    setResolvedChildId(null);
                }
            } catch {
                setResolvedChildId(demoUserId || null);
            }
        };
        resolveChild();
    }, [demoUserId]);

    const handleViewChange = (view: ParentView) => {
        const url = new URL(window.location.toString());
        url.searchParams.set('view', view);
        window.history.pushState({}, '', url.toString());
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <ParentSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} activeView={activeView} setActiveView={handleViewChange} />
            <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} isSidebarOpen={isSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <Suspense fallback={<ContentLoader />}>
                            <ParentDashboardContent activeView={activeView} setActiveView={handleViewChange} demoUserId={resolvedChildId} />
                        </Suspense>
                    </div>
                </main>
                <ParentBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
            </div>
            <SyncStatusIndicator />
        </div>
    );
};

export default ParentDashboard;