import React, { lazy, Suspense, PropsWithChildren } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalSuccessNotification from './components/GlobalSuccessNotification';

// Lazy load components
const Dashboard = lazy(() => import('./components/Dashboard'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const DemoPage = lazy(() => import('./components/DemoPage'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage'));
const PublicResultViewer = lazy(() => import('./components/PublicResultViewer'));
const CentralLoginPage = lazy(() => import('./components/CentralLoginPage'));

const FullPageLoader = () => (
    <div className="flex items-center justify-center h-screen">Loading...</div>
);

const AppRouter = () => {
    const { loading, isValidTenant, subdomain, platformSettings } = useAuth();

    if (loading) {
        return <FullPageLoader />;
    }

    if (!isValidTenant) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <h1 className="text-2xl font-bold">Portal Not Found</h1>
                <p className="mt-2 text-gray-600">The school portal at this address does not exist.</p>
                <a href="/" className="mt-4 btn btn-primary">Go to Main Site</a>
            </div>
        );
    }
    
    if (subdomain === 'admin') {
        return <Suspense fallback={<FullPageLoader />}><SuperAdminDashboard /></Suspense>;
    }
    
    if (subdomain) {
        return <Suspense fallback={<FullPageLoader />}><Dashboard /></Suspense>;
    }

    // Root site router
    return (
        <Suspense fallback={<FullPageLoader />}>
            <Routes>
                <Route path="/" element={<LandingPage content={platformSettings?.landingPageContent} menuItems={platformSettings?.menus?.header} />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/signup" element={<SubscriptionPage />} />
                <Route path="/signin" element={<CentralLoginPage />} />
                <Route path="/results" element={<PublicResultViewer />} />
                <Route path="/controlhub" element={<SuperAdminDashboard />} />
            </Routes>
        </Suspense>
    );
};


const App = () => {
    const AppWrapper = ({ children }: PropsWithChildren<{}>) => (
        <AuthProvider>
            {children}
            <GlobalSuccessNotification />
        </AuthProvider>
    );
    
    return (
        <AppWrapper>
            <AppRouter />
        </AppWrapper>
    );
};

export default App;