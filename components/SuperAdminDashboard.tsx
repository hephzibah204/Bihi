import React, { useState, useEffect } from 'react';
import { supabase } from '../functions/supabaseClient';
import SuperAdminLoginPage from './SuperAdminLoginPage';
import PlatformAnalytics from './PlatformAnalytics';
import TenantManagement from './TenantManagement';
import PlatformSettings from './PlatformSettings';
import PageManager from './PageManager';
import MenuManager from './MenuManager';
import PlatformUserManager from './PlatformUserManager';
import { ADMIN_VIEWS } from '../utils/constants';

const SuperAdminDashboard = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState(ADMIN_VIEWS.DASHBOARD);
    
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
            default: return <TenantManagement />;
        }
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="h-16 flex items-center justify-center text-xl font-bold">ControlHub</div>
                <nav className="flex-1 p-4 space-y-2">
                     <button onClick={() => setActiveView(ADMIN_VIEWS.DASHBOARD)} className="w-full text-left p-2 rounded hover:bg-gray-700">Analytics</button>
                    <button onClick={() => setActiveView('tenants')} className="w-full text-left p-2 rounded hover:bg-gray-700">Schools</button>
                     <button onClick={() => setActiveView(ADMIN_VIEWS.PAGES)} className="w-full text-left p-2 rounded hover:bg-gray-700">Pages</button>
                     <button onClick={() => setActiveView(ADMIN_VIEWS.MENUS)} className="w-full text-left p-2 rounded hover:bg-gray-700">Menus</button>
                     <button onClick={() => setActiveView(ADMIN_VIEWS.USERS)} className="w-full text-left p-2 rounded hover:bg-gray-700">Users</button>
                    <button onClick={() => setActiveView(ADMIN_VIEWS.PLATFORM_SETTINGS)} className="w-full text-left p-2 rounded hover:bg-gray-700">Settings</button>
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <button onClick={handleLogout} className="w-full text-left p-2 rounded hover:bg-gray-700">Logout</button>
                </div>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;