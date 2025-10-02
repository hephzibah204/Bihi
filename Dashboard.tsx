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
    const { syncStatus } = useSync();
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        // 1. Check for active student/parent session first
        try {
            const activeUserSession = sessionStorage.getItem('activeUser');
            if (activeUserSession) {
                setActiveUser(JSON.parse(activeUserSession));
                setLoading(false);
                return; // Found a student/parent, no need to check for staff
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

        const checkUserRole = async (currentSession) => {
            if (currentSession) {
                const teachers = await apiGetTeachers();
                const currentUser = teachers.find(t => t.email.toLowerCase() === currentSession.user.email.toLowerCase());
                setUserRole(currentUser?.role || 'Admin');
            } else {
                setUserRole(null);
            }
            setSession(currentSession);
            setLoading(false);
        };
        
        const getSessionAndRole = async () => {
             const { data, error } = await supabase.auth.getSession();
             if (error) {
                 console.error("Error getting session:", error);
                 setLoading(false);
                 return;
             }
             await checkUserRole(data?.session ?? null);
        };

        getSessionAndRole();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Only act on this if there's no active student/parent user
            if (!sessionStorage.getItem('activeUser')) {
                 await checkUserRole(session);
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (session || activeUser) {
            initializeSync();
        }
        return () => {
            cleanupSync();
        };
    }, [session, activeUser]);

    const handleViewChange = (view: DashboardView) => {
        setActiveView(view);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const handleStaffLogout = () => {
        if (syncStatus === 'unsynced') {
            setLogoutModalOpen(true);
        } else {
            if (supabase) {
                supabase.auth.signOut();
            }
        }
    };

    const confirmStaffLogout = async () => {
        clearSyncQueue();
        setLogoutModalOpen(false);
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    const handleUserLogout = () => {
        if (activeUser) { // It's a student/parent
            sessionStorage.removeItem('activeUser');
            setActiveUser(null);
        } else if (session) { // It's a staff member
            handleStaffLogout();
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading Portal...</div>;
    }

    // Render based on who is logged in
    if (activeUser) {
        if (activeUser.role === 'student') {
            return <StudentDashboard onLogout={handleUserLogout} demoUserId={activeUser.userId} />;
        }
        if (activeUser.role === 'parent') {
            return <ParentDashboard onLogout={handleUserLogout} demoUserId={activeUser.userId} />;
        }
    }
    
    if (session) {
        if (userRole === 'Teacher') {
            return <TeacherDashboard onLogout={handleStaffLogout} />;
        }
        // Default to Admin/Bursar dashboard
        return (
            <TenantProvider>
                <PlanFeaturesProvider>
                    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                        <GlobalNotification />
                        <Sidebar 
                            isSidebarOpen={isSidebarOpen} 
                            setSidebarOpen={setSidebarOpen} 
                            activeView={activeView}
                            setActiveView={handleViewChange}
                            userRole={userRole}
                        />
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <Header setSidebarOpen={setSidebarOpen} onLogout={handleStaffLogout} />
                            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 pb-16 md:pb-0">
                                <div className="container mx-auto px-6 py-8">
                                    {activeView === 'more' ? <MoreView setActiveView={handleViewChange} /> : <DashboardContent activeView={activeView} setActiveView={handleViewChange} userRole={userRole} />}
                                </div>
                            </main>
                            <AdminBottomNavBar activeView={activeView} setActiveView={handleViewChange} />
                        </div>
                        <Chatbot />
                        <SyncStatusIndicator />
                        <ConfirmationModal
                            isOpen={isLogoutModalOpen}
                            onClose={() => setLogoutModalOpen(false)}
                            onConfirm={confirmStaffLogout}
                            title="Logout with Unsynced Changes?"
                            message="You have changes that haven't been saved to the cloud. If you log out now, these changes will be lost. Are you sure you want to continue?"
                        />
                    </div>
                </PlanFeaturesProvider>
            </TenantProvider>
        );
    }
    
    // If no one is logged in, show the portal login page
    return <PortalLogin onStudentLoginSuccess={setActiveUser} />;
};

export default Dashboard;