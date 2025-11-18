import React, { useEffect, useState } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import BookOpenIcon from './icons/BookOpenIcon';

const OERAdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  const loadPending = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/oer/pending');
      const data = await res.json();
      setItems(data?.items || []);
    } catch (e: any) {
      setMessage(e?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPending(); }, []);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const publishSelected = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (!ids.length) return;
    setLoading(true); setMessage('');
    try {
      const r = await fetch('/api/oer/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      if (!r.ok) throw new Error('Publish failed');
      setSelected({});
      await loadPending();
    } catch (e: any) { setMessage(e?.message || 'Failed'); } finally { setLoading(false); }
  };

  const scheduleIndexing = async () => {
    setLoading(true); setMessage('');
    try {
      const r = await fetch('/api/oer/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sources: ['OpenStax','LibreTexts'] }) });
      if (!r.ok) throw new Error('Schedule failed');
      setMessage('Scheduled indexing');
    } catch (e: any) { setMessage(e?.message || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="card mb-4">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="font-semibold">OER Indexing & Review</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={scheduleIndexing} className="btn btn-secondary">Schedule Indexing</button>
            <button onClick={publishSelected} className="btn btn-primary">Publish Selected</button>
          </div>
        </div>
      </div>
      {loading && (
        <div className="card p-6 text-center"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
      )}
      {message && (<div className="card p-3 text-sm text-gray-600">{message}</div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(it => (
          <div key={it.id} className="card">
            <div className="p-4">
              <h4 className="font-semibold">{it.title}</h4>
              {it.author && <p className="text-sm text-gray-600">{it.author}</p>}
              {it.subject && <p className="text-xs text-gray-500">{it.subject}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {(it.tags || []).map((t: string) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">{t}</span>
                ))}
              </div>
            </div>
            <div className="border-t p-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!selected[it.id]} onChange={() => toggle(it.id)} /> Select</label>
              {it.url && <a href={it.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Open</a>}
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className="card p-6 text-center text-gray-500">No pending items</div>
        )}
      </div>
    </div>
  );
};

export default OERAdminPanel;

