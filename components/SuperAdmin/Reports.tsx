import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

const Reports: React.FC = () => {
  const { can, loaded } = usePlatformPermission();
  const canViewReports = can('view_reports');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const load = async (r = range) => {
    try {
      setError(null); setLoading(true);
      const headers = await authHeaders();
      const res = await fetch(`/api/reports?range=${r}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: any) {
      const msg = e?.message || 'Failed to load reports';
      setError(msg);
      window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: msg } }));
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); /* initial */ }, []);

  const seriesCsv = useMemo(() => {
    const s = data?.comms?.range?.series || [];
    const header = 'date,sms,email,total';
    const rows = s.map((r: any) => `${r.date},${r.sms},${r.email},${r.total}`);
    return [header, ...rows].join('\n');
  }, [data]);

  const downloadCsv = () => {
    const blob = new Blob([seriesCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `comms_${range}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loaded && !canViewReports) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-1">Access restricted</h3>
        <p className="text-sm text-red-700">You do not have permission to view reports (view_reports).</p>
      </div>
    );
  }

  if (loading) return <div className="p-4">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Platform Reports</h1>
            <p className="text-indigo-100">Overview of tenants, users, and communications</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={range}
              onChange={(e) => { const r = Number(e.target.value) as 7 | 30 | 90; setRange(r); void load(r); }}
              className="px-3 py-2 rounded bg-white text-slate-700"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={() => void load()} className="px-4 py-2 bg-white text-slate-700 rounded hover:bg-slate-100">Refresh</button>
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border p-6 rounded-xl">
              <div className="text-sm text-slate-500">Total Tenants</div>
              <div className="text-3xl font-bold">{data.tenants}</div>
            </div>
            <div className="bg-white border p-6 rounded-xl">
              <div className="text-sm text-slate-500">Total Teachers</div>
              <div className="text-3xl font-bold">{data.teachers}</div>
            </div>
            <div className="bg-white border p-6 rounded-xl">
              <div className="text-sm text-slate-500">Comms (Last 7d)</div>
              <div className="text-3xl font-bold">{data.comms?.last7?.total ?? 0}</div>
            </div>
            <div className="bg-white border p-6 rounded-xl">
              <div className="text-sm text-slate-500">Comms (Last 30d)</div>
              <div className="text-3xl font-bold">{data.comms?.last30?.total ?? 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border p-6 rounded-xl lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Communications (Last {data.comms?.range?.days} days)</h3>
                <div className="space-x-2 text-sm text-slate-600">
                  <span>SMS: <strong>{data.comms?.range?.sms ?? 0}</strong></span>
                  <span className="ml-4">Email: <strong>{data.comms?.range?.email ?? 0}</strong></span>
                  <span className="ml-4">Total: <strong>{data.comms?.range?.total ?? 0}</strong></span>
                  <button onClick={downloadCsv} className="ml-4 px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Export CSV</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">SMS</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.comms?.range?.series || []).map((row: any) => (
                      <tr key={row.date} className="border-b last:border-0">
                        <td className="py-2 pr-4">{row.date}</td>
                        <td className="py-2 pr-4">{row.sms}</td>
                        <td className="py-2 pr-4">{row.email}</td>
                        <td className="py-2 pr-4 font-medium">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border p-6 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Top Tenants (by comms)</h3>
              <div className="space-y-2">
                {(data.comms?.range?.topTenants || []).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                    <div className="truncate mr-3">
                      <div className="font-medium text-slate-900 truncate max-w-[180px]">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.id}</div>
                    </div>
                    <div className="text-sm font-semibold">{t.total}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
