import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for supabase client
import { supabase } from '../services/supabaseClient';
import SuperAdminLoginPage from './SuperAdminLoginPage';
import PlatformAnalytics from './PlatformAnalytics';
import TenantManagement from './TenantManagement';
import PlatformSettings from './PlatformSettings';
import PageManager from './PageManager';
import MenuManager from './MenuManager';
import PlatformUserManager from './PlatformUserManager';
import { ADMIN_VIEWS } from '../utils/constants';
import ArticleManager from './ArticleManager';
import KBArticleManager from './KBArticleManager';

// Fix: Changed to a named export to resolve module export ambiguity.
export const SuperAdminDashboard = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    // Fix: Broaden the type of `activeView` from a specific literal to `string` to allow any of the valid admin view strings to be set.
    const [activeView, setActiveView] = useState<string>(ADMIN_VIEWS.DASHBOARD);
    
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
        if(supabase) await supabase.auth.signOut();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!session) {
        return <SuperAdminLoginPage />;
    }

    const renderContent = () => {
        switch(activeView) {
            case ADMIN_VIEWS.DASHBOARD: return <PlatformAnalytics />;
            case ADMIN_VIEWS.USERS: return <PlatformUserManager />;
            case ADMIN_VIEWS.PAGES: return <PageManager />;
            case ADMIN_VIEWS.MENUS: return <MenuManager />;
            case ADMIN_VIEWS.PLATFORM_SETTINGS: return <PlatformSettings />;
            case ADMIN_VIEWS.BLOG_ARTICLES: return <ArticleManager />;
            case ADMIN_VIEWS.KB_ARTICLES: return <KBArticleManager />;
            default: return <TenantManagement />;
        }
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="h-16 flex items-center justify-center text-xl font-bold">ControlHub</div>
                <nav className="flex-1 p-4 space-y-2">
                     <button onClick={() => setActiveView(ADMIN_VIEWS.DASHBOARD)} className="w-full text-left p-2 rounded hover:bg-gray-700">Analytics</button>
                    <button onClick={() => setActiveView('tenants')} className="w-full text-left p-2 rounded hover:bg-gray-7