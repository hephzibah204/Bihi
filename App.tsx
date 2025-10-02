import React, { useState, useEffect } from 'react';
import { getSubdomain } from './utils/subdomain';
import Dashboard from './Dashboard';
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

const App = () => {
    const [subdomain, setSubdomain] = useState<string | null>(null);
    const [isRootDomain, setIsRootDomain] = useState(false);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setView(params.get('view'));

        const host = window.location.hostname;
        const sd = getSubdomain(host);
        
        setSubdomain(sd);
        setIsRootDomain(!sd); // If there's no subdomain, it's the root domain.

        setLoading(false);
        
        const handlePopState = () => {
             const params = new URLSearchParams(window.location.search);
             setView(params.get('view'));
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);

    }, []);
    
    const handleNavigate = (newView: string | null) => {
        const url = newView ? `?view=${newView}` : window.location.pathname;
        window.history.pushState({}, '', url);
        setView(newView);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }
    
    // Query parameter views have the highest priority
    if (view === 'demo') {
        return <DemoPage />;
    }
    if (view === 'signup') {
        return <SubscriptionPage />;
    }
    if (view === 'result-checker') {
        return <PublicResultViewer />;
    }
    if (view === 'blog') {
        return <PublicLayout onNavigate={handleNavigate}><BlogIndexPage /></PublicLayout>;
    }
    if (view === 'article') {
        return <PublicLayout onNavigate={handleNavigate}><BlogPostPage /></PublicLayout>;
    }
    if (view === 'kb' || view === 'kb-article') {
        return <PublicLayout onNavigate={handleNavigate}><KnowledgeBaseViewer /></PublicLayout>;
    }
    if (view === 'alumni') {
        return <PublicLayout onNavigate={handleNavigate}><AlumniDashboard /></PublicLayout>;
    }

    // Explicitly serve the landing page on the root domain
    if (isRootDomain) {
        return <LandingPage onNavigate={handleNavigate} />;
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
    return <LandingPage onNavigate={handleNavigate} />;
};

export default App;