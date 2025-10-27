import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

const SecurityCenter = () => {
    const [findings, setFindings] = useState<any[]>([]);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authHeaders = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    };

    const loadFindings = async () => {
        try {
            setError(null);
            const headers = await authHeaders();
            const res = await fetch('/api/security-scan', { headers });
            if (!res.ok) throw new Error(await res.text());
            setFindings(await res.json());
        } catch (e: any) {
            setError(e?.message || 'Failed to fetch findings');
        }
    };

    useEffect(() => { void loadFindings(); }, []);

    useEffect(() => {
        const handler = () => { void runScan(); };
        window.addEventListener('run-security-scan', handler as any);
        return () => window.removeEventListener('run-security-scan', handler as any);
    }, []);

    const runScan = async () => {
        setScanning(true); setError(null);
        try {
            const headers = await authHeaders();
            const clientEnv = { hasServiceRoleKey: false };
            const res = await fetch('/api/security-scan', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ clientEnv })});
            if (!res.ok) throw new Error(await res.text());
            await loadFindings();
        } catch (e: any) {
            setError(e?.message || 'Scan failed');
        } finally { setScanning(false); }
    };

    const badge = (sev: string) => {
        const cls = sev === 'HIGH' ? 'bg-red-100 text-red-800' : sev === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
        return <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{sev}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Security Center</h1>
                <p className="text-red-100">Scan configuration and record findings</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-900">Run Security Scan</h3>
                        <p className="text-sm text-slate-500">Checks environment configuration and common misconfigurations.</p>
                    </div>
                    <button onClick={runScan} disabled={scanning} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                        {scanning ? 'Scanning...' : 'Run Scan'}
                    </button>
                </div>
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Recent Findings</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                    {findings.map((f:any)=> (
                        <div key={f.id} className="p-3 border rounded flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">{f.message}</div>
                                <div className="text-xs text-slate-500">{new Date(f.created_at).toLocaleString()} • {f.category}</div>
                            </div>
                            {badge(f.severity)}
                        </div>
                    ))}
                    {findings.length === 0 && <div className="text-sm text-slate-500">No findings yet.</div>}
                </div>
            </div>
        </div>
    );
};

export default SecurityCenter;
