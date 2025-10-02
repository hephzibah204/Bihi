import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import SuperAdminLoginPage from './SuperAdminLoginPage';
import TenantManagement from './TenantManagement';
import PlatformAnalytics from './PlatformAnalytics';
import PlanManager from './PlanManager';
import ArticleManager from './ArticleManager';
import PlatformCustomization from './PlatformCustomization';
import KBArticleManager from './KBArticleManager';
import ChartPieIcon from './icons/ChartPieIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import AdminBillingPage from './AdminBillingPage';
import BanknotesIcon from './icons/BanknotesIcon';
import Chatbot from './Chatbot';

type AdminView = 'analytics' | 'tenants' | 'plans' | 'content' | 'kb-manager' | 'customization' | 'billing';

const SuperAdminDashboard = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<AdminView>('analytics');

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        const getSession = async () => {
            // FIX: Defensively destructure session data to prevent crash if 'data' is null.
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching session for admin:", error);
            }
            setSession(data?.session ?? null);
            setLoading(false);
        };
        getSession();
        
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        
        return () => authListener?.subscription?.unsubscribe();
    }, []);

    const handleLogout = async () => {
        if (supabase) await supabase.auth.signOut();
    };

    const renderView = () => {
        switch(activeView) {
            case 'analytics': return <PlatformAnalytics />;
            case 'tenants': return <TenantManagement />;
            case 'plans': return <PlanManager />;
            case 'content': return <ArticleManager />;
            case 'kb-manager': return <KBArticleManager />;
            case 'customization': return <PlatformCustomization />;
            case 'billing': return <AdminBillingPage />;
            default: return <PlatformAnalytics />;
        }
    };
    
    // Fix: Refactored to use a `label` prop instead of `children` for clarity and to fix type errors.
    const NavButton = ({ view, icon, label }: { view: AdminView, icon: React.ReactNode, label: string }) => {
        const isActive = activeView === view;
        return (
             <button 
                onClick={() => setActiveView(view)} 
                className={`w-full text-left px-4 py-3 flex items-center rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
             >
                 {icon}
                 <span className="ml-3">{label}</span>
            </button>
        );
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!session) {
        return <SuperAdminLoginPage />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Super Admin</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <NavButton view="analytics" icon={<ChartPieIcon className="w-5 h-5"/>} label="Analytics" />
                    <NavButton view="tenants" icon={<BuildingLibraryIcon className="w-5 h-5"/>} label="Tenants" />
                    <NavButton view="plans" icon={<CreditCardIcon className="w-5 h-5"/>} label="Plans" />
                    <NavButton view="billing" icon={<BanknotesIcon className="w-5 h-5"/>} label="Billing" />
                    <NavButton view="content" icon={<DocumentTextIcon className="w-5 h-5"/>} label="Blog Articles" />
                    <NavButton view="kb-manager" icon={<QuestionMarkCircleIcon className="w-5 h-5"/>} label="KB Articles" />
                    <NavButton view="customization" icon={<WrenchScrewdriverIcon className="w-5 h-5"/>} label="Customization" />
                </nav>
                 <div className="p-4">
                    <button onClick={handleLogout} className="w-full btn btn-secondary">Logout</button>
                </div>
            </aside>
            <main className="flex-1 p-6">
                {renderView()}
            </main>
            <Chatbot />
        </div>
    );
};

export default SuperAdminDashboard;