import { lazy, Suspense, PropsWithChildren, useEffect } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalSuccessNotification from './components/GlobalSuccessNotification';
import GlobalNotification from './components/GlobalNotification';
import GlobalBroadcast from './components/GlobalBroadcast';
import { applyThemeToDocument, defaultTheme, ThemeSettings } from './hooks/useTheme';
import { getConnectionManager } from './utils/connectionManager';
import { DEFAULT_LANDING_PAGE_CONTENT, DEFAULT_MENU_ITEMS } from './utils/landingPageContent';

// Load Dashboard eagerly to avoid intermittent dynamic import fetch errors
import Dashboard from './components/Dashboard';
const LandingPage = lazy(() => import('./components/LandingPage'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const DemoPage = lazy(() => import('./components/DemoPage'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage'));
const PublicResultViewer = lazy(() => import('./components/PublicResultViewer'));
const CentralLoginPage = lazy(() => import('./components/CentralLoginPage'));

const FullPageLoader = () => (
    <div className="flex items-center justify-center h-screen">Loading...</div>
);

// Component to handle path-based tenant routing
const TenantRouter = () => {
    const { tenantSlug } = useParams();
    const { loading, isValidTenant, subdomain } = useAuth();
    
    // Redirect to force tenant detection via path
    if (tenantSlug && !subdomain) {
        // This will trigger subdomain detection in the parent component
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

    // Apply theme when platform settings load/change
    useEffect(() => {
        try {
            const theme = (platformSettings as any)?.theme as ThemeSettings | undefined;
            applyThemeToDocument(theme || defaultTheme);
        } catch {}
    }, [platformSettings]);
    
    // Check for Super Admin route first - this takes highest precedence
    const isControlHub = typeof window !== 'undefined' && window.location.pathname.startsWith('/controlhub');
    
    if (isControlHub) {
        return <Suspense fallback={<FullPageLoader />}><SuperAdminDashboard /></Suspense>;
    }
    
    // Check for demo mode - this takes precedence over other routing
    const isDemoMode = typeof window !== 'undefined' && 
        (sessionStorage.getItem('isDemoMode') === 'true' || 
         localStorage.getItem('isDemoMode') === 'true');
         
    if (isDemoMode) {
        return <Suspense fallback={<FullPageLoader />}><Dashboard /></Suspense>;
    }

    if (loading) {
        return <FullPageLoader />;
    }

    // Handle tenant-specific routing (subdomain-based)
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

    // Root site router with support for path-based tenant routing
    return (
        <Suspense fallback={<FullPageLoader />}>
            <Routes>
                <Route path="/" element={<LandingPage content={platformSettings?.landingPageContent || DEFAULT_LANDING_PAGE_CONTENT} menuItems={platformSettings?.menus?.header || DEFAULT_MENU_ITEMS} />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/signup" element={<SubscriptionPage />} />
                <Route path="/signin" element={<CentralLoginPage />} />
                <Route path="/results" element={<PublicResultViewer />} />
                <Route path="/controlhub" element={<SuperAdminDashboard />} />
                {/* Path-based tenant routing */}
                <Route path="/:tenantSlug/*" element={<TenantRouter />} />
                {/* Catch-all route for unknown paths (non-tenant) */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
};


const App = () => {
    // Initialize connection manager when app starts
    useEffect(() => {
        const connectionManager = getConnectionManager();
        // Connection manager starts monitoring automatically in constructor
        
        return () => {
            // Cleanup on unmount
            connectionManager.stopMonitoring();
        };
    }, []);

    // Prefetch Dashboard to avoid lazy-load fetch issues
    useEffect(() => {
        try {
            // Warm up the module cache so Suspense loads instantly
            import('./components/Dashboard');
        } catch {}
    }, []);

    const AppWrapper = ({ children }: PropsWithChildren) => (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
                <GlobalBroadcast />
                {children}
                <GlobalSuccessNotification />
                <GlobalNotification />
            </div>
        </AuthProvider>
    );
    
    return (
        <AppWrapper>
            <AppRouter />
        </AppWrapper>
    );
};

export default App;