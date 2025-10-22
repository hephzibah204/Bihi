import React, { useState } from 'react';

const AdvancedAnalytics = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'performance'>('overview');
    const [dateRange, setDateRange] = useState('7days');

    const OverviewPanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">👥</span>
                        <span className="text-sm bg-white/20 px-2 py-1 rounded">+12%</span>
                    </div>
                    <div className="text-2xl font-bold">2,847</div>
                    <div className="text-blue-100 text-sm">Total Users</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">💰</span>
                        <span className="text-sm bg-white/20 px-2 py-1 rounded">+8%</span>
                    </div>
                    <div className="text-2xl font-bold">₦4.2M</div>
                    <div className="text-green-100 text-sm">Revenue (MTD)</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">📊</span>
                        <span className="text-sm bg-white/20 px-2 py-1 rounded">+25%</span>
                    </div>
                    <div className="text-2xl font-bold">89%</div>
                    <div className="text-purple-100 text-sm">Payment Success Rate</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">⭐</span>
                        <span className="text-sm bg-white/20 px-2 py-1 rounded">-3%</span>
                    </div>
                    <div className="text-2xl font-bold">4.8</div>
                    <div className="text-orange-100 text-sm">Avg Rating</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">User Growth</h3>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {[420, 380, 520, 610, 580, 720, 850].map((value, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                                    style={{ height: `${(value / 850) * 100}%` }}
                                />
                                <span className="text-xs text-slate-500 mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Revenue Trends</h3>
                    <div className="h-64 flex items-end justify-between space-x-2">
                        {[320000, 450000, 380000, 520000, 610000, 580000, 720000].map((value, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                                    style={{ height: `${(value / 720000) * 100}%` }}
                                />
                                <span className="text-xs text-slate-500 mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Top Performing Schools</h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Grace Academy', students: 1250, revenue: '₦1.2M', growth: '+15%' },
                            { name: 'Royal International', students: 980, revenue: '₦890K', growth: '+12%' },
                            { name: 'Wisdom Heights', students: 850, revenue: '₦750K', growth: '+8%' },
                            { name: 'Excel College', students: 720, revenue: '₦680K', growth: '+6%' }
                        ].map((school, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{school.name}</div>
                                        <div className="text-xs text-slate-500">{school.students} students</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-slate-900">{school.revenue}</div>
                                    <div className="text-xs text-green-600">{school.growth}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">User Distribution</h3>
                    <div className="flex items-center justify-center h-48">
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="20"
                                    strokeDasharray="125.6 251.2"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="20"
                                    strokeDasharray="62.8 188.4"
                                    strokeDashoffset="-125.6"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="20"
                                    strokeDasharray="62.8 188.4"
                                    strokeDashoffset="-188.4"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="text-xs text-slate-500">Students</span>
                            </div>
                            <div className="font-semibold text-slate-900">50%</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="text-xs text-slate-500">Parents</span>
                            </div>
                            <div className="font-semibold text-slate-900">25%</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                <span className="text-xs text-slate-500">Staff</span>
                            </div>
                            <div className="font-semibold text-slate-900">25%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const UsersPanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Active Users (24h)</div>
                    <div className="text-2xl font-bold text-slate-900">1,248</div>
                    <div className="text-xs text-green-600 mt-1">↑ 15% from yesterday</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">New Registrations</div>
                    <div className="text-2xl font-bold text-slate-900">142</div>
                    <div className="text-xs text-green-600 mt-1">↑ 8% from last week</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Avg Session Duration</div>
                    <div className="text-2xl font-bold text-slate-900">12m 34s</div>
                    <div className="text-xs text-red-600 mt-1">↓ 2% from last week</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">User Activity Heatmap</h3>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 168 }, (_, i) => {
                        const intensity = Math.random();
                        return (
                            <div
                                key={i}
                                className="aspect-square rounded"
                                style={{
                                    backgroundColor:
                                        intensity > 0.7
                                            ? '#10b981'
                                            : intensity > 0.4
                                            ? '#6ee7b7'
                                            : intensity > 0.2
                                            ? '#d1fae5'
                                            : '#f0fdf4'
                                }}
                                title={`${Math.floor(intensity * 1000)} activities`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between mt-4 text-xs text-slate-500">
                    <span>Less</span>
                    <div className="flex space-x-1">
                        <div className="w-4 h-4 bg-slate-50 rounded" />
                        <div className="w-4 h-4 bg-green-100 rounded" />
                        <div className="w-4 h-4 bg-green-300 rounded" />
                        <div className="w-4 h-4 bg-green-500 rounded" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Top User Actions</h3>
                <div className="space-y-3">
                    {[
                        { action: 'View Results', count: 5420, percentage: 32 },
                        { action: 'Make Payment', count: 3850, percentage: 23 },
                        { action: 'Check Attendance', count: 3210, percentage: 19 },
                        { action: 'Download Documents', count: 2680, percentage: 16 },
                        { action: 'Send Messages', count: 1720, percentage: 10 }
                    ].map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-700">{item.action}</span>
                                <span className="font-medium text-slate-900">{item.count.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const RevenuePanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-slate-900">₦4.2M</div>
                    <div className="text-xs text-green-600 mt-1">↑ 12% MTD</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Outstanding</div>
                    <div className="text-2xl font-bold text-orange-600">₦820K</div>
                    <div className="text-xs text-slate-500 mt-1">19% of total</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Avg Transaction</div>
                    <div className="text-2xl font-bold text-slate-900">₦15,200</div>
                    <div className="text-xs text-green-600 mt-1">↑ 5% MTD</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Refunds</div>
                    <div className="text-2xl font-bold text-red-600">₦42K</div>
                    <div className="text-xs text-slate-500 mt-1">1% of revenue</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Revenue by Payment Method</h3>
                <div className="space-y-4">
                    {[
                        { method: 'Bank Transfer', amount: '₦1.8M', percentage: 43, color: 'bg-blue-500' },
                        { method: 'Card Payment', amount: '₦1.4M', percentage: 33, color: 'bg-green-500' },
                        { method: 'Mobile Money', amount: '₦720K', percentage: 17, color: 'bg-purple-500' },
                        { method: 'Cash', amount: '₦280K', percentage: 7, color: 'bg-orange-500' }
                    ].map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-700">{item.method}</span>
                                <span className="text-sm font-bold text-slate-900">{item.amount}</span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${item.color} rounded-full`}
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-700">Date</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-700">Student</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-700">Type</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-700">Amount</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { date: '2024-01-20', student: 'John Doe', type: 'School Fees', amount: '₦45,000', status: 'Success' },
                                { date: '2024-01-20', student: 'Jane Smith', type: 'Books', amount: '₦12,500', status: 'Success' },
                                { date: '2024-01-19', student: 'Mike Johnson', type: 'Transport', amount: '₦8,000', status: 'Pending' },
                                { date: '2024-01-19', student: 'Sarah Williams', type: 'School Fees', amount: '₦45,000', status: 'Failed' }
                            ].map((txn, idx) => (
                                <tr key={idx} className="border-t border-slate-100">
                                    <td className="py-2 px-3 text-xs text-slate-600">{txn.date}</td>
                                    <td className="py-2 px-3 text-xs text-slate-900">{txn.student}</td>
                                    <td className="py-2 px-3 text-xs text-slate-600">{txn.type}</td>
                                    <td className="py-2 px-3 text-xs font-medium text-slate-900">{txn.amount}</td>
                                    <td className="py-2 px-3">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                                txn.status === 'Success'
                                                    ? 'bg-green-100 text-green-800'
                                                    : txn.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const PerformancePanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Avg Page Load</div>
                    <div className="text-2xl font-bold text-slate-900">1.2s</div>
                    <div className="text-xs text-green-600 mt-1">↓ 0.3s from last week</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">API Response Time</div>
                    <div className="text-2xl font-bold text-slate-900">145ms</div>
                    <div className="text-xs text-green-600 mt-1">↓ 12ms from last week</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-sm text-slate-500 mb-1">Error Rate</div>
                    <div className="text-2xl font-bold text-slate-900">0.3%</div>
                    <div className="text-xs text-green-600 mt-1">↓ 0.1% from last week</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">System Health</h3>
                <div className="space-y-4">
                    {[
                        { service: 'Web Server', status: 'Healthy', uptime: '99.98%', color: 'bg-green-500' },
                        { service: 'Database', status: 'Healthy', uptime: '99.95%', color: 'bg-green-500' },
                        { service: 'API Gateway', status: 'Healthy', uptime: '99.92%', color: 'bg-green-500' },
                        { service: 'Email Service', status: 'Degraded', uptime: '98.50%', color: 'bg-yellow-500' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 ${item.color} rounded-full`} />
                                <div>
                                    <div className="font-medium text-slate-900">{item.service}</div>
                                    <div className="text-xs text-slate-500">{item.status}</div>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-slate-900">{item.uptime}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Browser Distribution</h3>
                <div className="space-y-3">
                    {[
                        { browser: 'Chrome', percentage: 65, users: 1850 },
                        { browser: 'Safari', percentage: 20, users: 570 },
                        { browser: 'Firefox', percentage: 10, users: 285 },
                        { browser: 'Edge', percentage: 5, users: 142 }
                    ].map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-700">{item.browser}</span>
                                <span className="text-slate-500">{item.users} users</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Advanced Analytics</h1>
                <p className="text-pink-100">Comprehensive insights into platform performance and user behavior</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex space-x-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'users', label: 'Users', icon: '👥' },
                            { id: 'revenue', label: 'Revenue', icon: '💰' },
                            { id: 'performance', label: 'Performance', icon: '⚡' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                {activeTab === 'overview' && <OverviewPanel />}
                {activeTab === 'users' && <UsersPanel />}
                {activeTab === 'revenue' && <RevenuePanel />}
                {activeTab === 'performance' && <PerformancePanel />}
            </div>
        </div>
    );
};

export default AdvancedAnalytics;