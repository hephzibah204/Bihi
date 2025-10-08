import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { DashboardView, UserRole } from '../types';
import Header from './Header';
import DashboardContent from './DashboardContent';
import { supabase } from '../services/supabaseClient';
import PortalLogin from './PortalLogin';
import { TenantProvider } from '../contexts/TenantContext';
import { apiGetTeachers, apiGetStudents } from '../services/api';
import TeacherDashboard from './TeacherDashboard';
import SyncStatusIndicator from './SyncStatusIndicator';
import AdminBottomNavBar from './AdminBottomNavBar';
import MoreView from './MoreView';
import { PlanFeaturesProvider } from '../contexts/PlanFeaturesContext';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './ParentDashboard';
import GlobalNotification from './GlobalNotification';
import Chatbot from './Chatbot';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import { getSubdomain } from '../utils/subdomain';
import SelectChildModal from './SelectChildModal';

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
    const isDemoSubdomain = getSubdomain() === 'demo';
    const [childrenToSelect, setChildrenToSelect] = useState([]);

    useEffect(() => {
        setLoading(true);

        const handlePopState = () => {
            setActiveView(getViewFromUrl() || ADMIN_VIEWS.DASHBOARD);
            setProfileStudentId(getStudentIdFromUrl());
        };
        window.addEventListener('popstate', handlePopState);

        const activeUserSession = sessionStorage.getItem('activeUser');
        if (activeUserSession) {
            try {
                const parsedUser = JSON.parse(activeUserSession);
                setActiveUser(parsedUser);
                setUserRole(parsedUser.role);
                setLoading(false);
                return;
            } catch (e) {
                sessionStorage.removeItem('activeUser');
            }
        }
        
        if (!supabase) {
            setLoading(false);
            return () => window.removeEventListener('popstate', handlePopState);
        }
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                const teachers = await apiGetTeachers();
                const currentUser = teachers.find(t => t.email.toLowerCase() === session.user.email.toLowerCase());
                if (currentUser) {
                    setUserRole(currentUser.role || USER_ROLES.ADMIN);
                    setActiveUser(null);
                    setLoading(false);
                    return;
                }

                if (session.user?.user_metadata?.parent_id) {
                    const parentId = session.user.user_metadata.parent_id;
                    const allStudents = await apiGetStudents();
                    const children = allStudents.filter(s => s.parentId === parentId);
                    
                    if (children.length === 0) {
                        await supabase.auth.signOut();
                        alert("Your account is active, but no students are linked to it. Please contact the school administrator.");
                    } else if (children.length === 1) {
                        handleStudentLoginSuccess({ role: USER_ROLES.PARENT, userId: children[0].id, studentName: children[0].name });
                    } else {
                        setChildrenToSelect(children);
                    }
                }
                
            } else {
                setActiveUser(null);
                setUserRole(null);
                setSession(null);
            }
            setLoading(false);
        });

        const checkAIHealth = async () => {
            try {
                const response = await fetch('/api/ai/health');
                const data = await response.json();
                if (!response.ok) {
                    console.error('AI Health Check Failed:', data.message);
                    window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: data.message } }));
                }
            } catch (e) {
                console.warn('AI proxy server may not be available.', e);
            }
        };
        checkAIHealth();

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        if (!loading && !session && !activeUser && isDemoSubdomain) {
            window.location.href = '/?view=demo';
        }
    }, [loading, session, activeUser, isDemoSubdomain]);

    const handleStudentLoginSuccess = (userData) => {
        setActiveUser(userData);
        setUserRole(userData.role);
    };

    const handleLogout = async () => {
        const isDemoLogout = !session && sessionStorage.getItem('isDemoMode') === 'true';

        sessionStorage.removeItem('activeUser');
        sessionStorage.removeItem('isDemoMode');
        setActiveUser(null);
        if (supabase) {
            await supabase.auth.signOut();
        }
        setSession(null);
        setUserRole(null);
        
        if (isDemoLogout) {
            window.location.href = '/?view=demo';
        } else {
            window.location.href = '/';
        }
    };

    useEffect(() => {
        let title = 'Dashboard';
        if (activeView === ADMIN_VIEWS.STUDENT_PROFILE) {
            title = 'Student Profile';
        } else if (activeView === ADMIN_VIEWS.COMPREHENSIVE_ENTRY) {
            title = 'Dossier';
        } else if (activeView === ADMIN_VIEWS.REPORT_CARDS) {
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
    
    const handleSelectChild = (child) => {
        handleStudentLoginSuccess({ role: USER_ROLES.PARENT, userId: child.id, studentName: child.name });
        setChildrenToSelect([]);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Authenticating...</div>;
    }
    
    if (childrenToSelect.length > 0) {
        return (
            <SelectChildModal 
                isOpen={true}
                onClose={async () => { 
                    setChildrenToSelect([]); 
                    if(supabase) await supabase.auth.signOut();
                }}
                childrenList={childrenToSelect}
                onSelectChild={handleSelectChild}
            />
        );
    }

    if (!session && !activeUser) {
        if (isDemoSubdomain) {
            return <div className="flex items-center justify-center h-screen">Redirecting to demo...</div>;
        }
        return <PortalLogin onStudentLoginSuccess={handleStudentLoginSuccess} />;
    }

    if (userRole === USER_ROLES.TEACHER) {
        return <TeacherDashboard onLogout={handleLogout} />;
    }
    if (userRole === USER_ROLES.STUDENT) {
        return <StudentDashboard onLogout={handleLogout} demoUserId={activeUser?.userId} />;
    }
    if (userRole === USER_ROLES.PARENT) {
        return <ParentDashboard onLogout={handleLogout} demoUserId={activeUser?.userId} />;
    }

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
                <GlobalNotification />
                <Chatbot userRole={userRole} activeView={activeView} />
            </PlanFeaturesProvider>
        </TenantProvider>
    );
};

export default Dashboard;