import React, { useState, useEffect } from 'react';
import ParentSidebar from './ParentSidebar';
import ParentDashboardContent from './ParentDashboardContent';
import Header from './Header';
import { ParentView } from '../types';
import SyncStatusIndicator from './SyncStatusIndicator';
import ParentBottomNavBar from './ParentBottomNavBar';
import { PARENT_VIEWS } from '../utils/constants';
import Chatbot from './Chatbot';
import { USER_ROLES } from '../utils/constants';

const getViewFromUrl = () => new URLSearchParams(window.location.search).get('view');

const ParentDashboard = ({ onLogout, demoUserId }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<ParentView>(getViewFromUrl() as ParentView || PARENT_VIEWS.DASHBOARD);
    const [headerTitle, setHeaderTitle] = useState('Parent Dashboard');

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
                        <ParentDashboardContent activeView={activeView} setActiveView={handleViewChange} demoUserId={demoUserId} />
                    </div>
                </main>
                <ParentBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
            </div>
            <SyncStatusIndicator />
            <Chatbot userRole={USER_ROLES.PARENT} demoUserId={demoUserId} activeView={activeView} />
        </div>
    );
};

export default ParentDashboard;