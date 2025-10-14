
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '../services/supabaseClient';
import SuperAdminLoginPage from './SuperAdminLoginPage';
import { ADMIN_VIEWS } from '../utils/constants';

// Lazy load components
const PlatformAnalytics = lazy(() => import('./PlatformAnalytics'));
const TenantManagement = lazy(() => import('./TenantManagement'));
const PlatformSettings = lazy(() => import('./PlatformSettings'));
const PlatformUserManager = lazy(() => import('./PlatformUserManager'));
const PageManager = lazy(() => import('./PageManager'));
const MenuManager = lazy(() => import('./MenuManager'));
const ArticleManager = lazy(() => import('./ArticleManager')); // For Blog
const KBArticleManager = lazy(() => import('./KBArticleManager')); // For KB

const SuperAdminSidebar = ({ activeView, setActiveView }) => {
    // A simplified sidebar for the super admin
    const navItems = [
        { view: 'dashboard', label: 'Dashboard' },
        { view: ADMIN_VIEWS.PLATFORM_SETTINGS, label: 'Platform Settings' },
        { view: 'tenants', label: 'Tenant Management' },
        { view: ADMIN_VIEWS.USERS, label: 'Platform Users' },
        { view: ADMIN_VIEWS.PAGES, label: 'Site Pages' },
        { view: ADMIN_VIEWS.MENUS, label: 'Site Menus' },
        { view: ADMIN_VIEWS.BLOG_ARTICLES, label: 'Blog Articles' },
        { view: ADMIN_VIEWS.KB_ARTICLES, label: 'KB Articles' },
    ];
    return (
        <aside className="w-64 bg-gray-800 text-white flex-col hidden md:flex">
            <div className="h-16 flex items-center justify-center text-xl font-bold">ControlHub</div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view)}
                        className={`w-full text-left px-4 py-2 rounded ${activeView === item.view ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </aside>
    );
};

const SuperAdminDashboard = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!session) {
        return <SuperAdminLoginPage />;
    }

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <PlatformAnalytics />;
            case 'tenants': return <TenantManagement />;
            case ADMIN_VIEWS.PLATFORM_SETTINGS: return <PlatformSettings />;
            case ADMIN_VIEWS.USERS: return <PlatformUserManager />;
            case ADMIN_VIEWS.PAGES: return <PageManager />;
            case ADMIN_VIEWS.MENUS: return <MenuManager />;
            case ADMIN_VIEWS.BLOG_ARTICLES: return <ArticleManager />;
            case ADMIN_VIEWS.KB_ARTICLES: return <KBArticleManager />;
            default: return <PlatformAnalytics />;
        }
    };
    
    const viewTitles = {
        dashboard: 'Dashboard',
        tenants: 'Tenant Management',
        [ADMIN_VIEWS.PLATFORM_SETTINGS]: 'Platform Settings',
        [ADMIN_VIEWS.USERS]: 'Platform User Management',
        [ADMIN_VIEWS.PAGES]: 'Site Page Manager',
        [ADMIN_VIEWS.MENUS]: 'Site Menu Manager',
        [ADMIN_VIEWS.BLOG_ARTICLES]: 'Blog Article Manager',
        [ADMIN_VIEWS.KB_ARTICLES]: 'Knowledge Base Manager',
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <SuperAdminSidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b flex justify-between items-center px-6">
                    <h1 className="text-xl font-semibold">{viewTitles[activeView] || 'Dashboard'}</h1>
                    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <Suspense fallback={<div>Loading component...</div>}>
                        {renderContent()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
