

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
// Fix: Import `UserRole` type to correctly type the `userRole` state.
import { DashboardView, UserRole } from '../types';
import Header from './Header';
import DashboardContent from './DashboardContent';
// Fix: Corrected import path for supabase client
import { supabase } from '../services/supabaseClient';
import PortalLogin from './PortalLogin';
import { TenantProvider } from '../contexts/TenantContext';
import { apiGetTeachers, clearSyncQueue, initializeSync, cleanupSync, apiForceSync } from '../services/api';
import TeacherDashboard from './TeacherDashboard';
import SyncStatusIndicator from './SyncStatusIndicator';
import AdminBottomNavBar from './AdminBottomNavBar';
import MoreView from './MoreView';
import { useSync } from '../hooks/useSync';
import ConfirmationModal from './ConfirmationModal';
import { PlanFeaturesProvider } from '../contexts/PlanFeaturesContext';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './ParentDashboard';
import GlobalNotification from './GlobalNotification';
import Chatbot from './Chatbot';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';

const getViewFromUrl = () => new URLSearchParams(window.location.search).get('view');
const getStudentIdFromUrl = () => new URLSearchParams(window.location.search).get('studentId');

const Dashboard = () => {
    const [session, setSession] = useState(null); // Supabase session for staff
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [activeUser, setActiveUser] = useState(null); // Local session for student/parent
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState<DashboardView>(getViewFromUrl() || ADMIN_VIEWS.DASHBOARD);
    const [profileStudentId, setProfileStudentId] = useState<string | null>(getStudentIdFromUrl());
    const [headerTitle, setHeaderTitle] = useState('Dashboard');
    const { syncStatus } = useSync();
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);

        const handlePopState = () => {
            setActiveView(getViewFromUrl() || ADMIN_VIEWS.DASHBOARD);
            setProfileStudentId(getStudentIdFromUrl());
        };
        window.addEventListener('popstate', handlePopState);

        // --- SESSION MANAGEMENT ---
        // 1. Prioritize Demo Session
        const activeUserSession = sessionStorage.getItem('activeUser');
        if (activeUserSession) {
            try {
                const parsedUser = JSON.parse(activeUserSession);
                setActiveUser(parsedUser);
                setUserRole(parsedUser.role);
                initializeSync();
                setLoading(false);
                
                // In demo mode, we don't need a Supabase listener.
                // Return a cleanup function that only handles popstate and sync.
                return () => {
                    cleanupSync();
                    window.removeEventListener('popstate', handlePopState);
                };
            } catch (e) {
                sessionStorage.removeItem('activeUser');
                // Fall through to Supabase auth
            }
        }
        
        // 2. Fallback to Real (Supabase) Session if not in demo mode
        if (!supabase) {
            setLoading(false); // No demo, no supabase, show login.
            return () => window.removeEventListener('popstate', handlePopState);
        }
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                const teachers = await apiGetTeachers();
                const currentUser = teachers.find(t => t.email.toLowerCase() === session.user.email.toLowerCase());
                setUserRole(currentUser?.role || USER_ROLES.ADMIN);
                setActiveUser(null); // Ensure no demo user conflicts
                initializeSync();
            } else {
                setActiveUser(null);
                setUserRole(null);
                setSession(null);
                cleanupSync();
            }
            setLoading(false);
        });

        // Effect to check AI service health
        const checkAIHealth = async () => {
            try {
                const response = await fetch('/api/ai/health');
                const data = await response.json();
                if (!response.ok) {
                    console.error('AI Health Check Failed:', data.message);
                    window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: data.message } }));
                }
            } catch (e) {
                console.warn('AI proxy server may not be available. This is expected in local development if a proxy is not running.', e);
            }
        };
        checkAIHealth();

        // Full cleanup for real sessions
        return () => {
            subscription.unsubscribe();
            cleanupSync();
            window.removeEventListener('popstate', handlePopState);
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
        
        if (syncStatus === 'syncing' || syncStatus === 'unsynced') {
            const syncSuccess = await apiForceSync();
            if (!syncSuccess) {
                console.warn("Final sync attempt failed. Proceeding with logout.");
            }
        }

        // A demo logout is only valid if there's no staff session AND the demo flag is set.
        const isDemoLogout = !session && sessionStorage.getItem('isDemoMode') === 'true';

        // Clear all session types
        sessionStorage.removeItem('activeUser');
        sessionStorage.removeItem('isDemoMode');
        setActiveUser(null);
        if (supabase) {
            await supabase.auth.signOut();
        }
        setSession(null);
        setUserRole(null);
        clearSyncQueue();
        
        if (isDemoLogout) {
            // Go to demo selection page on logout from demo
            window.location.href = '/?view=demo';
        } else {
            // Go to root page on logout from any real session
            window.location.href = '/';
        }
    };

    useEffect(() => {
        let title = 'Dashboard';
        if (activeView === ADMIN_VIEWS.STUDENT_PROFILE) {
            title = 'Student Profile';
        } else if (activeView === ADMIN_VIEWS.COMPREHENSIVE_ENTRY) {
            title = 'Dossier';
        } else {
            const viewName = (activeView || '').replace(/-/g, ' ');
            title = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        }
        setHeaderTitle(title);
        document.title = `${title} | ReportSheet`;
    }, [activeView]);


    const handleViewChange = (view: DashboardView) => {
        const url = new URL(window.location.toString());
        url.searchParams.set('view', view);
        if (view !== ADMIN_VIEWS.STUDENT_PROFILE) {
            url.searchParams.delete('studentId');
            setProfileStudentId(null);
        }
        window.history.pushState({}, '', url.toString());
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }
    
    const handleViewStudentProfile = (studentId: string) => {
        const url = new URL(window.location.toString());
        url.searchParams.set('view', ADMIN_VIEWS.STUDENT_PROFILE);
        url.searchParams.set('studentId', studentId);
        window.history.pushState({}, '', url.toString());
        setProfileStudentId(studentId);
        setActiveView(ADMIN_VIEWS.STUDENT_PROFILE);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
    }

    if (!session && !activeUser) {
        return <PortalLogin onStudentLoginSuccess={handleStudentLoginSuccess} />;
    }

    // Render specific dashboards for non-admin roles
    if (userRole === USER_ROLES.TEACHER) {
        return <TeacherDashboard onLogout={handleLogout} />;
    }
    if (userRole === USER_ROLES.STUDENT) {
        return <StudentDashboard onLogout={handleLogout} demoUserId={activeUser?.userId} />;
    }
    if (userRole === USER_ROLES.PARENT) {
        return <ParentDashboard onLogout={handleLogout} demoUserId={activeUser?.userId} />;
    }

    // Render Admin/Bursar dashboard
    return (
        <TenantProvider>
            <PlanFeaturesProvider>
                <div className="flex h-screen bg-gray-100">
                    <Sidebar 
                        isSidebarOpen={isSidebarOpen} 
                        setSidebarOpen={setSidebarOpen} 
                        activeView={activeView}
                        setActiveView={handleViewChange}
                        userRole={userRole}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                        <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto">
                            <div className="container mx-auto px-6 py-8">
                                {activeView === ADMIN_VIEWS.MORE 
                                    ? <MoreView setActiveView={handleViewChange} /> 
                                    : <DashboardContent 
                                        activeView={activeView} 
                                        setActiveView={handleViewChange} 
                                        userRole={userRole}
                                        profileStudentId={profileStudentId}
                                        onViewStudentProfile={handleViewStudentProfile}
                                      />
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