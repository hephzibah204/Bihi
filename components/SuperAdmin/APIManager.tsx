import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import { supabase } from '../../services/supabaseClient';

interface APIKey {
    id: string;
    name: string;
    key?: string; // full key only returned on creation
    key_preview?: string; // masked preview for listing
    environment: 'production' | 'development';
    permissions: string[];
    rateLimit: number;
    createdAt: string;
    lastUsed: string;
    status: 'active' | 'revoked';
}

interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive';
    lastTriggered: string;
}

const APIManager = () => {
    const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs' | 'logs'>('keys');
    const [apiKeys, setApiKeys] = useState<APIKey[]>([
        {
            id: '1',
            name: 'Mobile App - Production',
            key: 'sk_prod_xxxxxxxxxxxxxxxxxxx',
            environment: 'production',
            permissions: ['read:students', 'write:attendance', 'read:results'],
            rateLimit: 1000,
            createdAt: '2024-01-15',
            lastUsed: '2024-01-20 14:35',
            status: 'active'
        },
        {
            id: '2',
            name: 'Payment Gateway Integration',
            key: 'sk_prod_yyyyyyyyyyyyyyyyyyy',
            environment: 'production',
            permissions: ['read:payments', 'write:payments'],
            rateLimit: 500,
            createdAt: '2024-01-10',
            lastUsed: '2024-01-20 13:22',
            status: 'active'
        }
    ]);

    const [webhooks, setWebhooks] = useState<Webhook[]>([
        {
            id: '1',
            url: 'https://example.com/webhooks/payment',
            events: ['payment.success', 'payment.failed'],
            status: 'active',
            lastTriggered: '2024-01-20 14:30'
        },
        {
            id: '2',
            url: 'https://example.com/webhooks/student',
            events: ['student.created', 'student.updated'],
            status: 'active',
            lastTriggered: '2024-01-20 10:15'
        }
    ]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeyValue, setShowKeyValue] = useState<string | null>(null);
    const [newKey, setNewKey] = useState({ name: '', environment: 'development', rateLimit: 1000 });
    const [busy, setBusy] = useState(false);
    const [showCreateWebhook, setShowCreateWebhook] = useState(false);
    const [newHook, setNewHook] = useState<{url: string; events: string}>({ url: '', events: '' });

    const authHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    };

    const loadKeys = async () => {
        try {
            const headers = await authHeaders();
            const res = await fetch('/api/api-keys', { headers });
            if (res.ok) setApiKeys(await res.json());
        } catch {}
    };
    const loadWebhooks = async () => {
        try {
            const headers = await authHeaders();
            const res = await fetch('/api/webhooks', { headers });
            if (res.ok) setWebhooks(await res.json());
        } catch {}
    };

    useEffect(() => { void loadKeys(); void loadWebhooks(); }, []);

    const revokeKey = async (id: string) => {
        try {
            const headers = await authHeaders();
            await fetch(`/api/api-keys/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ status: 'revoked' }) });
            await loadKeys();
            alert('API Key revoked successfully');
        } catch { alert('Failed to revoke key'); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const APIKeysPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">API Keys</h3>
                    <p className="text-sm text-slate-500">Manage API keys for external integrations</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Create New Key
                </button>
            </div>
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create API Key">
                <div className="p-6 space-y-3">
                    <div>
                        <label className="label">Name</label>
                        <input className="input-field" value={newKey.name} onChange={e=>setNewKey({...newKey, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="label">Environment</label>
                        <select className="input-field" value={newKey.environment} onChange={e=>setNewKey({...newKey, environment: e.target.value})}>
                            <option value="development">Development</option>
                            <option value="production">Production</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Rate Limit (per hour)</label>
                        <input type="number" className="input-field" value={newKey.rateLimit} onChange={e=>setNewKey({...newKey, rateLimit: Number(e.target.value)})} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button className="btn btn-secondary" onClick={()=>setShowCreateModal(false)}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            disabled={busy || !newKey.name}
                            onClick={async ()=>{
                                try {
                                    setBusy(true);
                                    const headers = await authHeaders();
                                    const res = await fetch('/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(newKey) });
                                    if (!res.ok) throw new Error(await res.text());
                                    const created = await res.json();
                                    setShowCreateModal(false);
                                    await loadKeys();
                                    alert(`Key created: ${created.key}`);
                                } catch {
                                    alert('Failed to create key');
                                } finally { setBusy(false); }
                            }}
                        >
                            {busy ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">🔐</span>
                    <div>
                        <h4 className="font-semibold text-blue-900">Security Best Practices</h4>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>Store API keys securely and never commit them to version control</li>
                            <li>Rotate keys regularly and revoke unused keys</li>
                            <li>Use different keys for development and production</li>
                            <li>Set appropriate rate limits to prevent abuse</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {apiKeys.map(apiKey => (
                    <div key={apiKey.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-semibold text-slate-900">{apiKey.name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        apiKey.environment === 'production'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {apiKey.environment}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        apiKey.status === 'active'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {apiKey.status}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 mb-3">
                                    <code className="text-sm bg-slate-100 px-3 py-1 rounded font-mono">
                                        {apiKey.key_preview || '••••••••••••••••••••'}
                                    </code>
                                    <button
                                        disabled
                                        title="Full key is shown only once on creation"
                                        className="text-slate-300 cursor-not-allowed"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        disabled
                                        title="Copy disabled (full key not stored)"
                                        className="text-slate-300 cursor-not-allowed"
                                    >
                                        📋
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {apiKey.permissions.map((perm, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                            {perm}
                                        </span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Rate Limit:</span>
                                        <span className="ml-2 font-medium">{apiKey.rateLimit}/hr</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Created:</span>
                                        <span className="ml-2 font-medium">{apiKey.createdAt}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Last Used:</span>
                                        <span className="ml-2 font-medium">{apiKey.lastUsed}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-4 border-t border-slate-200">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Edit Permissions
                            </button>
                            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                                Regenerate
                            </button>
                            {apiKey.status === 'active' && (
                                <button
                                    onClick={() => revokeKey(apiKey.id)}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const WebhooksPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Webhooks</h3>
                    <p className="text-sm text-slate-500">Configure webhook endpoints for real-time events</p>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={()=>setShowCreateWebhook(true)}>
                    + Add Webhook
                </button>
            </div>

            <Modal isOpen={showCreateWebhook} onClose={()=>setShowCreateWebhook(false)} title="Create Webhook">
              <div className="p-6 space-y-3">
                <div>
                  <label className="label">URL</label>
                  <input className="input-field" value={newHook.url} onChange={e=>setNewHook({...newHook, url: e.target.value})} placeholder="https://example.com/webhook" />
                </div>
                <div>
                  <label className="label">Events (comma-separated)</label>
                  <input className="input-field" value={newHook.events} onChange={e=>setNewHook({...newHook, events: e.target.value})} placeholder="payment.success,student.created" />
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn btn-secondary" onClick={()=>setShowCreateWebhook(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={async ()=>{
                    try {
                      const headers = await authHeaders();
                      const events = newHook.events.split(',').map(e=>e.trim()).filter(Boolean);
                      const res = await fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ url: newHook.url, events }) });
                      if (!res.ok) throw new Error(await res.text());
                      setShowCreateWebhook(false);
                      setNewHook({ url: '', events: '' });
                      await loadWebhooks();
                    } catch { alert('Failed to create webhook'); }
                  }}>Create</button>
                </div>
              </div>
            </Modal>

            <div className="space-y-4">
                {webhooks.map((webhook: any) => (
                    <div key={webhook.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <code className="text-sm bg-slate-100 px-3 py-1 rounded font-mono">
                                        {webhook.url}
                                    </code>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        webhook.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {webhook.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(webhook.events || []).map((event: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                            {event}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-sm text-slate-600">
                                    Last triggered: {webhook.last_triggered ? new Date(webhook.last_triggered).toLocaleString() : '-'}
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-4 border-t border-slate-200">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium" onClick={async ()=>{
                                try { const headers = await authHeaders(); await fetch(`/api/webhooks/${webhook.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ status: webhook.status==='active'?'inactive':'active' }) }); await loadWebhooks(); } catch { alert('Update failed'); }
                            }}>
                                {webhook.status==='active'?'Disable':'Enable'}
                            </button>
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium" onClick={async ()=>{
                                try { const headers = await authHeaders(); const r = await fetch(`/api/webhooks/${webhook.id}/test`, { method: 'POST', headers }); if (!r.ok) throw new Error(); alert('Test sent'); await loadWebhooks(); } catch { alert('Test failed'); }
                            }}>
                                Test
                            </button>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium" onClick={async ()=>{
                                if (!confirm('Delete webhook?')) return; try { const headers = await authHeaders(); await fetch(`/api/webhooks/${webhook.id}`, { method: 'DELETE', headers }); await loadWebhooks(); } catch { alert('Delete failed'); }
                            }}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {webhooks.length===0 && <div className="text-sm text-slate-500">No webhooks configured.</div>}
            </div>
        </div>
    );

    const DocumentationPanel = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">API Documentation</h3>
                <p className="text-sm text-slate-500">Learn how to integrate with our API</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Quick Start</h4>
                <div className="space-y-4">
                    <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">Authentication</h5>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <div>curl -X GET https://api.yourschool.com/v1/students \</div>
                            <div className="ml-4">-H "Authorization: Bearer YOUR_API_KEY"</div>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">Get Students</h5>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                            <div>GET /v1/students</div>
                            <div className="text-green-400 mt-2">// Response</div>
                            <div>{'{'}</div>
                            <div className="ml-4">"data": [</div>
                            <div className="ml-8">{'{'}</div>
                            <div className="ml-12">"id": "123",</div>
                            <div className="ml-12">"name": "John Doe",</div>
                            <div className="ml-12">"class": "Grade 10"</div>
                            <div className="ml-8">{'}'}</div>
                            <div className="ml-4">]</div>
                            <div>{'}'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Endpoints</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GET</span>
                            <code className="text-slate-700">/v1/students</code>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">POST</span>
                            <code className="text-slate-700">/v1/students</code>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GET</span>
                            <code className="text-slate-700">/v1/payments</code>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GET</span>
                            <code className="text-slate-700">/v1/attendance</code>
                        </div>
                    </div>
                    <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Full Documentation →
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Rate Limits</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Development:</span>
                            <span className="font-medium">100 requests/hour</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Production:</span>
                            <span className="font-medium">1000 requests/hour</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Enterprise:</span>
                            <span className="font-medium">10,000 requests/hour</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const LogsPanel = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">API Request Logs</h3>
                <p className="text-sm text-slate-500">Monitor API usage and debug issues</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-slate-900">12,459</div>
                    <div className="text-sm text-slate-500">Total Requests</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">12,234</div>
                    <div className="text-sm text-slate-500">Successful (98%)</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">225</div>
                    <div className="text-sm text-slate-500">Failed (2%)</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-slate-900">145ms</div>
                    <div className="text-sm text-slate-500">Avg Response</div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Timestamp</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Method</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Endpoint</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Duration</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">API Key</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { time: '14:35:22', method: 'GET', endpoint: '/v1/students', status: 200, duration: '142ms', key: 'Mobile App' },
                            { time: '14:35:18', method: 'POST', endpoint: '/v1/payments', status: 201, duration: '256ms', key: 'Payment Gateway' },
                            { time: '14:35:10', method: 'GET', endpoint: '/v1/attendance', status: 200, duration: '98ms', key: 'Mobile App' },
                            { time: '14:34:55', method: 'GET', endpoint: '/v1/students', status: 401, duration: '12ms', key: 'Unknown' }
                        ].map((log, idx) => (
                            <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-600">{log.time}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 text-xs rounded ${
                                        log.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {log.method}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm font-mono text-slate-700">{log.endpoint}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 text-xs rounded ${
                                        log.status === 200 || log.status === 201
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">{log.duration}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{log.key}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">API Manager</h1>
                <p className="text-indigo-100">Manage API keys, webhooks, and integrations</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex space-x-4 border-b border-slate-200 mb-6">
                    {[
                        { id: 'keys', label: 'API Keys', icon: '🔑' },
                        { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
                        { id: 'docs', label: 'Documentation', icon: '📚' },
                        { id: 'logs', label: 'Request Logs', icon: '📊' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 py-2 px-4 font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'keys' && <APIKeysPanel />}
                {activeTab === 'webhooks' && <WebhooksPanel />}
                {activeTab === 'docs' && <DocumentationPanel />}
                {activeTab === 'logs' && <LogsPanel />}
            </div>
        </div>
    );
};

export default APIManager;