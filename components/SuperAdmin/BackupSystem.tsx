import React, { useState } from 'react';

interface Backup {
    id: string;
    name: string;
    size: string;
    date: string;
    type: 'full' | 'database' | 'files';
    status: 'completed' | 'in-progress' | 'failed';
    storage: 'local' | 'aws' | 'google' | 'dropbox';
}

const BackupSystem = () => {
    const [activeTab, setActiveTab] = useState<'backups' | 'schedule' | 'storage' | 'restore'>('backups');
    const [backups] = useState<Backup[]>([
        {
            id: '1',
            name: 'Full_Backup_2024_01_20',
            size: '2.4 GB',
            date: '2024-01-20 03:00 AM',
            type: 'full',
            status: 'completed',
            storage: 'aws'
        },
        {
            id: '2',
            name: 'Database_Backup_2024_01_19',
            size: '450 MB',
            date: '2024-01-19 03:00 AM',
            type: 'database',
            status: 'completed',
            storage: 'local'
        },
        {
            id: '3',
            name: 'Files_Backup_2024_01_18',
            size: '1.8 GB',
            date: '2024-01-18 03:00 AM',
            type: 'files',
            status: 'completed',
            storage: 'google'
        }
    ]);

    const [storageConfig, setStorageConfig] = useState({
        aws: { enabled: false, bucket: '', accessKey: '', secretKey: '', region: 'us-east-1' },
        google: { enabled: false, bucket: '', serviceAccount: '' },
        dropbox: { enabled: false, accessToken: '' }
    });

    const getStatusBadge = (status: Backup['status']) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>;
            case 'in-progress':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">In Progress</span>;
            case 'failed':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Failed</span>;
        }
    };

    const getTypeBadge = (type: Backup['type']) => {
        const colors = {
            full: 'bg-purple-100 text-purple-800',
            database: 'bg-blue-100 text-blue-800',
            files: 'bg-orange-100 text-orange-800'
        };
        return <span className={`px-2 py-1 ${colors[type]} text-xs rounded-full capitalize`}>{type}</span>;
    };

    const BackupsPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Available Backups</h3>
                    <p className="text-sm text-slate-500">View and manage your backup history</p>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    🔄 Create Backup Now
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                    <div className="text-3xl mb-2">💾</div>
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-blue-100 text-sm">Total Backups</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold">11</div>
                    <div className="text-green-100 text-sm">Successful</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-2xl font-bold">8.2 GB</div>
                    <div className="text-purple-100 text-sm">Total Size</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Backup Name</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Size</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.map(backup => (
                            <tr key={backup.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                    <div className="font-medium text-slate-900">{backup.name}</div>
                                    <div className="text-xs text-slate-500">{backup.storage.toUpperCase()}</div>
                                </td>
                                <td className="py-3 px-4">{getTypeBadge(backup.type)}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{backup.size}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{backup.date}</td>
                                <td className="py-3 px-4">{getStatusBadge(backup.status)}</td>
                                <td className="py-3 px-4">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
                                        <button className="text-green-600 hover:text-green-700 text-sm">Restore</button>
                                        <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const SchedulePanel = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                        <h4 className="font-semibold text-blue-900">Automated Backups</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Schedule regular backups to protect your data automatically
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Backup Schedule</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-900">Daily Database Backup</h4>
                            <p className="text-sm text-slate-500">Every day at 3:00 AM</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-900">Weekly Full Backup</h4>
                            <p className="text-sm text-slate-500">Every Sunday at 2:00 AM</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-900">Monthly Archive</h4>
                            <p className="text-sm text-slate-500">First day of each month at 1:00 AM</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Custom Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                            <option>Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                        <input
                            type="time"
                            defaultValue="03:00"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Backup Type</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Full Backup</option>
                            <option>Database Only</option>
                            <option>Files Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Retention (days)</label>
                        <input
                            type="number"
                            defaultValue={30}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button className="mt-4 w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Schedule
                </button>
            </div>
        </div>
    );

    const StoragePanel = () => (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">☁️ AWS S3</h3>
                        <p className="text-sm text-slate-500">Store backups in Amazon S3</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={storageConfig.aws.enabled}
                            onChange={(e) => setStorageConfig({
                                ...storageConfig,
                                aws: { ...storageConfig.aws, enabled: e.target.checked }
                            })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                {storageConfig.aws.enabled && (
                    <div className="space-y-3 mt-4">
                        <input
                            type="text"
                            placeholder="Bucket Name"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Access Key ID"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="password"
                            placeholder="Secret Access Key"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="us-east-1">US East (N. Virginia)</option>
                            <option value="us-west-2">US West (Oregon)</option>
                            <option value="eu-west-1">EU (Ireland)</option>
                            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        </select>
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save AWS Configuration
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">🌐 Google Cloud Storage</h3>
                        <p className="text-sm text-slate-500">Store backups in GCS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={storageConfig.google.enabled}
                            onChange={(e) => setStorageConfig({
                                ...storageConfig,
                                google: { ...storageConfig.google, enabled: e.target.checked }
                            })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                {storageConfig.google.enabled && (
                    <div className="space-y-3 mt-4">
                        <input
                            type="text"
                            placeholder="Bucket Name"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <textarea
                            placeholder="Service Account JSON"
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save Google Cloud Configuration
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">📦 Dropbox</h3>
                        <p className="text-sm text-slate-500">Store backups in Dropbox</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={storageConfig.dropbox.enabled}
                            onChange={(e) => setStorageConfig({
                                ...storageConfig,
                                dropbox: { ...storageConfig.dropbox, enabled: e.target.checked }
                            })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                {storageConfig.dropbox.enabled && (
                    <div className="space-y-3 mt-4">
                        <input
                            type="password"
                            placeholder="Access Token"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save Dropbox Configuration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const RestorePanel = () => (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h4 className="font-semibold text-red-900">Warning</h4>
                        <p className="text-sm text-red-700 mt-1">
                            Restoring a backup will overwrite current data. Always backup current state first.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Restore from Backup</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Backup</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {backups.map(backup => (
                                <option key={backup.id} value={backup.id}>
                                    {backup.name} - {backup.date}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Restore Options</label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-slate-700">Restore Database</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-slate-700">Restore Files</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm text-slate-700">Restore Configuration</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Before proceeding:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                            <li>Download current backup as safety measure</li>
                            <li>Notify all users about upcoming maintenance</li>
                            <li>Estimated downtime: 15-30 minutes</li>
                        </ul>
                    </div>

                    <button className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        🔄 Start Restore Process
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Backup & Restore System</h1>
                <p className="text-blue-100">Protect your data with automated backups and easy restoration</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex space-x-4 border-b border-slate-200 mb-6">
                    {[
                        { id: 'backups', label: 'Backups', icon: '💾' },
                        { id: 'schedule', label: 'Schedule', icon: '⏰' },
                        { id: 'storage', label: 'Cloud Storage', icon: '☁️' },
                        { id: 'restore', label: 'Restore', icon: '🔄' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 py-2 px-4 font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'backups' && <BackupsPanel />}
                {activeTab === 'schedule' && <SchedulePanel />}
                {activeTab === 'storage' && <StoragePanel />}
                {activeTab === 'restore' && <RestorePanel />}
            </div>
        </div>
    );
};

export default BackupSystem;