import { useEffect, useState } from 'react';

type Entry = { id: string; title: string; start?: string; end?: string; classes?: string[] };

const ExamTimetable = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/cbt/timetable?days=${encodeURIComponent(days)}`);
      const d = await r.json();
      setEntries(Array.isArray(d?.entries) ? d.entries : []);
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
    </div>
  );
};

export default ExamTimetable;