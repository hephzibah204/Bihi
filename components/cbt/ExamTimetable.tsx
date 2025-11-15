import { useEffect, useState } from 'react';

type Entry = { id: string; title: string; start?: string; end?: string; classes?: string[] };
type Avail = { id: string; title: string; start?: string; end?: string; classes?: string[] };

const ExamTimetable = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [available, setAvailable] = useState<Avail[]>([]);
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const isDemo = typeof window !== 'undefined' && ((sessionStorage.getItem('isDemoMode') === 'true') || (localStorage.getItem('isDemoMode') === 'true'));
      if (isDemo) {
        const { CORE_DEMO_DATA } = require('../../utils/demoData');
        const all = (CORE_DEMO_DATA?.cbt_exams || []) as any[];
        const limitDays = Math.max(1, parseInt(days || '30', 10));
        const now = Date.now();
        const until = now + limitDays * 24 * 60 * 60 * 1000;
        const entriesDemo: Entry[] = all
          .filter(e => e.status === 'ready')
          .filter(e => {
            const s = new Date(e.timeWindowStart || e.timeWindowStart || Date.now()).getTime();
            return s <= until;
          })
          .map(e => ({ id: e.id, title: e.title, start: e.timeWindowStart, end: e.timeWindowEnd, classes: [e?.rules?.scoreEntry?.className].filter(Boolean) }));
        const availDemo: Avail[] = all
          .filter(e => e.status === 'ready')
          .filter(e => {
            const s = new Date(e.timeWindowStart || Date.now()).getTime();
            const en = new Date(e.timeWindowEnd || Date.now()).getTime();
            return s <= now && now <= en;
          })
          .map(e => ({ id: e.id, title: e.title, start: e.timeWindowStart, end: e.timeWindowEnd, classes: [e?.rules?.scoreEntry?.className].filter(Boolean) }));
        setEntries(entriesDemo);
        setAvailable(availDemo);
      } else {
        const r = await fetch(`/api/cbt/timetable?days=${encodeURIComponent(days)}`);
        const d = await r.json();
        setEntries(Array.isArray(d?.entries) ? d.entries : []);
        try {
          const ra = await fetch(`/api/cbt/exams/available`);
          const da = await ra.json();
          const av: Avail[] = Array.isArray(da) ? da.map((e: any) => ({ id: e.id, title: e.title, start: e.time_window_start || e.timeWindowStart, end: e.time_window_end || e.timeWindowEnd, classes: e?.rules?.targetClasses || [e?.rules?.scoreEntry?.className].filter(Boolean) })) : [];
          setAvailable(av);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Exam Timetable</h1>
      <div className="flex items-center gap-3 mb-4">
        <input className="input w-24" value={days} onChange={e=>setDays(e.target.value)} />
        <button className="btn btn-primary" onClick={load}>Refresh</button>
      </div>
      {loading ? (<div>Loading...</div>) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="p-3">Title</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Classes</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t">
                  <td className="p-3">{e.title}</td>
                  <td className="p-3">{e.start || ''}</td>
                  <td className="p-3">{e.end || ''}</td>
                  <td className="p-3">{(e.classes||[]).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Available Exams</h2>
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="p-3">Title</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Classes</th>
              </tr>
            </thead>
            <tbody>
              {available.map(e => (
                <tr key={e.id} className="border-t">
                  <td className="p-3">{e.title}</td>
                  <td className="p-3">{e.start || ''}</td>
                  <td className="p-3">{e.end || ''}</td>
                  <td className="p-3">{(e.classes||[]).join(', ')}</td>
                </tr>
              ))}
              {available.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={4}>No exams currently available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamTimetable;
