import React, { useState, useEffect } from 'react';
import ParentSidebar from './ParentSidebar';
import Header from './Header';
import ParentDashboardContent from './ParentDashboardContent';
import ParentBottomNavBar from './ParentBottomNavBar';
import SandboxBanner from './SandboxBanner';
import { ParentView } from '../types';
import Chatbot from './Chatbot';

interface ParentDashboardProps {
    isDemo?: boolean;
    onLogout?: (() => void) | null;
    demoUserId?: string | null;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ isDemo = false, onLogout = null, demoUserId = null }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<ParentView>('dashboard');
    const [headerTitle, setHeaderTitle] = useState('Dashboard');

    const handleViewChange = (view: ParentView) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    useEffect(() => {
        const viewName = activeView.replace(/-/g, ' ').replace('ai', 'AI');
        setHeaderTitle(viewName.charAt(0).toUpperCase() + viewName.slice(1));
    }, [activeView]);

    return (
        <>
            {isDemo && <SandboxBanner />}
            <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isDemo ? 'pt-12' : ''}`}>
                <ParentSidebar 
                    isSidebarOpen={isSidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    activeView={activeView}
                    setActiveView={handleViewChange}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
                        <div className="container mx-auto px-6 py-8">
                            <ParentDashboardContent activeView={activeView} demoUserId={demoUserId} setActiveView={handleViewChange} />
                        </div>
                    </main>
                    <ParentBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
                </div>
                <Chatbot userRole="Parent" demoUserId={demoUserId} />
            </div>
        </>
    );
};

export default ParentDashboard;