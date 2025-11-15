import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import BursaryDashboard from './BursaryDashboard';
import BursaryFees from './BursaryFees';
import BursaryInvoice from './BursaryInvoice';
import BursaryDebtManagement from './BursaryDebtManagement';
import BursaryExpenses from './BursaryExpenses';
import BursaryReports from './BursaryReports';
import BursaryScratchCards from './BursaryScratchCards';
import PayrollDashboard from './PayrollDashboard';
import BursaryVerifyPayments from './BursaryVerifyPayments';
import BursaryIncome from './BursaryIncome';
import AuditLog from './AuditLog';
import QuickRecordPaymentModal from './QuickRecordPaymentModal';

// Import icons
import HomeIcon from './icons/HomeIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ScaleIcon from './icons/ScaleIcon';
import CheckIcon from './icons/CheckIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import HistoryIcon from './icons/HistoryIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import PrinterIcon from './icons/PrinterIcon';
import BursaryPrintCenter from './BursaryPrintCenter';

interface NavigationItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

const Bursary = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });
    const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });
    // Show native Bursar menu inside Bursary so sub-pages (e.g., Print Center) are directly accessible
    const showInternalMenu = true;
    const { user } = useAuth();
    const { settings } = useTenant();

    useEffect(() => {
        try {
            const tenantId = localStorage.getItem('tenantId') || (settings as any)?.id || 'default';
            const uid = localStorage.getItem('currentUserId') || (user as any)?.id || 'guest';
            const key = `bursary_tab_${tenantId}_${uid}`;
            const persisted = localStorage.getItem(key);
            const initialTab = persisted || localStorage.getItem('bursaryInitialTab');
            if (initialTab) {
                setActiveView(initialTab);
            }
        } catch {}
    }, [settings, user]);

    // When navigated from bottom nav, open the quick record modal
    useEffect(() => {
        try {
            const flag = localStorage.getItem('openQuickRecordPayment');
            if (flag === 'true') {
                setIsQuickRecordOpen(true);
                localStorage.removeItem('openQuickRecordPayment');
            }
        } catch (e) {
            // no-op
        }
    }, []);

    // Poll localStorage for bursaryInitialTab changes to allow sidebar-driven navigation
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const tab = localStorage.getItem('bursaryInitialTab');
                if (tab && tab !== activeView) {
                    setActiveView(tab);
                }
            } catch (e) {
                // no-op
            }
        }, 500);
        return () => clearInterval(interval);
    }, [activeView]);

    useEffect(() => {
        try {
            const tenantId = localStorage.getItem('tenantId') || (settings as any)?.id || 'default';
            const uid = localStorage.getItem('currentUserId') || (user as any)?.id || 'guest';
            const key = `bursary_tab_${tenantId}_${uid}`;
            localStorage.setItem('bursaryInitialTab', activeView);
            localStorage.setItem(key, activeView);
        } catch {}
    }, [activeView, settings, user]);

    useEffect(() => {
        const handler = () => {
            if (typeof window !== 'undefined') {
                setIsMobile(window.innerWidth < 768);
            }
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const bottomNavItems: NavigationItem[] = [
        { id: 'dashboard', label: 'Home', icon: HomeIcon, description: '' },
        { id: 'invoices', label: 'Invoices', icon: DocumentTextIcon, description: '' },
        { id: 'verify', label: 'Verify', icon: CheckIcon, description: '' },
        { id: 'expenses', label: 'Expenses', icon: ArrowTrendingDownIcon, description: '' },
        { id: 'payroll', label: 'Payroll', icon: UserGroupIcon, description: '' }
    ];

    const navigationItems: NavigationItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: HomeIcon,
            description: 'Overview & Analytics'
        },
        {
            id: 'fees',
            label: 'Fee Setup',
            icon: BanknotesIcon,
            description: 'Configure school fees'
        },
        {
            id: 'invoices',
            label: 'Invoices',
            icon: DocumentTextIcon,
            description: 'Manage invoices'
        },
        {
            id: 'debt-management',
            label: 'Debt Management',
            icon: ScaleIcon,
            description: 'Outstanding payments'
        },
        {
            id: 'verify',
            label: 'Verify Payments',
            icon: CheckIcon,
            description: 'Payment verification'
        },
        {
            id: 'expenses',
            label: 'Expenses',
            icon: ArrowTrendingDownIcon,
            description: 'Track expenses'
        },
        {
            id: 'income',
            label: 'Other Income',
            icon: ArrowTrendingUpIcon,
            description: 'Additional revenue'
        },
        {
            id: 'payroll',
            label: 'Payroll',
            icon: UserGroupIcon,
            description: 'Staff payments'
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: ChartBarIcon,
            description: 'Financial reports'
        },
        {
            id: 'audit',
            label: 'Audit Log',
            icon: HistoryIcon,
            description: 'Activity tracking'
        },
        {
            id: 'scratch-cards',
            label: 'Scratch Cards',
            icon: CreditCardIcon,
            description: 'Payment cards'
        },
        {
            id: 'print-center',
            label: 'Print Center',
            icon: PrinterIcon,
            description: 'Bulk print receipts, invoices, reminders'
        }
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <BursaryDashboard />;
            case 'fees': return <BursaryFees />;
            case 'invoices': return <BursaryInvoice />;
            case 'debt-management': return <BursaryDebtManagement />;
            case 'expenses': return <BursaryExpenses />;
            case 'income': return <BursaryIncome />;
            case 'verify': return <BursaryVerifyPayments />;
            case 'payroll': return <PayrollDashboard />;
            case 'reports': return <BursaryReports />;
            case 'audit': return <AuditLog />;
            case 'scratch-cards': return <BursaryScratchCards />;
            case 'print-center': return <BursaryPrintCenter />;
            default: return <BursaryDashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - hidden for Bursar native menu */}
            {showInternalMenu && (
                <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Bursar</h1>
                                <p className="text-sm text-gray-500">Financial Management</p>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                                title={sidebarCollapsed ? item.label : ''}
                            >
                                <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} flex-shrink-0`} />
                                {!sidebarCollapsed && (
                                    <div className="text-left">
                                        <div className="font-medium">{item.label}</div>
                                        <div className="text-xs text-gray-500">{item.description}</div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {navigationItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {navigationItems.find(item => item.id === activeView)?.description || 'Financial overview and analytics'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsQuickRecordOpen(true)}
                                title="Record a payment for any student"
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`flex-1 overflow-auto ${((activeView === 'verify' || activeView === 'payroll') && isMobile) ? 'p-3 md:p-6' : 'p-6'} pb-20 md:pb-0`}>
                    {renderContent()}
                </div>
                <QuickRecordPaymentModal
                    isOpen={isQuickRecordOpen}
                    onClose={() => setIsQuickRecordOpen(false)}
                    onSuccess={() => {
                        // If currently on invoices or verify, a refresh may be useful.
                        // Keeping it simple: no explicit reload; pages listen to data from api services.
                    }}
                />
                <button
                    className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg md:px-5 md:py-3"
                    onClick={() => setIsQuickActionsOpen(v => !v)}
                >
                    Quick Actions
                </button>
                {isQuickActionsOpen && (
                    <div className="fixed bottom-36 right-4 left-4 md:left-auto md:bottom-20 md:right-6 bg-white border border-gray-200 rounded-lg shadow-2xl w-auto md:w-80">
                        <div className="p-3 md:p-4 space-y-2">
                            <button
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-indigo-50 text-indigo-700"
                                onClick={() => { setIsQuickRecordOpen(true); setIsQuickActionsOpen(false); }}
                            >
                                <span>Record Payment</span>
                            </button>
                            <button
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100"
                                onClick={() => { setActiveView('invoices'); setIsQuickActionsOpen(false); }}
                            >
                                <span>Issue Invoice</span>
                            </button>
                            <button
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100"
                                onClick={() => { setActiveView('verify'); setIsQuickActionsOpen(false); }}
                            >
                                <span>Verify Payment</span>
                            </button>
                        </div>
                    </div>
                )}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                    <div className="flex justify-around items-center py-2">
                        {bottomNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    className={`flex flex-col items-center text-xs ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}
                                >
                                    <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-indigo-600' : 'text-gray-600'}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bursary;
