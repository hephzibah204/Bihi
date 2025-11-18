import React, { useEffect, useState } from 'react';
import { listToolCache, clearToolCache } from '../../services/toolCacheService';
export const ToolCacheAdmin: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const data = await listToolCache(100); setRows(data || []); } catch { setRows([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const clearAll = async () => { await clearToolCache(); await load(); };
  const clearName = async (name: string) => { await clearToolCache(name); await load(); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Tool Cache</div>
        <button onClick={load} className="px-3 py-2 rounded bg-slate-100 border">Refresh</button>
      </div>
      <div className="flex gap-2">
        <button onClick={clearAll} className="px-3 py-2 rounded bg-red-600 text-white">Clear All</button>
      </div>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Args</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-2" colSpan={4}>Loading...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td className="p-2" colSpan={4}>No entries</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-mono">{r.name}</td>
                <td className="p-2 font-mono">{r.args_json?.slice(0, 160)}</td>
                <td className="p-2">{String(r.created_at).slice(0,19).replace('T',' ')}</td>
                <td className="p-2">
                  <button onClick={() => clearName(r.name)} className="px-2 py-1 rounded bg-slate-100 border">Clear</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
