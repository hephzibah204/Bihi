import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { DashboardView } from './types';
import Header from './components/Header';
import DashboardContent from './components/DashboardContent';
import { supabase } from './services/supabaseClient';
import PortalLogin from './components/PortalLogin';
import { TenantProvider } from './contexts/TenantContext';
import { apiGetTeachers, clearSyncQueue, initializeSync, cleanupSync } from './services/api';
import TeacherDashboard from './components/TeacherDashboard';
import SyncStatusIndicator from './components/SyncStatusIndicator';
import AdminBottomNavBar from './components/AdminBottomNavBar';
import MoreView from './components/MoreView';
import { useSync } from './hooks/useSync';
import ConfirmationModal from './components/ConfirmationModal';
import { PlanFeaturesProvider } from './contexts/PlanFeaturesContext';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import GlobalNotification from './components/GlobalNotification';
import Chatbot from './components/Chatbot';

const Dashboard = () => {
    const [session, setSession] = useState(null); // Supabase session for staff
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeUser, setActiveUser] = useState(null); // Local session for student/parent
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<DashboardView>('dashboard');
    const [headerTitle, setHeaderTitle] = useState('Dashboard');
    const { syncStatus } = useSync();
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

    // Effect to manage the active session (either from sessionStorage for students/parents or Supabase for staff)
    useEffect(() => {
        setLoading(true);

        // 1. Check for active student/parent session first
        try {
            const activeUserSession = sessionStorage.getItem('activeUser');
            if (activeUserSession) {
                const parsedUser = JSON.parse(activeUserSession);
                setActiveUser(parsedUser);
                setUserRole(parsedUser.role);
                initializeSync();
                setLoading(false);
                return;
            }
        } catch (e) {
            sessionStorage.removeItem('activeUser');
        }

        // 2. If no student/parent session, check for staff Supabase session
        if (!supabase) {
            console.error("Supabase client is not initialized.");
            setLoading(false);
            return;
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                const teachers = await apiGetTeachers();
                const currentUser = teachers.find(t => t.email.toLowerCase() === session.user.email.toLowerCase());
                setUserRole(currentUser?.role || 'Admin');
                initializeSync();
            } else {
                setUserRole(null);
                cleanupSync();
            }
            setLoading(false);
        });

        return () => {
            authListener?.subscription?.unsubscribe();
            cleanupSync();
        };
    }, []);

    const handleStudentLoginSuccess = (userData) => {
        setActiveUser(userData);
        setUserRole(userData.role);
    };

    const handleLogout = () => {
        if (syncStatus === 'syncing' || syncStatus === 'unsynced') {
            setLogoutModalOpen(true);
        } else {
            confirmLogout();
        }
    };
    
    const confirmLogout = async () => {
        setLogoutModalOpen(false);
        // Clear both types of sessions
        sessionStorage.removeItem('activeUser');
        setActiveUser(null);
        if (supabase) {
            await supabase.auth.signOut();
        }
        setSession(null);
        setUserRole(null);
        clearSyncQueue();
    };

    useEffect(() => {
        const viewName = activeView.replace(/-/g, ' ');
        setHeaderTitle(viewName.charAt(0).toUpperCase() + viewName.slice(1));
    }, [activeView]);

    const handleViewChange = (view: DashboardView) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
    }

    if (!session && !activeUser) {
        return <PortalLogin onStudentLoginSuccess={handleStudentLoginSuccess} />;
    }

    // Render specific dashboards for non-admin roles
    if (userRole === 'Teacher') {
        return <TeacherDashboard onLogout={handleLogout} />;
    }
    if (userRole === 'Student') {
        return <StudentDashboard onLogout={handleLogout} demoUserId={activeUser?.userId} />;
    }
    if (userRole === 'Parent') {
        return <ParentDashboard onLogout={handleLogout} demoUserId={activeUser?.userId} />;
    }

    // Render Admin/Bursar dashboard
    return (
        <TenantProvider>
            <PlanFeaturesProvider>
                <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                    <Sidebar 
                        isSidebarOpen={isSidebarOpen} 
                        setSidebarOpen={setSidebarOpen} 
                        activeView={activeView}
                        setActiveView={handleViewChange}
                        userRole={userRole}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                        <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto">
                            <div className="container mx-auto px-6 py-8">
                                {activeView === 'more' 
                                    ? <MoreView setActiveView={handleViewChange} /> 
                                    : <DashboardContent activeView={activeView} setActiveView={handleViewChange} userRole={userRole} />
                                }
                            </div>
                        </main>
                        <AdminBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
                    </div>
                </div>
                <SyncStatusIndicator />
                 <ConfirmationModal
                    isOpen={isLogoutModalOpen}
                    onClose={() => setLogoutModalOpen(false)}
                    onConfirm={confirmLogout}
                    title="Unsynced Changes"
                    message="You have changes that haven't been saved to the cloud. If you log out now, they may be lost. Are you sure you want to continue?"
                />
                <GlobalNotification />
                <Chatbot userRole={userRole} />
            </PlanFeaturesProvider>
        </TenantProvider>
    );
};

export default Dashboard;
