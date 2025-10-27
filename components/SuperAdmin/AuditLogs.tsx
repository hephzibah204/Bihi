import React, { useState } from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

interface AuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    module: string;
    details: string;
    ipAddress: string;
    status: 'success' | 'failed' | 'warning';
}

const AuditLogs = () => {
    const [logs] = useState<AuditLog[]>([
        {
            id: '1',
            timestamp: '2024-01-20 14:35:22',
            user: 'admin@school.com',
            action: 'User Created',
            module: 'User Management',
            details: 'Created new teacher account: john.doe@school.com',
            ipAddress: '192.168.1.100',
            status: 'success'
        },
        {
            id: '2',
            timestamp: '2024-01-20 14:30:15',
            user: 'superadmin@school.com',
            action: 'Payment Gateway Updated',
            module: 'Payment Settings',
            details: 'Updated Paystack API keys',
            ipAddress: '192.168.1.105',
            status: 'success'
        },
        {
            id: '3',
            timestamp: '2024-01-20 14:25:08',
            user: 'admin@school.com',
            action: 'Login Attempt Failed',
            module: 'Authentication',
            details: 'Invalid password - 3 attempts',
            ipAddress: '203.45.67.89',
            status: 'failed'
        },
        {
            id: '4',
            timestamp: '2024-01-20 14:20:45',
            user: 'finance@school.com',
            action: 'Backup Created',
            module: 'System',
            details: 'Manual full system backup initiated',
            ipAddress: '192.168.1.102',
            status: 'success'
        },
        {
            id: '5',
            timestamp: '2024-01-20 14:15:30',
            user: 'superadmin@school.com',
            action: 'Role Permissions Modified',
            module: 'Access Control',
            details: 'Updated Teacher role permissions',
            ipAddress: '192.168.1.105',
            status: 'warning'
        }
    ]);

    const [filters, setFilters] = useState({
        module: 'all',
        status: 'all',
        dateRange: '7days',
        searchTerm: ''
    });

    const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
    const { can } = usePlatformPermission();

    const getStatusBadge = (status: AuditLog['status']) => {
        switch (status) {
            case 'success':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Success</span>;
            case 'failed':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Failed</span>;
            case 'warning':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Warning</span>;
        }
    };

    const getModuleBadge = (module: string) => {
        const colors: { [key: string]: string } = {
            'User Management': 'bg-blue-100 text-blue-800',
            'Payment Settings': 'bg-green-100 text-green-800',
            'Authentication': 'bg-purple-100 text-purple-800',
            'System': 'bg-slate-100 text-slate-800',
            'Access Control': 'bg-orange-100 text-orange-800'
        };
        return <span className={`px-2 py-1 ${colors[module] || 'bg-slate-100 text-slate-800'} text-xs rounded-full`}>{module}</span>;
    };

    const handleSelectAll = () => {
        if (selectedLogs.length === logs.length) {
            setSelectedLogs([]);
        } else {
            setSelectedLogs(logs.map(log => log.id));
        }
    };

    const handleSelectLog = (id: string) => {
        if (selectedLogs.includes(id)) {
            setSelectedLogs(selectedLogs.filter(logId => logId !== id));
        } else {
            setSelectedLogs([...selectedLogs, id]);
        }
    };

    const exportLogs = (format: 'csv' | 'json' | 'pdf') => {
        alert(`Exporting ${selectedLogs.length > 0 ? selectedLogs.length : logs.length} logs as ${format.toUpperCase()}`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
                <p className="text-slate-300">Track all administrative actions and system events</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                            📊
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">2,847</div>
                            <div className="text-sm text-slate-500">Total Events</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                            ✅
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">2,790</div>
                            <div className="text-sm text-slate-500">Successful</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
                            ❌
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">42</div>
                            <div className="text-sm text-slate-500">Failed</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                            ⚠️
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">15</div>
                            <div className="text-sm text-slate-500">Warnings</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Filter Logs</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Module</label>
                        <select
                            value={filters.module}
                            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Modules</option>
                            <option value="user">User Management</option>
                            <option value="payment">Payment Settings</option>
                            <option value="auth">Authentication</option>
                            <option value="system">System</option>
                            <option value="access">Access Control</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="warning">Warning</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                        <input
                            type="text"
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                            placeholder="Search logs..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Reset Filters
                    </button>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => exportLogs('csv')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                            📊 Export CSV
                        </button>
                        <button
                            onClick={() => exportLogs('json')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            📄 Export JSON
                        </button>
                        <button
                            onClick={() => exportLogs('pdf')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                            📑 Export PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left py-3 px-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedLogs.length === logs.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                </th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Timestamp</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">User</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Action</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Module</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">IP Address</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedLogs.includes(log.id)}
                                            onChange={() => handleSelectLog(log.id)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600">{log.timestamp}</td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium text-slate-900">{log.user}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium text-slate-900">{log.action}</div>
                                        <div className="text-xs text-slate-500">{log.details}</div>
                                    </td>
                                    <td className="py-3 px-4">{getModuleBadge(log.module)}</td>
                                    <td className="py-3 px-4 text-sm text-slate-600 font-mono">{log.ipAddress}</td>
                                    <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                                    <td className="py-3 px-4">
                                        <button className="text-blue-600 hover:text-blue-700 text-sm">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        Showing 1-5 of 2,847 entries
                        {selectedLogs.length > 0 && (
                            <span className="ml-2 text-blue-600 font-medium">
                                ({selectedLogs.length} selected)
                            </span>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 text-sm">
                            Previous
                        </button>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                            1
                        </button>
                        <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 text-sm">
                            2
                        </button>
                        <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 text-sm">
                            3
                        </button>
                        <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 text-sm">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Audit Log Settings</h3>
                {!can('manage_security') && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded">You have read-only access to audit settings.</div>
                )}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Enable Audit Logging</h4>
                            <p className="text-sm text-slate-500">Track all administrative actions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked disabled={!can('manage_security')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Log User Login/Logout</h4>
                            <p className="text-sm text-slate-500">Track authentication events</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked disabled={!can('manage_security')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Log Data Changes</h4>
                            <p className="text-sm text-slate-500">Track modifications to records</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked disabled={!can('manage_security')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Log Failed Actions</h4>
                            <p className="text-sm text-slate-500">Track security threats and errors</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked disabled={!can('manage_security')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Log Retention Period
                        </label>
                        <select disabled={!can('manage_security')} className={`w-full md:w-64 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!can('manage_security') ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}>
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                            <option value="180">6 Months</option>
                            <option value="365">1 Year</option>
                            <option value="0">Forever</option>
                        </select>
                    </div>
                </div>
                <button disabled={!can('manage_security')} className={`mt-6 px-6 py-2 rounded-lg ${!can('manage_security') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default AuditLogs;