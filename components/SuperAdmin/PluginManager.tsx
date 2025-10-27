import React, { useState } from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

interface Plugin {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    active: boolean;
    category: string;
    icon: string;
}

const PluginManager = () => {
    const [plugins] = useState<Plugin[]>([
        {
            id: 'payment-gateway',
            name: 'Advanced Payment Gateway',
            description: 'Enhanced payment processing with multiple providers',
            version: '2.1.0',
            author: 'DossierNG Team',
            active: true,
            category: 'Payment',
            icon: '💳'
        },
        {
            id: 'sms-notifications',
            name: 'SMS Notifications',
            description: 'Send SMS notifications to parents and students',
            version: '1.5.2',
            author: 'DossierNG Team',
            active: true,
            category: 'Communication',
            icon: '📱'
        },
        {
            id: 'ai-analytics',
            name: 'AI Analytics Plus',
            description: 'Advanced analytics powered by machine learning',
            version: '3.0.1',
            author: 'AI Labs',
            active: false,
            category: 'Analytics',
            icon: '🤖'
        }
    ]);

    const { can } = usePlatformPermission();

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Plugin Manager</h1>
                <p className="text-green-100">Extend platform functionality with powerful plugins</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plugins.map(plugin => (
                    <div key={plugin.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">{plugin.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{plugin.name}</h3>
                                    <p className="text-sm text-slate-500">v{plugin.version} by {plugin.author}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plugin.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-slate-100 text-slate-800'
                            }`}>
                                {plugin.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-4">{plugin.description}</p>
                        
                        <div className="flex space-x-2">
                            <button disabled={!can('manage_plugins')} className={`px-3 py-1 rounded text-sm font-medium ${!can('manage_plugins') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : (plugin.active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700')}`}>
                                {plugin.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button disabled={!can('manage_plugins')} className={`px-3 py-1 border rounded text-sm font-medium ${!can('manage_plugins') ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 hover:bg-slate-50'}`}>
                                Settings
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PluginManager;