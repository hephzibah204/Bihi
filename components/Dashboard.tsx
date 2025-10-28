import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { DashboardView, UserRole } from '../types';
import Header from './Header';
import { supabase } from '../services/supabaseClient';
import PortalLogin from './PortalLogin';
import { TenantProvider } from '../contexts/TenantContext';
import SyncStatusIndicator from './SyncStatusIndicator';
import AdminBottomNavBar from './AdminBottomNavBar';
import { PlanFeaturesProvider } from '../contexts/PlanFeaturesContext';
import GlobalNotification from './GlobalNotification';
import Chatbot from './Chatbot';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import { getSubdomain } from '../utils/subdomain';
import SelectChildModal from './SelectChildModal';
import SpinnerIcon from './icons/SpinnerIcon';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../contexts/AuthContext';

const DashboardContent = lazy(() => import('./DashboardContent'));
const MoreView = lazy(() => import('./MoreView'));
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const ParentDashboard = lazy(() => import('./ParentDashboard'));
const WelcomeModal = lazy(() => import('./WelcomeModal'));

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const Dashboard = () => {
    const { user, role, session, loading, logout } = useAuth();
    // Detect demo mode early so we can bypass locks/gates
    const isDemoMode = typeof window !== 'undefined' && (
        sessionStorage.getItem('isDemoMode') === 'true' ||
        localStorage.getItem('isDemoMode') === 'true'
    );
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('Dashboard');
    const isDemoSubdomain = getSubdomain() === 'demo';
    
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const activeView = (searchParams.get('view') as DashboardView) || ADMIN_VIEWS.DASHBOARD;
    const profileStudentId = searchParams.get('studentId');

    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage('onboardingComplete_v1', false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && role === USER_ROLES.ADMIN) {
            if (isDemoMode) {
                // In demo, skip onboarding entirely
                setHasCompletedOnboarding(true);
                setIsWelcomeModalOpen(false);
            } else if (!hasCompletedOnboarding) {
                setIsWelcomeModalOpen(true);
            }
        }
    }, [loading, role, hasCompletedOnboarding, isDemoMode]);

    useEffect(() => {
        if (!loading && !session && !user && isDemoSubdomain && !isDemoMode) {
            navigate('/demo');
        }
    }, [loading, session, user, isDemoSubdomain, isDemoMode, navigate]);
    
    useEffect(() => {
        let title = 'Dashboard';
        if (activeView === ADMIN_VIEWS.STUDENT_PROFILE) {
            title = 'Student Profile';
        } else if (activeView === ADMIN_VIEWS.COMPREHENSIVE_ENTRY || activeView === ADMIN_VIEWS.REPORT_CARDS) {
            title = 'Dossier';
        } else {
            const viewName = (activeView || '').replace(/-/g, ' ');
            title = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        }
        setHeaderTitle(title);
        document.title = `${title} | ReportSheet`;
    }, [activeView]);

    const handleViewChange = (view: DashboardView) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('view', view);
        if (view !== ADMIN_VIEWS.STUDENT_PROFILE) {
            newSearchParams.delete('studentId');
        }
        setSearchParams(newSearchParams);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }
    
    const handleViewStudentProfile = (studentId: string) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('view', ADMIN_VIEWS.STUDENT_PROFILE);
        newSearchParams.set('studentId', studentId);
        setSearchParams(newSearchParams);
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
    }

    if (!session && !user) {
        if (isDemoSubdomain && !isDemoMode) {
            return <div className="flex items-center justify-center h-screen">Redirecting to demo...</div>;
        }
        
        // Skip login for demo mode
        if (isDemoMode) {
            const demoRole = localStorage.getItem('demoUserRole');
            if (demoRole === USER_ROLES.TEACHER) {
                return (
                    <TenantProvider>
                        <PlanFeaturesProvider>
                            <Suspense fallback={<ContentLoader />}>
                                <TeacherDashboard onLogout={logout} />
                            </Suspense>
                        </PlanFeaturesProvider>
                    </TenantProvider>
                );
            }
            if (demoRole === USER_ROLES.STUDENT) {
                return <Suspense fallback={<ContentLoader />}><StudentDashboard onLogout={logout} demoUserId="demo-student" /></Suspense>;
            }
            if (demoRole === USER_ROLES.PARENT) {
                return <Suspense fallback={<ContentLoader />}><ParentDashboard onLogout={logout} demoUserId="demo-parent" /></Suspense>;
            }
            // Default to admin dashboard for other roles
            return (
                <TenantProvider>
                    <PlanFeaturesProvider>
                        <div className="flex h-screen bg-gray-100">
                            {(() => {
                                const demoRole = localStorage.getItem('demoUserRole');
                                const effectiveRole = demoRole === USER_ROLES.BURSAR ? USER_ROLES.BURSAR : USER_ROLES.ADMIN;
                                return (
                                    <>
                                        <Sidebar 
                                            isSidebarOpen={isSidebarOpen} 
                                            setSidebarOpen={setSidebarOpen} 
                                            activeView={activeView}
                                            setActiveView={handleViewChange}
                                            userRole={effectiveRole}
                                        />
                                        <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                                            <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={logout} isSidebarOpen={isSidebarOpen} />
                                            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                                                <div className="container mx-auto px-6 py-8">
                                                    <Suspense fallback={<ContentLoader />}>
                                                        {activeView === ADMIN_VIEWS.MORE 
                                                            ? <MoreView setActiveView={handleViewChange} /> 
                                                            : <DashboardContent 
                                                                activeView={activeView} 
                                                                setActiveView={handleViewChange}
                                                                userRole={effectiveRole}
                                                                onViewStudentProfile={handleViewStudentProfile}
                                                                profileStudentId={profileStudentId}
                                                            />
                                                        }
                                                    </Suspense>
                                                </div>
                                            </main>
                                        </div>
                                        <AdminBottomNavBar activeView={activeView} setActiveView={handleViewChange} userRole={effectiveRole} />
                                    </>
                                );
                            })()}

                            <SyncStatusIndicator />
                            <GlobalNotification />
                            <Chatbot userRole={(localStorage.getItem('demoUserRole') === USER_ROLES.BURSAR ? USER_ROLES.BURSAR : USER_ROLES.ADMIN) as string} activeView={activeView} />
                        </div>
                    </PlanFeaturesProvider>
                </TenantProvider>
            );
        }
        
        return <PortalLogin onStudentLoginSuccess={() => window.location.reload()} />;
    }

    if (role === USER_ROLES.TEACHER) {
        return (
            <TenantProvider>
                <PlanFeaturesProvider>
                    <Suspense fallback={<ContentLoader />}>
                        <TeacherDashboard onLogout={logout} />
                    </Suspense>
                </PlanFeaturesProvider>
            </TenantProvider>
        );
    }
    if (role === USER_ROLES.STUDENT) {
        return <Suspense fallback={<ContentLoader />}><StudentDashboard onLogout={logout} demoUserId={user?.id} /></Suspense>;
    }
    if (role === USER_ROLES.PARENT) {
        return <Suspense fallback={<ContentLoader />}><ParentDashboard onLogout={logout} demoUserId={user?.id} /></Suspense>;
    }

    return (
        <TenantProvider>
            <PlanFeaturesProvider>
                <>
                {isWelcomeModalOpen && (
                    <Suspense fallback={<div/>}>
                        <WelcomeModal
                            isOpen={isWelcomeModalOpen}
                            onNavigate={(view) => {
                                handleViewChange(view as DashboardView);
                                setIsWelcomeModalOpen(false);
                            }}
                            onClose={() => setIsWelcomeModalOpen(false)}
                            onComplete={() => {
                                setHasCompletedOnboarding(true);
                                setIsWelcomeModalOpen(false);
                            }}
                        />
                    </Suspense>
                )}
                <div className="flex h-screen bg-gray-100">
                    <Sidebar 
                        isSidebarOpen={isSidebarOpen} 
                        setSidebarOpen={setSidebarOpen} 
                        activeView={activeView}
                        setActiveView={handleViewChange}
                        userRole={role}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden main-content-mobile-padding">
                        <Header title={headerTitle} setSidebarOpen={setSidebarOpen} onLogout={logout} isSidebarOpen={isSidebarOpen} />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto">
                            <div className="container mx-auto px-6 py-8">
                                <Suspense fallback={<ContentLoader />}>
                                    {activeView === ADMIN_VIEWS.MORE 
                                        ? <MoreView setActiveView={handleViewChange} /> 
                                        : <DashboardContent 
                                            activeView={activeView} 
                                            setActiveView={handleViewChange} 
                                            userRole={role}
                                            profileStudentId={profileStudentId}
                                            onViewStudentProfile={handleViewStudentProfile}
                                          />
                                    }
                                </Suspense>
                            </div>
                        </main>
                        <AdminBottomNavBar activeView={activeView} setActiveView={handleViewChange} userRole={role} />
                    </div>
                </div>
                <SyncStatusIndicator />
                <GlobalNotification />
                <Chatbot userRole={role as string} activeView={activeView} />
                </>
            </PlanFeaturesProvider>
        </TenantProvider>
    );
};

export default Dashboard;