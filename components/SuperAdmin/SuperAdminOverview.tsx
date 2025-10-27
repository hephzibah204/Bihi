import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiGetPlatformSettings } from '../../services/api';
import { logger } from '../../utils/logger';

interface DashboardStats {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalRevenue: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    serverUptime: string;
    storageUsed: number;
    storageTotal: number;
}

interface ActivityLog {
    id: string;
    timestamp: Date;
    action: string;
    user: string;
    tenant?: string;
    severity: 'info' | 'warning' | 'error';
    details: string;
}

// Quick Stats Widget
const QuickStatsWidget = ({ stats }: { stats: DashboardStats }) => {
    const quickStats = [
        {
            title: 'Total Tenants',
            value: stats.totalTenants,
            change: '+12%',
            trend: 'up',
            icon: '🏫',
            color: 'blue'
        },
        {
            title: 'Active Users',
            value: stats.totalUsers.toLocaleString(),
            change: '+8%',
            trend: 'up',
            icon: '👥',
            color: 'green'
        },
        {
            title: 'Monthly Revenue',
            value: `$${stats.totalRevenue.toLocaleString()}`,
            change: '+15%',
            trend: 'up',
            icon: '💰',
            color: 'emerald'
        },
        {
            title: 'System Health',
            value: stats.systemHealth === 'healthy' ? 'Excellent' : stats.systemHealth,
            change: '99.9%',
            trend: 'stable',
            icon: stats.systemHealth === 'healthy' ? '✅' : stats.systemHealth === 'warning' ? '⚠️' : '🔴',
            color: stats.systemHealth === 'healthy' ? 'green' : stats.systemHealth === 'warning' ? 'yellow' : 'red'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            <div className="flex items-center mt-2">
                                <span className={`text-sm font-medium ${
                                    stat.trend === 'up' ? 'text-green-600' : 
                                    stat.trend === 'down' ? 'text-red-600' : 'text-slate-500'
                                }`}>
                                    {stat.change}
                                </span>
                                <span className="text-xs text-slate-500 ml-2">vs last month</span>
                            </div>
                        </div>
                        <div className="text-3xl">{stat.icon}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// System Health Widget
const SystemHealthWidget = ({ stats }: { stats: DashboardStats }) => {
    const healthMetrics = [
        { name: 'Server Uptime', value: stats.serverUptime, status: 'good' },
        { name: 'Database', value: '99.9%', status: 'good' },
        { name: 'API Response', value: '245ms', status: 'good' },
        { name: 'Storage', value: `${((stats.storageUsed / stats.storageTotal) * 100).toFixed(1)}%`, status: stats.storageUsed / stats.storageTotal > 0.8 ? 'warning' : 'good' }
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">System Health</h3>
            <div className="space-y-4">
                {healthMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{metric.name}</span>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-900">{metric.value}</span>
                            <div className={`w-3 h-3 rounded-full ${
                                metric.status === 'good' ? 'bg-green-500' : 
                                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Recent Activity Widget
const RecentActivityWidget = ({ activities }: { activities: ActivityLog[] }) => {
    const getActivityIcon = (severity: string) => {
        switch (severity) {
            case 'error': return '🔴';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50">
                        <span className="text-lg">{getActivityIcon(activity.severity)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {activity.action}
                                </p>
                                <span className="text-xs text-slate-500">
                                    {activity.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{activity.details}</p>
                            {activity.tenant && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                                    {activity.tenant}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Quick Actions Widget
const QuickActionsWidget = () => {
    const quickActions = [
        { title: 'Add New Tenant', icon: '🏫', action: 'create-tenant', color: 'blue' },
        { title: 'Create Admin User', icon: '👤', action: 'create-user', color: 'green' },
        { title: 'System Backup', icon: '💾', action: 'backup', color: 'purple' },
        { title: 'Send Broadcast', icon: '📢', action: 'broadcast', color: 'orange' },
        { title: 'View Reports', icon: '📊', action: 'reports', color: 'indigo' },
        { title: 'Security Scan', icon: '🔍', action: 'security-scan', color: 'red' }
    ];

    const handleAction = (action: string) => {
        logger.info('Executing quick action', { action, scope: 'SuperAdminOverview' });
        // TODO: Implement actual actions
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => handleAction(action.action)}
                        className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                        <span className="text-2xl mb-2">{action.icon}</span>
                        <span className="text-sm font-medium text-slate-700 text-center group-hover:text-blue-700">
                            {action.title}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Performance Metrics Widget
const PerformanceMetricsWidget = () => {
    const metrics = [
        { name: 'Page Load Time', value: '1.2s', target: '< 2s', status: 'good' },
        { name: 'API Requests/min', value: '1,247', target: '< 2,000', status: 'good' },
        { name: 'Error Rate', value: '0.02%', target: '< 0.1%', status: 'good' },
        { name: 'CPU Usage', value: '34%', target: '< 70%', status: 'good' },
        { name: 'Memory Usage', value: '58%', target: '< 80%', status: 'good' },
        { name: 'Database Queries', value: '45ms avg', target: '< 100ms', status: 'good' }
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                            <div className={`w-3 h-3 rounded-full ${
                                metric.status === 'good' ? 'bg-green-500' : 
                                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-900">{metric.value}</span>
                            <span className="text-xs text-slate-500">Target: {metric.target}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main SuperAdmin Overview Component
const SuperAdminOverview = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        totalRevenue: 0,
        systemHealth: 'healthy',
        serverUptime: '0 days',
        storageUsed: 0,
        storageTotal: 1000
    });

    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tenants, platformSettings] = await Promise.all([
                    apiGetTenants(),
                    apiGetPlatformSettings()
                ]);

                // Calculate stats from real data
                const activeTenants = (tenants as any[]).filter((t: any) => t.subscriptionStatus === 'active').length;
                const usersList = (tenants as any[]).map((t: any) => Number(t.userCount || 0));
                const totalUsers = usersList.reduce((sum: number, n: number) => sum + n, 0);
                const revenueList = (tenants as any[]).map((t: any) => Number(t.monthlyRevenue || 0));
                const totalRevenue = revenueList.reduce((sum: number, n: number) => sum + n, 0);

                setStats({
                    totalTenants: tenants.length,
                    activeTenants,
                    totalUsers,
                    totalRevenue,
                    systemHealth: 'healthy',
                    serverUptime: '45 days',
                    storageUsed: 750,
                    storageTotal: 1000
                });

                // Mock recent activities
                setActivities([
                    {
                        id: '1',
                        timestamp: new Date(Date.now() - 5 * 60000),
                        action: 'New tenant created',
                        user: 'System',
                        tenant: 'brightstar-academy',
                        severity: 'info',
                        details: 'Brightstar Academy tenant successfully provisioned'
                    },
                    {
                        id: '2',
                        timestamp: new Date(Date.now() - 15 * 60000),
                        action: 'Backup completed',
                        user: 'System',
                        severity: 'info',
                        details: 'Daily system backup completed successfully'
                    },
                    {
                        id: '3',
                        timestamp: new Date(Date.now() - 30 * 60000),
                        action: 'Payment processed',
                        user: 'Payment System',
                        tenant: 'riverside-high',
                        severity: 'info',
                        details: 'Monthly subscription payment of $299 processed'
                    },
                    {
                        id: '4',
                        timestamp: new Date(Date.now() - 45 * 60000),
                        action: 'Security scan completed',
                        user: 'Security System',
                        severity: 'info',
                        details: 'Weekly security scan found no vulnerabilities'
                    },
                    {
                        id: '5',
                        timestamp: new Date(Date.now() - 60 * 60000),
                        action: 'High memory usage detected',
                        user: 'Monitoring System',
                        severity: 'warning',
                        details: 'Memory usage exceeded 80% threshold temporarily'
                    }
                ]);

            } catch (error) {
                logger.captureError(error, 'Failed to fetch dashboard data', { scope: 'SuperAdminOverview' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
                <div className="text-center text-slate-500">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Welcome back, Super Admin!</h1>
                <p className="text-blue-100">Here's what's happening with your platform today.</p>
            </div>

            {/* Quick Stats */}
            <QuickStatsWidget stats={stats} />

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    <PerformanceMetricsWidget />
                    <RecentActivityWidget activities={activities} />
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                    <SystemHealthWidget stats={stats} />
                    <QuickActionsWidget />
                </div>
            </div>
        </div>
    );
};

export default SuperAdminOverview;