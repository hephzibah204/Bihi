import React, { useEffect, useMemo, useState } from 'react';
import { apiGetScores, apiGetStudents, apiGetSchoolSettings } from '../services/api';
import Tooltip from './Tooltip';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardView } from '../types';

type ClassAverage = { className: string; average: number; studentCount: number };

const barTone = (pct: number) => {
  if (pct >= 75) return 'bg-indigo-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

const ClassPerformanceRanking: React.FC<{ onDrillDown?: (view: DashboardView) => void }> = ({ onDrillDown }) => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [ranked, setRanked] = useState<ClassAverage[]>([]);
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [topN, setTopN] = useState<number>(10);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, students, scores] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetStudents(),
          apiGetScores(),
        ]);

        const currentTerm = (settings as any)?.currentTerm || settings?.term || 'Current Term';
        const currentSession = (settings as any)?.currentSession || settings?.session || '';
        setLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        const maxCa1 = settings?.maxCa1 ?? 0;
        const maxCa2 = settings?.maxCa2 ?? 0;
        const maxExam = settings?.maxExam ?? 0;
        const maxTotal = (maxCa1 + maxCa2 + maxExam) || 100;

        const studentClassMap = new Map<string, string>();
        (students || []).forEach(s => {
          if (s?.id) studentClassMap.set(s.id, (s as any).class || (s as any).className || '');
        });

        let filtered = (scores || []);
        if (scope === 'current') {
          filtered = filtered.filter(s => (
            (!s.term || !currentTerm ? true : s.term === currentTerm) &&
            (!s.session || !currentSession ? true : s.session === currentSession)
          ));
        }

        const perStudent = new Map<string, number[]>();
        filtered.forEach(s => {
          const total = (s?.ca1 || 0) + (s?.ca2 || 0) + (s?.exam || 0);
          const pct = 100 * (total / maxTotal);
          const arr = perStudent.get(s.studentId) || [];
          arr.push(pct);
          perStudent.set(s.studentId, arr);
        });

        const classAgg = new Map<string, { sum: number; count: number }>();
        perStudent.forEach((arr, studentId) => {
          const avg = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
          const cls = studentClassMap.get(studentId) || 'Unknown';
          const bucket = classAgg.get(cls) || { sum: 0, count: 0 };
          classAgg.set(cls, { sum: bucket.sum + avg, count: bucket.count + 1 });
        });

        const rankedList: ClassAverage[] = Array.from(classAgg.entries())
          .map(([cls, agg]) => ({ className: cls, average: +(agg.sum / (agg.count || 1)).toFixed(1), studentCount: agg.count }))
          .filter(r => r.studentCount > 0);

        rankedList.sort((a, b) => b.average - a.average);
        setRanked(rankedList);
      } catch (e) {
        console.error('Failed to load class performance ranking', e);
        setRanked([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [scope]);

  const viewList = useMemo(() => {
    const filtered = search
      ? ranked.filter(r => r.className.toLowerCase().includes(search.toLowerCase()))
      : ranked;
    return filtered.slice(0, topN);
  }, [ranked, search, topN]);

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Class Performance Ranking</h3>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by class name" className="input-field h-8" />
          </div>
        </div>
        {loading ? (
          <p className="mt-4 text-gray-500">Loading chart...</p>
        ) : ranked.length === 0 ? (
          <p className="mt-4 text-gray-500">No data available for the current term.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {viewList.map((item, idx) => (
              <li
                key={item.className}
                className="flex items-center gap-4 cursor-pointer hover:opacity-90"
                onClick={() => {
                  try {
                    localStorage.setItem('results_preselect_class', item.className);
                  } catch { /* noop */ }
                  if (onDrillDown) onDrillDown(ADMIN_VIEWS.RESULTS as DashboardView);
                }}
              >
                <Tooltip text={`Avg: ${item.average}% • Students: ${item.studentCount}`}>
                  <div className="w-28 text-sm text-gray-700 truncate">{idx + 1}. {item.className}</div>
                </Tooltip>
                <div className="flex-1 h-3 bg-gray-100 rounded">
                  <div className={`h-3 rounded ${barTone(item.average)}`} style={{ width: `${Math.max(0, Math.min(100, item.average))}%` }} />
                </div>
                <div className="w-20 text-right text-sm text-gray-700">{item.average}%</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClassPerformanceRanking;