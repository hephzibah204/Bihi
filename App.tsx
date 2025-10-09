

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getSubdomain } from './utils/subdomain';
import { APP_VIEWS } from './utils/constants';
import { apiGetPlatformSettings, apiGetPublicTenantList } from './services/api';
import { DEMO_TENANT_ID } from './utils/demoData';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const DemoPage = lazy(() => import('./components/DemoPage'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage'));
const PublicResultViewer = lazy(() => import('./components/PublicResultViewer'));
const PublicLayout = lazy(() => import('./components/PublicLayout'));
const BlogIndexPage = lazy(() => import('./components/BlogIndexPage'));
const BlogPostPage = lazy(() => import('./components/BlogPostPage'));
const KnowledgeBaseViewer = lazy(() => import('./components/KnowledgeBaseViewer'));
const PublicPageViewer = lazy(() => import('./components/PublicPageViewer'));
const CentralLoginPage = lazy(() => import('./components/CentralLoginPage'));

// Loading component for Suspense fallback
const FullPageLoader = () => (
    <div className="flex items-center justify-center h-screen">Loading...</div>
);

const App = () => {
    const [subdomain, setSubdomain] = useState<string | null>(null);
    const [isRootDomain, setIsRootDomain] = useState(false);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<string | null>(null);
    const [platformSettings, setPlatformSettings] = useState(null);
    const [dynamicPage, setDynamicPage] = useState(null);
    const [showSuperAdmin, setShowSuperAdmin] = useState(false);

    useEffect(() => {
        const init = async () => {
            const settings = await apiGetPlatformSettings();
            setPlatformSettings(settings);

            const params = new URLSearchParams(window.location.search);
            const currentView = params.get('view');
            setView(currentView);

            // Update document title for accessibility
            let title = 'ReportSheet | AI-Powered School Management System';
            if (currentView === APP_VIEWS.DEMO) title = 'Demo | ReportSheet';
            else if (currentView === APP_VIEWS.SIGNUP) title = 'Sign Up | ReportSheet';
            else if (currentView === APP_VIEWS.SIGNIN) title = 'Sign In | ReportSheet';
            else if (currentView === APP_VIEWS.RESULT_CHECKER) title = 'Result Checker | ReportSheet';
            else if (currentView === APP_VIEWS.BLOG) title = 'Blog | ReportSheet';
            else if (currentView === APP_VIEWS.KB) title = 'Knowledge Base | ReportSheet';
            else if (currentView === APP_VIEWS.ALUMNI) title = 'Alumni Portal | ReportSheet';
            document.title = title;

            const sd = getSubdomain();
            
            // --- VALIDATE SUBDOMAIN ---
            // If a subdomain is found, check if it's a real, registered tenant.
            // This prevents users from landing on a dead-end login for a non-existent school.
            if (sd && sd !== 'admin' && sd !== DEMO_TENANT_ID) {
                const tenants = await apiGetPublicTenantList();
                const isValidTenant = tenants.some(t => t.id === sd);
                if (!isValidTenant) {
                    // Invalid subdomain found, redirect to the root marketing page.
                    window.location.href = '/';
                    return; // Stop further processing to allow the redirect to happen.
                }
            }
            
            setSubdomain(sd);
            const isRoot = !sd;
            setIsRootDomain(isRoot);

            const { pathname } = window.location;

            // Check for SuperAdmin login route on root domain
            if (isRoot && pathname === '/controlhub') {
                setShowSuperAdmin(true);
            }
            // Dynamic page routing for root domain, excluding the admin route
            else if (isRoot && !currentView) {
                if (pathname !== '/') {
                    const publishedPages = settings?.pages?.filter(p => p.status === 'published') || [];
                    const matchedPage = publishedPages.find(p => p.slug === pathname);
                    setDynamicPage(matchedPage);
                }
            }


            setLoading(false);
            
            const handlePopState = () => {
                 const params = new URLSearchParams(window.location.search);
                 setView(params.get('view'));
            };
            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        };

        init();
    }, []);
    
    const handleNavigate = (newView: string | null) => {
        const url = newView ? `?view=${newView}` : window.location.pathname;
        window.history.pushState({}, '', url);
        setView(newView);
    };

    if (loading) {
        return <FullPageLoader />;
    }
    
    const publicLayoutMenu = platformSettings?.menus?.header;

    return (
        <Suspense fallback={<FullPageLoader />}>
            {(() => {
                // SUPER ADMIN routes have the highest priority and override everything else.
                if (subdomain === 'admin' || showSuperAdmin) {
                    return <SuperAdminDashboard />;
                }
                
                // Query parameter views have the next highest priority
                if (view === APP_VIEWS.DEMO) {
                    return <DemoPage />;
                }
                if (view === APP_VIEWS.SIGNUP) {
                    return <SubscriptionPage />;
                }
                if (view === APP_VIEWS.SIGNIN) {
                    return <CentralLoginPage />;
                }
                if (view === APP_VIEWS.RESULT_CHECKER) {
                    return <PublicResultViewer />;
                }
                if (view === APP_VIEWS.BLOG) {
                    return <PublicLayout onNavigate={handleNavigate} menuItems={publicLayoutMenu}><BlogIndexPage /></PublicLayout>;
                }
                if (view === APP_VIEWS.ARTICLE) {
                    return <PublicLayout onNavigate={handleNavigate} menuItems={publicLayoutMenu}><BlogPostPage /></PublicLayout>;
                }
                if (view === APP_VIEWS.KB || view === APP_VIEWS.KB_ARTICLE) {
                    return <PublicLayout onNavigate={handleNavigate} menuItems={publicLayoutMenu}><KnowledgeBaseViewer /></PublicLayout>;
                }

                // Dynamic page view (if a slug was matched)
                if (dynamicPage) {
                    return <PublicLayout onNavigate={handleNavigate} menuItems={publicLayoutMenu}><PublicPageViewer page={dynamicPage} /></PublicLayout>;
                }

                // Explicitly serve the landing page on the root domain
                if (isRootDomain) {
                    return <LandingPage content={platformSettings?.landingPageContent} onNavigate={handleNavigate} menuItems={publicLayoutMenu} />;
                }

                // Handle subdomain routing if not on the root domain
                if (subdomain) {
                    // The 'admin' case is handled at the top, so we just render the school portal here.
                    return <Dashboard />;
                }

                // Fallback to the landing page if no other condition is met
                return <LandingPage content={platformSettings?.landingPageContent} onNavigate={handleNavigate} menuItems={publicLayoutMenu} />;
            })()}
        </Suspense>
    );
};

export default App;