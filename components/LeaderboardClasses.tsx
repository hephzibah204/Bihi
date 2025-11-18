import React, { useEffect, useMemo, useState } from 'react';
import { apiGetStudents, apiGetScores } from '../services/api';
import LeaderboardCard from './ui/LeaderboardCard';

const LeaderboardClasses: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  useEffect(() => { (async () => { const [s, sc] = await Promise.all([apiGetStudents(), apiGetScores()]); setStudents(s||[]); setScores(sc||[]); })(); }, []);
  const rows = useMemo(() => {
    const byStudent: Record<string, { total: number; count: number }> = {};
    for (const s of scores) {
      const sid = String(s.studentId||''); if (!sid) continue;
      const tot = (Number(s.ca1)||0)+(Number(s.ca2)||0)+(Number(s.exam)||0);
      if (!byStudent[sid]) byStudent[sid] = { total:0, count:0 };
      byStudent[sid].total += tot; byStudent[sid].count += 1;
    }
    const byClass: Record<string, { sumAvg: number; count: number }> = {};
    for (const st of students) {
      const sid = String(st.id||''); const cls = st.class || 'Unknown';
      const v = byStudent[sid]; const avg = v && v.count ? v.total/v.count : 0;
      if (!byClass[cls]) byClass[cls] = { sumAvg:0, count:0 };
      byClass[cls].sumAvg += avg; byClass[cls].count += 1;
    }
    const list = Object.entries(byClass).map(([cls,v]) => ({ label: cls, value: `${Math.round(v.count ? v.sumAvg/v.count : 0)}%` }))
      .sort((a,b)=>parseInt(String(b.value)) - parseInt(String(a.value))).slice(0,20);
    return list;
  }, [students, scores]);
  return <LeaderboardCard title="Top Performing Classes" rows={rows} />;
};

export default LeaderboardClasses;