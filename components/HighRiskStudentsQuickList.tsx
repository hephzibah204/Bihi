import React, { useEffect, useMemo, useState } from 'react';
import { apiGetScores, apiGetStudents } from '../services/api';
import Card from './ui/Card';

const PASS_THRESHOLD = 50; // configurable

const HighRiskStudentsQuickList: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, sc] = await Promise.all([apiGetStudents(), apiGetScores()]);
        setStudents(s || []);
        setScores(sc || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rows = useMemo(() => {
    const byStudent: Record<string, { total: number; count: number }> = {};
    for (const s of scores) {
      const sid = String(s.studentId || '');
      if (!sid) continue;
      const tot = (Number(s.ca1) || 0) + (Number(s.ca2) || 0) + (Number(s.exam) || 0);
      if (!byStudent[sid]) byStudent[sid] = { total: 0, count: 0 };
      byStudent[sid].total += tot;
      byStudent[sid].count += 1;
    }
    const list = Object.entries(byStudent).map(([sid, v]) => {
      const avg = v.count ? v.total / v.count : 0;
      const st = students.find(x => String(x.id) === sid) || {};
      const reason = avg < PASS_THRESHOLD ? 'Low average' : '';
      return { id: sid, name: st.name || st.fullName || sid, className: st.class || '', average: Math.round(avg), reason };
    }).filter(r => r.average < PASS_THRESHOLD);
    return list.sort((a, b) => a.average - b.average).slice(0, 8);
  }, [students, scores]);

  return (
    <Card header={<div className="flex items-center justify-between"><div className="text-base font-semibold">High-Risk Students</div><button className="toggle-pill" onClick={() => { const url = new URL(window.location.toString()); url.searchParams.set('view', 'leaderboard-students'); window.history.pushState({}, '', url.toString()); }}>View full</button></div>}>
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">None detected</div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
              <div>
                <div className="text-sm font-medium text-[#0F172A]">{r.name}</div>
                <div className="text-xs text-gray-500">{r.className}</div>
              </div>
              <div className="text-xs text-gray-500">{r.reason}</div>
              <div className="text-sm font-semibold">{r.average}%</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default HighRiskStudentsQuickList;
