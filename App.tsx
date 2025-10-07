
import React, { useState, useEffect } from 'react';
import { getSubdomain } from './utils/subdomain';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
// Fix: Added placeholder content to SuperAdminDashboard.tsx to make it a valid module.
import SuperAdminDashboard from './components/SuperAdminDashboard';
// Fix: Added placeholder content to DemoPage.tsx to make it a valid module.
import DemoPage from './components/DemoPage';
import SubscriptionPage from './components/SubscriptionPage';
import PublicResultViewer from './components/PublicResultViewer';
import PublicLayout from './components/PublicLayout';
import BlogIndexPage from './components/BlogIndexPage';
import BlogPostPage from './components/BlogPostPage';
import KnowledgeBaseViewer from './components/KnowledgeBaseViewer';
import AlumniDashboard from './components/AlumniDashboard';
import { APP_VIEWS } from './utils/constants';
import { apiGetPlatformSettings } from './services/api';
import PublicPageViewer from './components/PublicPageViewer';

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
            else if (currentView === APP_VIEWS.RESULT_CHECKER) title = 'Result Checker | ReportSheet';
            else if (currentView === APP_VIEWS.BLOG) title = 'Blog | ReportSheet';
            else if (currentView === APP_VIEWS.KB) title = 'Knowledge Base | ReportSheet';
            else if (currentView === APP_VIEWS.ALUMNI) title = 'Alumni Portal | ReportSheet';
            document.title = title;

            const host = window.location.hostname;
            const sd = getSubdomain(host);
            
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
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    
    // Highest priority route for SuperAdmin login
    if (showSuperAdmin) {
        return <SuperAdminDashboard />;
    }
    
    // Query parameter views have the next highest priority
    if (view === APP_VIEWS.DEMO) {
        return <DemoPage />;
    }
    if (view === APP_VIEWS.SIGNUP) {
        return <SubscriptionPage />;
    }
    if (view === APP_VIEWS.RESULT_CHECKER) {
        return <PublicResultViewer />;
    }
    const publicLayoutMenu = platformSettings?.menus?.header;
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
        if (subdomain === 'admin') {
            return <SuperAdminDashboard />;
        }
        // All other subdomains lead to the school portal
        return <Dashboard />;
    }

    // Fallback to the landing page if no other condition is met
    return <LandingPage content={platformSettings?.landingPageContent} onNavigate={handleNavigate} menuItems={publicLayoutMenu} />;
};

export default App;