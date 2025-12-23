import { lazy, Suspense, PropsWithChildren, useEffect } from 'react';
import useDailySnapshot from './hooks/useDailySnapshot';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import GlobalSuccessNotification from './components/GlobalSuccessNotification';
import GlobalNotification from './components/GlobalNotification';
import GlobalBroadcast from './components/GlobalBroadcast';
import ErrorBoundary from './components/ErrorBoundary';
import { getConnectionManager } from './utils/connectionManager';
import { DEFAULT_LANDING_PAGE_CONTENT, DEFAULT_MENU_ITEMS } from './utils/landingPageContent';

// Load Dashboard eagerly to avoid intermittent dynamic import fetch errors
import Dashboard from './components/Dashboard';
import CBTRouter from './components/cbt/CBTRouter';
const LandingPage = lazy(() => import('./components/LandingPage'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const DemoPage = lazy(() => import('./components/DemoPage'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage'));
const PublicResultViewer = lazy(() => import('./components/PublicResultViewer'));
const CentralLoginPage = lazy(() => import('./components/CentralLoginPage'));
const SchoolLandingPage = lazy(() => import('./components/SchoolLandingPage'));

import { FullPageLoader } from './components/ui/LoadingSpinner';

// Component to handle path-based tenant routing
const TenantRouter = () => {
    const { tenantSlug } = useParams();
    const { loading, isValidTenant, subdomain } = useAuth();
    
    if (tenantSlug && !subdomain) {
        return <Navigate to={window.location.pathname} replace />;
    }
    
    if (loading) {
        return <FullPageLoader />;
    }
    
    if (!isValidTenant) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <h1 className="text-2xl font-bold">Portal Not Found</h1>
                <p className="mt-2 text-gray-600">The school portal "{tenantSlug}" does not exist.</p>
                <a href="/" className="mt-4 btn btn-primary">Go to Main Site</a>
            </div>
        );
    }
    
    if (tenantSlug === 'admin') {
        return <SuperAdminDashboard />;
    }
    
    return <Dashboard />;
};

const AppRouter = () => {
    const { loading, isValidTenant, subdomain, platformSettings } = useAuth();

    const isControlHub = typeof window !== 'undefined' && window.location.pathname.startsWith('/controlhub');
    
    if (isControlHub) {
        return <Suspense fallback={<FullPageLoader />}><SuperAdminDashboard /></Suspense>;
    }
    
    const isDemoMode = typeof window !== 'undefined' && 
        (sessionStorage.getItem('isDemoMode') === 'true' || 
         localStorage.getItem('isDemoMode') === 'true');
         
    if (isDemoMode) {
        return <Suspense fallback={<FullPageLoader />}><Dashboard /></Suspense>;
    }

    if (loading) {
        return <FullPageLoader />;
    }

    if (subdomain) {
        if (!isValidTenant) {
            return (
                <div className="flex flex-col items-center justify-center h-screen text-center">
                    <h1 className="text-2xl font-bold">Portal Not Found</h1>
                <p className="mt-2 text-gray-600">The school portal &ldquo;{subdomain}&rdquo; does not exist.</p>
                    <a href="/" className="mt-4 btn btn-primary">Go to Main Site</a>
                </div>
            );
        }
        
        if (subdomain === 'admin') {
            return <Suspense fallback={<FullPageLoader />}><SuperAdminDashboard /></Suspense>;
        }
        
        return <Suspense fallback={<FullPageLoader />}><Dashboard /></Suspense>;
    }

    const viewParam = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('view') : null;
    if (!subdomain && viewParam === 'signin') {
        return <Suspense fallback={<FullPageLoader />}><CentralLoginPage /></Suspense>;
    }

    return (
        <Suspense fallback={<FullPageLoader />}>
            <Routes>
                <Route path="/" element={<LandingPage content={platformSettings?.landingPageContent || DEFAULT_LANDING_PAGE_CONTENT} menuItems={platformSettings?.menus?.header || DEFAULT_MENU_ITEMS} />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/signup" element={<SubscriptionPage />} />
                <Route path="/signin" element={<CentralLoginPage />} />
                <Route path="/results" element={<PublicResultViewer />} />
                <Route path="/controlhub" element={<SuperAdminDashboard />} />
                <Route path="/cbt/*" element={<CBTRouter />} />
                <Route path="/schools/:schoolSlug" element={<SchoolLandingPage />} />
                <Route path="/:tenantSlug/*" element={<TenantRouter />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
};


const App = () => {
    useDailySnapshot();

    useEffect(() => {
        const connectionManager = getConnectionManager();
        return () => {
            connectionManager.stopMonitoring();
        };
    }, []);

    useEffect(() => {
        try {
            import('./components/Dashboard');
        } catch {}
    }, []);

    const AppWrapper = ({ children }: PropsWithChildren) => (
        <AuthProvider>
            <ThemeProvider>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <GlobalBroadcast />
                    {children}
                    <GlobalSuccessNotification />
                    <GlobalNotification />
                </div>
            </ThemeProvider>
        </AuthProvider>
    );
    
    return (
        <AppWrapper>
            <ErrorBoundary>
                <AppRouter />
            </ErrorBoundary>
        </AppWrapper>
    );
};

export default App;
