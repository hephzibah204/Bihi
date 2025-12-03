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
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import AdminAppShell from './ui/AdminAppShell';
import { getSubdomain } from '../utils/subdomain';
import SelectChildModal from './SelectChildModal';
import SpinnerIcon from './icons/SpinnerIcon';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../contexts/AuthContext';
import Bursary from './Bursary';

const DashboardContent = lazy(() => import('./DashboardContent'));
const MoreView = lazy(() => import('./MoreView'));
import TeacherBlueDashboard from './TeacherBlueDashboard';
const StudentBlueDashboard = lazy(() => import('./StudentBlueDashboard'));
const ParentBlueDashboard = lazy(() => import('./ParentBlueDashboard'));
const WelcomeModal = lazy(() => import('./WelcomeModal'));
const AdminBlueDashboard = lazy(() => import('./AdminBlueDashboard'));
const SimpleAdminDashboard = lazy(() => import('./SimpleAdminDashboard'));
const ReportCardPrintViewer = lazy(() => import('./ReportCardPrintViewer'));
const ReportCardReactPDFViewer = lazy(() => import('./ReportCardReactPDFViewer'));
const MultiPDFViewer = lazy(() => import('./MultiPDFViewer'));

import { ContentLoader } from './ui/LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

// Admin Dashboard with fallback to simple version if complex one fails
const AdminDashboardWithFallback: React.FC<{ setActiveView?: (view: DashboardView) => void }> = ({ setActiveView }) => {
    return (
        <ErrorBoundary fallback={<SimpleAdminDashboard setActiveView={setActiveView} />}>
            <AdminBlueDashboard setActiveView={setActiveView} />
        </ErrorBoundary>
    );
};

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
    const [activeView, setActiveView] = useState<DashboardView>(() => (searchParams.get('view') as DashboardView) || ADMIN_VIEWS.DASHBOARD);
    const profileStudentId = searchParams.get('studentId');
    
    // Check for report card print view
    const isPrintView = searchParams.get('print') === 'report-card';
    const isReactPdfView = searchParams.get('pdf') === 'react';
    const isMultiPdfView = searchParams.get('pdf') === 'multi';
    const printStudentId = searchParams.get('student');
    const printSession = searchParams.get('session');
    const printTerm = searchParams.get('term');
    const printClass = searchParams.get('class');

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

    useEffect(() => {
        const viewFromParams = (searchParams.get('view') as DashboardView) || ADMIN_VIEWS.DASHBOARD;
        setActiveView(prev => (prev === viewFromParams ? prev : viewFromParams));
    }, [searchParams]);

    const handleViewChange = (view: DashboardView) => {
        setActiveView(view);
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
        setActiveView(ADMIN_VIEWS.STUDENT_PROFILE);
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
    }

    // Handle report card print view
    if (isPrintView && printStudentId) {
        if (isMultiPdfView) {
            // Multi-PDF viewer will fetch its own data
            return (
                <TenantProvider>
                    <PlanFeaturesProvider>
                        <Suspense fallback={<ContentLoader />}>
                            <div>Multi-PDF viewer would go here - needs data integration</div>
                        </Suspense>
                    </PlanFeaturesProvider>
                </TenantProvider>
            );
        } else if (isReactPdfView) {
            return (
                <TenantProvider>
                    <PlanFeaturesProvider>
                        <Suspense fallback={<ContentLoader />}>
                            <ReportCardReactPDFViewer
                                studentId={printStudentId}
                                session={printSession || undefined}
                                term={printTerm || undefined}
                                className={printClass || undefined}
                                onBack={() => navigate(-1)}
                            />
                        </Suspense>
                    </PlanFeaturesProvider>
                </TenantProvider>
            );
        } else {
            return (
                <TenantProvider>
                    <PlanFeaturesProvider>
                        <Suspense fallback={<ContentLoader />}>
                            <ReportCardPrintViewer
                                studentId={printStudentId}
                                session={printSession || undefined}
                                term={printTerm || undefined}
                                className={printClass || undefined}
                                onBack={() => navigate(-1)}
                            />
                        </Suspense>
                    </PlanFeaturesProvider>
                </TenantProvider>
            );
        }
    }

    if (!session && !user) {
        if (isDemoSubdomain && !isDemoMode) {
            return <div className="flex items-center justify-center h-screen">Redirecting to demo...</div>;
        }
        
        // Skip login for demo mode
        if (isDemoMode) {
            const demoRole = localStorage.getItem('demoUserRole');
            // Resolve the correct demo user id based on selected profile
            let effectiveDemoStudentId: string | undefined;
            try {
                const activeUserRaw = sessionStorage.getItem('activeUser');
                const activeUser = activeUserRaw ? JSON.parse(activeUserRaw) : null;
                // For a student selection, the Demo landing page passes a valid student id (e.g., 'stud_1')
                if (demoRole === USER_ROLES.STUDENT) {
                    effectiveDemoStudentId = activeUser?.userId || 'stud_1';
                }
                // For a parent selection, map parent id to the first child student id in demo data
                if (demoRole === USER_ROLES.PARENT) {
                    const parentId = activeUser?.userId;
                    // Lazy import to avoid bundling overhead
                    const { CORE_DEMO_DATA } = require('../utils/demoData');
                    const students = CORE_DEMO_DATA?.students || [];
                    const child = students.find((s: any) => s.parentId === parentId) || students[0];
                    effectiveDemoStudentId = child?.id;
                }
            } catch (e) {
                // Fallback if parsing fails
                effectiveDemoStudentId = 'stud_1';
            }
            if (demoRole === USER_ROLES.TEACHER) {
                return (
                    <TenantProvider>
                        <PlanFeaturesProvider>
                            <Suspense fallback={<ContentLoader />}>
                                <TeacherBlueDashboard onLogout={logout} />
                            </Suspense>
                        </PlanFeaturesProvider>
                    </TenantProvider>
                );
            }
            if (demoRole === USER_ROLES.STUDENT) {
                return (
                    <TenantProvider>
                        <PlanFeaturesProvider>
                            <Suspense fallback={<ContentLoader />}>
                                <StudentBlueDashboard onLogout={logout} demoUserId={effectiveDemoStudentId} />
                            </Suspense>
                        </PlanFeaturesProvider>
                    </TenantProvider>
                );
            }
            if (demoRole === USER_ROLES.PARENT) {
                return (
                    <TenantProvider>
                        <PlanFeaturesProvider>
                            <Suspense fallback={<ContentLoader />}>
                                <ParentBlueDashboard onLogout={logout} demoUserId={effectiveDemoStudentId} />
                            </Suspense>
                        </PlanFeaturesProvider>
                    </TenantProvider>
                );
            }
            const effectiveRole = demoRole === USER_ROLES.BURSAR ? USER_ROLES.BURSAR : USER_ROLES.ADMIN;
            if (effectiveRole === USER_ROLES.BURSAR) {
                return (
                    <TenantProvider>
                        <PlanFeaturesProvider>
                            <Bursary />
                        </PlanFeaturesProvider>
                    </TenantProvider>
                );
            }
            // For Admin demo, try AdminBlueDashboard with fallback to simple dashboard
            if (effectiveRole === USER_ROLES.ADMIN) {
                return (
                    <TenantProvider>
                        <PlanFeaturesProvider>
                            <Suspense fallback={<ContentLoader />}>
                                <AdminDashboardWithFallback setActiveView={handleViewChange} />
                            </Suspense>
                            <SyncStatusIndicator />
                            <GlobalNotification />
                        </PlanFeaturesProvider>
                    </TenantProvider>
                );
            }
            return (
                <TenantProvider>
                    <PlanFeaturesProvider>
                        <AdminAppShell pageTitle={headerTitle} activeView={activeView} onChangeView={handleViewChange}>
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
                        </AdminAppShell>
                        <SyncStatusIndicator />
                        <GlobalNotification />
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
                        <TeacherBlueDashboard onLogout={logout} />
                    </Suspense>
                </PlanFeaturesProvider>
            </TenantProvider>
        );
    }
    if (role === USER_ROLES.STUDENT) {
        return (
            <TenantProvider>
                <PlanFeaturesProvider>
                    <Suspense fallback={<ContentLoader />}>
                        <StudentBlueDashboard onLogout={logout} demoUserId={user?.id} />
                    </Suspense>
                </PlanFeaturesProvider>
            </TenantProvider>
        );
    }
    if (role === USER_ROLES.PARENT) {
        return (
            <TenantProvider>
                <PlanFeaturesProvider>
                    <Suspense fallback={<ContentLoader />}>
                        <ParentBlueDashboard onLogout={logout} demoUserId={user?.id} />
                    </Suspense>
                </PlanFeaturesProvider>
            </TenantProvider>
        );
    }

    if (role === USER_ROLES.BURSAR) {
        return (
            <TenantProvider>
                <PlanFeaturesProvider>
                    <Bursary />
                </PlanFeaturesProvider>
            </TenantProvider>
        );
    }
    return (
        <TenantProvider>
            <PlanFeaturesProvider>
                {activeView === ADMIN_VIEWS.DASHBOARD ? (
                    <Suspense fallback={<ContentLoader />}>
                        <AdminBlueDashboard />
                    </Suspense>
                ) : (
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
                <AdminAppShell pageTitle={headerTitle} activeView={activeView} onChangeView={handleViewChange}>
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
                </AdminAppShell>
                <SyncStatusIndicator />
                <GlobalNotification />
                </>
                )}
            </PlanFeaturesProvider>
        </TenantProvider>
    );
};

export default Dashboard;
