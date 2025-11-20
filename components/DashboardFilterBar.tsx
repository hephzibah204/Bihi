import React, { useEffect, useState } from 'react';
import { useDashboardFilter } from '../contexts/DashboardFilterContext';
import { apiGetInvoices, apiGetScores, apiGetSchoolSettings } from '../services/api';

const DashboardFilterBar: React.FC = () => {
  const { session, term, setSession, setTerm } = useDashboardFilter();
  const [sessions, setSessions] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => { (async () => {
    const [settings, inv, sc] = await Promise.all([apiGetSchoolSettings(), apiGetInvoices(), apiGetScores()]);
    const sSet = new Set<string>();
    const tSet = new Set<string>();
    (inv || []).forEach((i:any)=>{ if (i.session) sSet.add(String(i.session)); if (i.term) tSet.add(String(i.term)); });
    (sc || []).forEach((r:any)=>{ if (r.session) sSet.add(String(r.session)); if (r.term) tSet.add(String(r.term)); });
    if (settings?.session) sSet.add(String(settings.session));
    if (settings?.term) tSet.add(String(settings.term));
    setSessions(Array.from(sSet));
    setTerms(Array.from(tSet));
    if (!session && settings?.session) setSession(String(settings.session));
    if (!term && settings?.term) setTerm(String(settings.term));
  })(); }, []);

  return (
    <div className="card-soft p-4 mt-6">
      <div className="flex items-center gap-3">
        <div>
          <div className="text-xs text-gray-500">Session</div>
          <select value={session} onChange={e=>setSession(e.target.value)} className="input-field h-8 text-xs min-w-[160px]">
            <option value="">All</option>
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs text-gray-500">Term</div>
          <select value={term} onChange={e=>setTerm(e.target.value)} className="input-field h-8 text-xs min-w-[160px]">
            <option value="">All</option>
            {terms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilterBar;