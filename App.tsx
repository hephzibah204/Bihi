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
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setView(params.get('view'));

        const host = window.location.hostname;
        const sd = getSubdomain(host);
        setSubdomain(sd);
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
    
    // Handle views from query params first
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
        // Fix: Use standard JSX children for PublicLayout component for consistency.
        return <PublicLayout onNavigate={handleNavigate}><BlogIndexPage /></PublicLayout>;
    }
    if (view === 'article') {
        // Fix: Use standard JSX children for PublicLayout component for consistency.
        return <PublicLayout onNavigate={handleNavigate}><BlogPostPage /></PublicLayout>;
    }
    if (view === 'kb' || view === 'kb-article') {
        // Fix: Use standard JSX children for PublicLayout component for consistency.
        return <PublicLayout onNavigate={handleNavigate}><KnowledgeBaseViewer /></PublicLayout>;
    }
    if (view === 'alumni') {
        return <PublicLayout onNavigate={handleNavigate}><AlumniDashboard /></PublicLayout>;
    }

    // Then, handle subdomain routing
    if (subdomain) {
        if (subdomain === 'admin') {
            return <SuperAdminDashboard />;
        }
        // 'demo' subdomain is effectively handled by the query param now, but this is a good fallback.
        if (subdomain === 'demo') {
            return <DemoPage />;
        }
        return <Dashboard />;
    }

    return <LandingPage onNavigate={handleNavigate} />;
};

export default App;