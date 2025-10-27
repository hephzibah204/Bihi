import React, { useState, useEffect } from 'react';
import { apiGetInvoices, apiGetPayments } from '../services/api';
import StatCard from './StatCard';
import BanknotesIcon from './icons/BanknotesIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CheckIcon from './icons/CheckIcon';
import ScaleIcon from './icons/ScaleIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import PlusIcon from './icons/PlusIcon';
import StatCardSkeleton from './skeletons/StatCardSkeleton';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    action: () => void;
}

const BursaryDashboard = () => {
    const [stats, setStats] = useState({ 
        totalRevenue: 0, 
        totalOutstanding: 0, 
        paymentsPending: 0,
        totalStudents: 0,
        collectionRate: 0,
        monthlyRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'alerts'>('overview');

    const quickActions: QuickAction[] = [
        {
            id: 'create-invoice',
            title: 'Create Invoice',
            description: 'Generate new student invoice',
            icon: DocumentTextIcon,
            color: 'bg-blue-500 hover:bg-blue-600',
            action: () => {}
        },
        {
            id: 'verify-payment',
            title: 'Verify Payment',
            description: 'Review pending payments',
            icon: CheckIcon,
            color: 'bg-green-500 hover:bg-green-600',
            action: () => {}
        },
        {
            id: 'debt-collection',
            title: 'Debt Collection',
            description: 'Manage outstanding debts',
            icon: ScaleIcon,
            color: 'bg-orange-500 hover:bg-orange-600',
            action: () => {}
        },
        {
            id: 'generate-report',
            title: 'Generate Report',
            description: 'Create financial reports',
            icon: ChartBarIcon,
            color: 'bg-purple-500 hover:bg-purple-600',
            action: () => {}
        }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [invoices, payments] = await Promise.all([
                    apiGetInvoices(),
                    apiGetPayments()
                ]);

                const totalRevenue = payments
                    .filter(p => p.status === 'verified')
                    .reduce((sum, p) => sum + p.amount, 0);

                const totalOutstanding = invoices
                    .filter(inv => inv.status !== 'paid')
                    .reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);

                const paymentsPending = payments.filter(p => p.status === 'pending').length;
                
                const totalStudents = invoices.length;
                const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
                const collectionRate = totalStudents > 0 ? Math.round((paidInvoices / totalStudents) * 100) : 0;
                
                // Calculate current month revenue
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthlyRevenue = payments
                    .filter(p => {
                        const paymentDate = new Date(p.createdAt);
                        return p.status === 'verified' && 
                               paymentDate.getMonth() === currentMonth && 
                               paymentDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, p) => sum + p.amount, 0);

                setStats({ 
                    totalRevenue, 
                    totalOutstanding, 
                    paymentsPending,
                    totalStudents,
                    collectionRate,
                    monthlyRevenue
                });
            } catch (error) {
                // Non-fatal: show skeletons
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-16 bg-gray-200 rounded"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Mobile/Tablet Tab Header */}
            <div className="lg:hidden">
                <div className="flex rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('actions')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'actions' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        Actions
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                        Alerts
                    </button>
                </div>
            </div>
            {/* Key Metrics */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${activeTab !== 'overview' ? 'hidden lg:grid' : ''}`}>
                <StatCard
                    title="Total Revenue"
                    value={`₦${stats.totalRevenue.toLocaleString()}`}
                    icon={<BanknotesIcon className="w-6 h-6" />}
                    trend={{ value: '12%', direction: 'up' }}
                    className="bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                />
                <StatCard
                    title="Outstanding Amount"
                    value={`₦${stats.totalOutstanding.toLocaleString()}`}
                    icon={<ArrowTrendingDownIcon className="w-6 h-6" />}
                    trend={{ value: '3%', direction: 'down' }}
                    className="bg-gradient-to-r from-red-50 to-red-100 border-red-200"
                />
                <StatCard
                    title="Pending Verifications"
                    value={stats.paymentsPending}
                    icon={<CheckIcon className="w-6 h-6" />}
                    trend={null}
                    className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
                />
                <StatCard
                    title="Collection Rate"
                    value={`${stats.collectionRate}%`}
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    trend={{ value: '5%', direction: 'up' }}
                    className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
                />
            </div>

            {/* Secondary Metrics */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${activeTab !== 'overview' ? 'hidden lg:grid' : ''}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">This Month Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">₦{stats.monthlyRevenue.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <UserGroupIcon className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Average Payment</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₦{stats.totalStudents > 0 ? Math.round(stats.totalRevenue / stats.totalStudents).toLocaleString() : '0'}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <BanknotesIcon className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className={`${activeTab !== 'actions' ? 'hidden lg:block' : ''} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={action.action}
                                    className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md`}
                                >
                                    <Icon className="w-6 h-6 mb-2" />
                                    <div className="text-left">
                                        <p className="font-medium text-sm">{action.title}</p>
                                        <p className="text-xs opacity-90">{action.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Financial Overview Chart Placeholder */}
                <div className={`${activeTab !== 'overview' ? 'hidden lg:block' : ''} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}
                >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Revenue vs Outstanding</span>
                            <span className="text-sm font-medium text-gray-900">
                                {stats.totalRevenue > 0 ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.totalOutstanding)) * 100) : 0}% collected
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                                style={{ 
                                    width: `${stats.totalRevenue > 0 ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.totalOutstanding)) * 100) : 0}%` 
                                }}
                            ></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Collected</p>
                                <p className="text-lg font-bold text-green-700">₦{stats.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600 font-medium">Outstanding</p>
                                <p className="text-lg font-bold text-red-700">₦{stats.totalOutstanding.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Alerts */}
            <div className={`${activeTab !== 'alerts' ? 'hidden lg:block' : ''} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts & Notifications</h3>
                <div className="space-y-3">
                    {stats.paymentsPending > 0 && (
                        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="p-2 bg-yellow-100 rounded-full mr-3">
                                <CheckIcon className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">
                                    {stats.paymentsPending} payment{stats.paymentsPending > 1 ? 's' : ''} pending verification
                                </p>
                                <p className="text-xs text-yellow-600">Review and verify pending payments</p>
                            </div>
                        </div>
                    )}
                    
                    {stats.totalOutstanding > 0 && (
                        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="p-2 bg-red-100 rounded-full mr-3">
                                <ScaleIcon className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-red-800">
                                    ₦{stats.totalOutstanding.toLocaleString()} in outstanding payments
                                </p>
                                <p className="text-xs text-red-600">Consider debt collection activities</p>
                            </div>
                        </div>
                    )}
                    
                    {stats.paymentsPending === 0 && stats.totalOutstanding === 0 && (
                        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="p-2 bg-green-100 rounded-full mr-3">
                                <CheckIcon className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-800">All payments are up to date!</p>
                                <p className="text-xs text-green-600">No pending verifications or outstanding amounts</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BursaryDashboard;
