import React, { useState, useEffect } from 'react';
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

interface NavigationItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

const Bursary = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    // Hide native Bursar menu; rely on global sidebar
    const showInternalMenu = false;

    useEffect(() => {
        try {
            const initialTab = localStorage.getItem('bursaryInitialTab');
            if (initialTab) {
                setActiveView(initialTab);
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
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Bursary;