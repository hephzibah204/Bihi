import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const DatabaseManager = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [queryResult, setQueryResult] = useState(null);
    const [queryInput, setQueryInput] = useState('');

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Database Manager</h1>
                <p className="text-purple-100">Comprehensive database administration and monitoring tools</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex space-x-4 border-b border-slate-200 mb-6">
                    {['overview', 'query', 'optimize', 'backup', 'migrations'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 font-medium capitalize ${
                                activeTab === tab 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-900">Total Tables</h3>
                            <p className="text-2xl font-bold text-blue-600">47</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-green-900">Total Records</h3>
                            <p className="text-2xl font-bold text-green-600">1,247,893</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h3 className="font-semibold text-purple-900">Database Size</h3>
                            <p className="text-2xl font-bold text-purple-600">2.4 GB</p>
                        </div>
                    </div>
                )}

                {activeTab === 'query' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">SQL Query</label>
                            <textarea
                                value={queryInput}
                                onChange={(e) => setQueryInput(e.target.value)}
                                className="w-full h-32 p-3 border border-slate-300 rounded-lg font-mono text-sm"
                                placeholder="SELECT * FROM tenants LIMIT 10;"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={async ()=>{
                                    try {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        const res = await fetch('/api/db-query', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
                                            body: JSON.stringify({ sql: queryInput })
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        setQueryResult(data?.rows || []);
                                    } catch (e: any) {
                                        setQueryResult([{ error: e?.message || 'Query failed' }]);
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Execute Query
                            </button>
                            <button disabled className="px-4 py-2 bg-slate-300 text-white rounded-lg" title="Coming soon">
                                Explain Query
                            </button>
                        </div>

                        {Array.isArray(queryResult) && queryResult.length > 0 && (
                            <div className="mt-4 overflow-auto border rounded">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {Object.keys(queryResult[0]).map((k) => (
                                                <th key={k} className="text-left py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{k}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queryResult.map((row: any, idx: number) => (
                                            <tr key={idx} className="border-t">
                                                {Object.keys(queryResult[0]).map((k) => (
                                                    <td key={k} className="py-2 px-3 whitespace-nowrap text-slate-800">{String(row[k])}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'optimize' && (
                    <div className="text-center py-12 text-slate-500">
                        <span className="text-4xl mb-4 block">🔧</span>
                        <p>Database optimization tools coming soon</p>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="text-center py-12 text-slate-500">
                        <span className="text-4xl mb-4 block">💾</span>
                        <p>Backup management interface</p>
                    </div>
                )}

                {activeTab === 'migrations' && (
                    <div className="text-center py-12 text-slate-500">
                        <span className="text-4xl mb-4 block">📊</span>
                        <p>Database migration tools</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseManager;