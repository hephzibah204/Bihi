import React, { useState, useEffect } from 'react';
// Fix: Correctly import TeacherView from the central types file, not from TeacherSidebar.
import TeacherSidebar from './TeacherSidebar';
import { TeacherView } from '../types';
import Header from './Header';
import TeacherDashboardContent from './TeacherDashboardContent';
import { supabase } from '../services/supabaseClient';
import PortalLogin from './PortalLogin'; // Teachers can use the same login
import SandboxBanner from './SandboxBanner';
import TeacherBottomNavBar from './TeacherBottomNavBar';
import TeacherMoreView from './TeacherMoreView';
import Chatbot from './Chatbot';

interface TeacherDashboardProps {
    isDemo?: boolean;
    onLogout?: () => void;
}

const TeacherDashboard = ({ isDemo = false, onLogout = null }: TeacherDashboardProps) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(!isDemo); // Don't show loading in demo
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<TeacherView>('dashboard');
    // Fix: Add headerTitle state to dynamically update the header.
    const [headerTitle, setHeaderTitle] = useState('Dashboard');

    useEffect(() => {
        if (isDemo) return;

        if (!supabase) {
            setLoading(false);
            return;
        }
        const getSession = async () => {
            // FIX: Defensively destructure session data to prevent crash if 'data' is null.
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching session for teacher:", error);
            }
            setSession(data?.session ?? null);
            setLoading(false);
        };
        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => authListener?.subscription?.unsubscribe();
    }, [isDemo]);
    
    // Fix: Add useEffect to update header title when activeView changes.
    useEffect(() => {
        const viewName = activeView.replace(/-/g, ' ').replace('ai', 'AI');
        setHeaderTitle(viewName.charAt(0).toUpperCase() + viewName.slice(1));
    }, [activeView]);
    
    const handleViewChange = (view: TeacherView) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isDemo && !session) {
        // Fix: Added a no-op function for the onStudentLoginSuccess prop to satisfy PortalLogin's requirements, as this flow is for staff login.
        return <PortalLogin onStudentLoginSuccess={() => {}} />;
    }

    return (
        <>
            {isDemo && <SandboxBanner />}
            <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${isDemo ? 'pt-12' : ''}`}>
                <TeacherSidebar 
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
                            {activeView === 'more' ? <TeacherMoreView setActiveView={handleViewChange} /> : <TeacherDashboardContent activeView={activeView} setActiveView={handleViewChange} />}
                        </div>
                    </main>
                    <Chatbot />
                    <TeacherBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
                </div>
            </div>
        </>
    );
};

export default TeacherDashboard;
