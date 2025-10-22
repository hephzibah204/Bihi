import React, { useEffect, useMemo, useState } from 'react';
import { apiGetScores, apiGetSubjects, apiGetSchoolSettings } from '../services/api';
import Tooltip from './Tooltip';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardView } from '../types';

type SubjectAvg = { subjectId: string; name: string; average: number; sampleCount: number };

const toneClass = (pct: number) => {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

const labelFor = (pct: number) => {
  if (pct >= 75) return 'Hot';
  if (pct >= 60) return 'Neutral';
  return 'Cold';
};

const SubjectHotColdChart: React.FC<{ onDrillDown?: (view: DashboardView) => void }> = ({ onDrillDown }) => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [subjectsAvg, setSubjectsAvg] = useState<SubjectAvg[]>([]);
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [topN, setTopN] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, subjects, scores] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetSubjects(),
          apiGetScores(),
        ]);

        const currentTerm = (settings as any)?.currentTerm || settings?.term || 'Current Term';
        const currentSession = (settings as any)?.currentSession || settings?.session || '';
        setLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        const maxCa1 = settings?.maxCa1 ?? 0;
        const maxCa2 = settings?.maxCa2 ?? 0;
        const maxExam = settings?.maxExam ?? 0;
        const maxTotal = (maxCa1 + maxCa2 + maxExam) || 100;

        const subjectsById = new Map<string, string>();
        (subjects || []).forEach(s => subjectsById.set(s.id, (s as any).name || s.title || s.id));

        let filtered = (scores || []);
        if (scope === 'current') {
          filtered = filtered.filter(s => (
            (!s.term || !currentTerm ? true : s.term === currentTerm) &&
            (!s.session || !currentSession ? true : s.session === currentSession)
          ));
        }

        const agg = new Map<string, { sum: number; count: number }>();
        filtered.forEach(s => {
          const total = (s?.ca1 || 0) + (s?.ca2 || 0) + (s?.exam || 0);
          const pct = 100 * (total / maxTotal);
          const bucket = agg.get(s.subjectId) || { sum: 0, count: 0 };
          agg.set(s.subjectId, { sum: bucket.sum + pct, count: bucket.count + 1 });
        });

        const list: SubjectAvg[] = Array.from(agg.entries()).map(([id, a]) => ({
          subjectId: id,
          name: subjectsById.get(id) || id,
          average: +(a.sum / (a.count || 1)).toFixed(1),
          sampleCount: a.count,
        }));

        // Sort descending by average
        list.sort((a, b) => b.average - a.average);
        setSubjectsAvg(list);
      } catch (e) {
        console.error('Failed to load subject hot/cold chart', e);
        setSubjectsAvg([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [scope]);

  const viewList = useMemo(() => {
    const filtered = search
      ? subjectsAvg.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
      : subjectsAvg;
    return filtered.slice(0, topN);
  }, [subjectsAvg, search, topN]);

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Subject Hot & Cold Spots</h3>
          {label && <span className="text-sm text-gray-500">{label}</span>}
        </div>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Scope</label>
            <select value={scope} onChange={e => setScope(e.target.value as 'current'|'all')} className="input-field py-1 h-8">
              <option value="current">Current term</option>
              <option value="all">All terms</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Top</label>
            <select value={topN} onChange={e => setTopN(Number(e.target.value))} className="input-field py-1 h-8 w-24">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="flex-1">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by subject" className="input-field h-8" />
          </div>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">Loading chart...</p>
        ) : subjectsAvg.length === 0 ? (
          <p className="mt-4 text-gray-500">No subject averages available for the current term.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {viewList.map(item => (
              <li
                key={item.subjectId}
                className="flex items-center gap-4 cursor-pointer hover:opacity-90"
                onClick={() => {
                  try {
                    localStorage.setItem('results_preselect_subject_id', item.subjectId);
                  } catch {}
                  if (onDrillDown) onDrillDown(ADMIN_VIEWS.RESULTS as DashboardView);
                }}
              >
                <Tooltip text={`Avg: ${item.average}% • Samples: ${item.sampleCount}`}>
                  <div className="w-40 text-sm text-gray-700 truncate">{item.name}</div>
                </Tooltip>
                <div className="flex-1 h-3 bg-gray-100 rounded">
                  <div className={`h-3 rounded ${toneClass(item.average)}`} style={{ width: `${Math.max(0, Math.min(100, item.average))}%` }} />
                </div>
                <div className="w-20 text-right text-sm text-gray-700">{item.average}%</div>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${item.average >= 75 ? 'bg-green-100 text-green-700' : item.average >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{labelFor(item.average)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SubjectHotColdChart;