import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import SuperAdminLoginPage from './SuperAdminLoginPage';
import { ADMIN_VIEWS } from '../utils/constants';
import ConnectionStatusBar from './ConnectionStatusBar';
import { apiGetPlatformSettings } from '../services/api';
import { hasPlatformPermission } from '../utils/permissions';
import type { PermissionKey } from '../types';

// Lazy load components
const SuperAdminOverview = lazy(() => import('./SuperAdmin/SuperAdminOverview'));
const TenantManagement = lazy(() => import('./SuperAdmin/TenantManagement'));
const PlatformSettings = lazy(() => import('./SuperAdmin/PlatformSettings'));
const UserManagement = lazy(() => import('./SuperAdmin/UserManagement'));
const SystemMonitoring = lazy(() => import('./SuperAdmin/SystemMonitoring'));
const DatabaseManager = lazy(() => import('./SuperAdmin/DatabaseManager'));
const SecurityCenter = lazy(() => import('./SuperAdmin/SecurityCenter'));
const PluginManager = lazy(() => import('./SuperAdmin/PluginManager'));
const ThemeManager = lazy(() => import('./SuperAdmin/ThemeManager'));
const MediaLibrary = lazy(() => import('./SuperAdmin/MediaLibrary'));
const EmailCenter = lazy(() => import('./SuperAdmin/EmailCenter'));
const BackupManager = lazy(() => import('./SuperAdmin/BackupManager'));
const AuditLogs = lazy(() => import('./SuperAdmin/AuditLogs'));
const PerformanceOptimizer = lazy(() => import('./SuperAdmin/PerformanceOptimizer'));
const APIManager = lazy(() => import('./SuperAdmin/APIManager'));
const NotificationCenter = lazy(() => import('./SuperAdmin/NotificationCenter'));
const LicenseManager = lazy(() => import('./SuperAdmin/LicenseManager'));
const AdvancedAnalytics = lazy(() => import('./SuperAdmin/AdvancedAnalytics'));
const SystemTools = lazy(() => import('./SuperAdmin/SystemTools'));
const Reports = lazy(() => import('./SuperAdmin/Reports'));
const AdminProfile = lazy(() => import('./SuperAdmin/AdminProfile'));

// Enhanced SuperAdmin Sidebar with WordPress-like navigation
const SuperAdminSidebar = ({ activeView, setActiveView, isSidebarCollapsed, setSidebarCollapsed, can }) => {
    const [expandedSections, setExpandedSections] = useState({
        dashboard: true,
        platform: false,
        system: false,
        security: false,
        tools: false,
        appearance: false,
        communication: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const menuSections = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: '📊',
            items: [
                { view: 'overview', label: 'Overview', icon: '🏠' },
                { view: 'analytics', label: 'Advanced Analytics', icon: '📈' },
                { view: 'performance', label: 'Performance', icon: '⚡' },
                { view: 'notifications', label: 'Notifications', icon: '🔔', badge: '5' },
                { view: 'reports', label: 'Reports', icon: '📊' }
            ]
        },
        {
            id: 'platform',
            title: 'Platform Management',
            icon: '🏢',
            items: [
                { view: 'tenants', label: 'Tenant Management', icon: '🏫' },
                { view: 'users', label: 'User Management', icon: '👥' },
                { view: 'licenses', label: 'License Manager', icon: '📝' },
                { view: 'platform-settings', label: 'Platform Settings', icon: '⚙️' }
            ]
        },
        {
            id: 'system',
            title: 'System & Database',
            icon: '🗄️',
            items: [
                { view: 'database', label: 'Database Manager', icon: '🗃️' },
                { view: 'monitoring', label: 'System Monitor', icon: '📡' },
                { view: 'backups', label: 'Backup Manager', icon: '💾' },
                { view: 'api-manager', label: 'API Management', icon: '🔌' }
            ]
        },
        {
            id: 'security',
            title: 'Security & Compliance',
            icon: '🛡️',
            items: [
                { view: 'security', label: 'Security Center', icon: '🔐' },
                { view: 'audit-logs', label: 'Audit Logs', icon: '📋' },
                { view: 'access-control', label: 'Access Control', icon: '🚪' }
            ]
        },
        {
            id: 'appearance',
            title: 'Appearance & Media',
            icon: '🎨',
            items: [
                { view: 'themes', label: 'Theme Manager', icon: '🖌️' },
                { view: 'media', label: 'Media Library', icon: '📸' },
                { view: 'branding', label: 'White Label', icon: '🏷️' }
            ]
        },
        {
            id: 'tools',
            title: 'Tools & Extensions',
            icon: '🔧',
            items: [
                { view: 'plugins', label: 'Plugin Manager', icon: '🧩' },
                { view: 'system-tools', label: 'System Tools', icon: '🛠️' },
                { view: 'email-center', label: 'Email Center', icon: '📧' },
                { view: 'import-export', label: 'Import/Export', icon: '📊' }
            ]
        }
    ];

    return (
        <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
                {!isSidebarCollapsed && (
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚡</span>
                        <span className="text-xl font-bold">ControlHub</span>
                    </div>
                )}
                <button
                    onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 rounded hover:bg-slate-800 transition-colors"
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span className="text-lg">{isSidebarCollapsed ? '→' : '←'}</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 overflow-y-auto">
                {menuSections.map(section => (
                    <div key={section.id} className="mb-2">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors ${
                                isSidebarCollapsed ? 'justify-center' : ''
                            }`}
                            title={isSidebarCollapsed ? section.title : ''}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-xl">{section.icon}</span>
                                {!isSidebarCollapsed && (
                                    <span className="font-medium text-sm">{section.title}</span>
                                )}
                            </div>
                            {!isSidebarCollapsed && (
                                <span className={`transition-transform ${
                                    expandedSections[section.id] ? 'rotate-90' : ''
                                }`}>▶</span>
                            )}
                        </button>

                        {(!isSidebarCollapsed && expandedSections[section.id]) && (
                            <div className="ml-4 mt-1 space-y-1">
                                {section.items
                                    .filter(item => {
                                        // Map view to permission and filter
                                        const req: Record<string, PermissionKey | null> = {
                                            overview: null,
                                            analytics: 'view_reports',
                                            performance: 'view_reports',
                                            notifications: 'send_broadcasts',
                                            reports: 'view_reports',
                                            tenants: 'manage_tenants',
                                            users: 'manage_users',
                                            licenses: 'manage_payments',
                                            'platform-settings': 'manage_platform_settings',
                                            database: 'manage_integrations',
                                            monitoring: 'manage_security',
                                            backups: 'manage_security',
                                            'api-manager': 'manage_integrations',
                                            security: 'manage_security',
                                            'audit-logs': 'manage_security',
                                            'access-control': 'manage_users',
                                            themes: 'manage_content',
                                            media: 'manage_content',
                                            branding: 'manage_content',
                                            plugins: 'manage_plugins',
                                            'system-tools': 'manage_security',
                                            'email-center': 'send_broadcasts',
                                            'import-export': 'manage_integrations',
                                        } as any;
                                        const key = req[item.view] as PermissionKey | null | undefined;
                                        return !key || can(key);
                                    })
                                    .map(item => (
                                        <button
                                            key={item.view}
                                            onClick={() => setActiveView(item.view)}
                                            className={`w-full flex items-center justify-between p-2 rounded text-sm transition-colors ${
                                                activeView === item.view 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            {!isSidebarCollapsed && (
                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>System Healthy</span>
                    </div>
                </div>
            )}
        </aside>
    );
};

// Enhanced Header with WordPress-like admin bar
const SuperAdminHeader = ({ activeView, onLogout, onQuickAction, can, roleLabel }) => {
    const [quickActions, setQuickActions] = useState(false);
    const [userMenu, setUserMenu] = useState(false);
    
    const viewTitles = {
        'overview': 'Dashboard Overview',
        'tenants': 'Tenant Management',
        'users': 'User Management',
        'platform-settings': 'Platform Settings',
        'database': 'Database Manager',
        'monitoring': 'System Monitoring',
        'security': 'Security Center',
        'plugins': 'Plugin Manager',
        'themes': 'Theme Manager',
        'media': 'Media Library',
        'analytics': 'Advanced Analytics',
        'performance': 'Performance Optimizer',
        'backups': 'Backup Manager',
        'audit-logs': 'Audit Logs',
        'api-manager': 'API Management',
        'email-center': 'Email Center',
        'notifications': 'Notification Center',
        'licenses': 'License Manager',
        'system-tools': 'System Tools'
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center space-x-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">
                        {viewTitles[activeView] || 'Dashboard'}
                    </h1>
                    <div className="text-sm text-slate-500">
                        {roleLabel}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                <div className="relative">
                    <button
                        onClick={() => setQuickActions(!quickActions)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Quick Actions"
                    >
                        <span className="text-lg">⚡</span>
                        <span className="text-sm font-medium hidden md:block">Quick Actions</span>
                    </button>
                    
                    {quickActions && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            <div className="p-2">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1">
                                    Quick Actions
                                </div>
                                {can('manage_tenants') && (
                                  <button
                                    onClick={() => { onQuickAction?.('add-tenant'); setQuickActions(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm">
                                      🏫 Add New Tenant
                                  </button>
                                )}
                                {can('manage_users') && (
                                  <button
                                    onClick={() => { onQuickAction?.('create-user'); setQuickActions(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm">
                                      👤 Create User
                                  </button>
                                )}
                                {can('manage_security') && (
                                  <button
                                    onClick={() => { onQuickAction?.('backup'); setQuickActions(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm">
                                      💾 Backup System
                                  </button>
                                )}
                                {can('send_broadcasts') && (
                                  <button
                                    onClick={() => { onQuickAction?.('broadcast'); setQuickActions(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm">
                                      📧 Send Broadcast
                                  </button>
                                )}
                                {can('manage_security') && (
                                  <button
                                    onClick={() => { onQuickAction?.('security-check'); setQuickActions(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm">
                                      🔍 System Check
                                  </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Notifications">
                    <span className="text-lg">🔔</span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        3
                    </span>
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setUserMenu(!userMenu)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">SA</span>
                        </div>
                        <span className="text-sm font-medium hidden md:block">Super Admin</span>
                    </button>

                    {userMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                            <div className="p-2">
                                <div className="px-2 py-2 border-b border-slate-100">
                                    <div className="text-sm font-semibold">Super Administrator</div>
                                    <div className="text-xs text-slate-500">admin@platform.com</div>
                                </div>
                                <button 
                                    onClick={() => { setUserMenu(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm mt-1"
                                >
                                    👤 Profile Settings
                                </button>
                                <button 
                                    onClick={() => { setUserMenu(false); }}
                                    className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm"
                                >
                                    🔐 Security Settings
                                </button>
                                <button className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 text-sm">
                                    🌙 Dark Mode
                                </button>
                                <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button 
                                        onClick={onLogout}
                                        className="w-full text-left px-2 py-2 rounded hover:bg-red-50 hover:text-red-600 text-sm"
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// Loading component
const ContentLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading component...</p>
        </div>
    </div>
);

// Main SuperAdmin Dashboard Component
const SuperAdminDashboard = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('overview');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [role, setRole] = useState<string>('Super Admin');
    const [platformSettings, setPlatformSettings] = useState<any>(null);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            if (session) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const roleName = user?.user_metadata?.platform_role || user?.user_metadata?.role || 'Super Admin';
                    setRole(roleName);
                    setIsSuperAdmin(roleName === 'Super Admin');
                } catch {
                    setIsSuperAdmin(false);
                }
            }
            try {
                const settings = await apiGetPlatformSettings();
                setPlatformSettings(settings);
            } catch {}
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
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading ControlHub...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <SuperAdminLoginPage />;
    }
    if (session && !isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="bg-white p-8 rounded-lg shadow border border-slate-200 text-center max-w-md">
                    <div className="text-5xl mb-4">🚫</div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600">Super Admin role is required to access ControlHub.</p>
                </div>
            </div>
        );
    }

    const can = (key: PermissionKey) => isSuperAdmin || hasPlatformPermission(platformSettings, role, key);

    const viewRequiredPermission = (view: string): PermissionKey | null => {
        const map: Record<string, PermissionKey | null> = {
            overview: null,
            analytics: 'view_reports',
            performance: 'view_reports',
            notifications: 'send_broadcasts',
            reports: 'view_reports',
            tenants: 'manage_tenants',
            users: 'manage_users',
            licenses: 'manage_payments',
            'platform-settings': 'manage_platform_settings',
            database: 'manage_integrations',
            monitoring: 'manage_security',
            backups: 'manage_security',
            'api-manager': 'manage_integrations',
            security: 'manage_security',
            'audit-logs': 'manage_security',
            'access-control': 'manage_users',
            themes: 'manage_content',
            media: 'manage_content',
            branding: 'manage_content',
            plugins: 'manage_plugins',
            'system-tools': 'manage_security',
            'email-center': 'send_broadcasts',
            'import-export': 'manage_integrations',
        };
        return (map as any)[view] ?? null;
    };

    const guardedSetActiveView = (view: string) => {
        const key = viewRequiredPermission(view);
        if (!key || can(key)) setActiveView(view);
        else window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'You do not have permission to access this section.' } }));
    };

    const renderContent = () => {
        switch (activeView) {
            case 'overview': return <SuperAdminOverview />;
            case 'tenants': return <TenantManagement />;
            case 'users': return <UserManagement />;
            case 'platform-settings': return <PlatformSettings />;
            case 'database': return <DatabaseManager />;
            case 'monitoring': return <SystemMonitoring />;
            case 'security': return <SecurityCenter />;
            case 'plugins': return <PluginManager />;
            case 'themes': return <ThemeManager />;
            case 'media': return <MediaLibrary />;
            case 'analytics': return <AdvancedAnalytics />;
            case 'performance': return <PerformanceOptimizer />;
            case 'backups': return <BackupManager />;
            case 'audit-logs': return <AuditLogs />;
            case 'api-manager': return <APIManager />;
            case 'email-center': return <EmailCenter />;
            case 'notifications': return <NotificationCenter />;
            case 'licenses': return <LicenseManager />;
            case 'system-tools': return <SystemTools />;
            case 'reports': return <Reports />;
            case 'admin-profile': return <AdminProfile />;
            default: return <SuperAdminOverview />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <SuperAdminSidebar 
                activeView={activeView} 
                setActiveView={guardedSetActiveView}
                isSidebarCollapsed={isSidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                can={can}
            />
            
            <div className="flex-1 flex flex-col min-w-0">
                {/* Connection Status Bar */}
                <div className="bg-white border-b border-slate-200">
                    <div className="px-6">
                        <ConnectionStatusBar 
                            className="py-2" 
                            showDetails={true} 
                        />
                    </div>
                </div>
                
                <SuperAdminHeader activeView={activeView} onLogout={handleLogout} can={can} roleLabel={isSuperAdmin ? 'Super Administrator' : role} onQuickAction={async (action) => {
                    switch(action){
                        case 'add-tenant':
                            setActiveView('tenants');
                            window.dispatchEvent(new Event('open-add-tenant'));
                            break;
                        case 'create-user':
                            setActiveView('tenants');
                            break;
                        case 'backup': {
                            try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const res = await fetch('/api/backups', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) } });
                                if (!res.ok) throw new Error(await res.text());
                                window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Backup created successfully' } }));
                            } catch (e) {
                                window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Failed to create backup' } }));
                            }
                            break; }
                        case 'broadcast':
                            setActiveView('notifications');
                            break;
                        case 'security-check':
                            setActiveView('security');
                            window.dispatchEvent(new Event('run-security-scan'));
                            break;
                    }
                }} />
                
                <main className="flex-1 p-6 overflow-y-auto">
                    <Suspense fallback={<ContentLoader />}>
                        {renderContent()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
