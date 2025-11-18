import React, { useEffect, useMemo, useState } from 'react';
import { apiGetScores, apiGetStudents } from '../services/api';
import LeaderboardCard from './ui/LeaderboardCard';

const LeaderboardStudents: React.FC = () => {
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
    const list = Object.entries(byStudent).map(([sid,v]) => {
      const avg = v.count ? Math.round(v.total/v.count) : 0;
      const st = students.find(x=>String(x.id)===sid) || {};
      return { label: st.name || st.fullName || sid, sublabel: st.class || '', value: `${avg}%` };
    }).sort((a,b)=>parseInt(String(b.value)) - parseInt(String(a.value))).slice(0,20);
    return list;
  }, [students, scores]);
  return <LeaderboardCard title="Top Performing Students" rows={rows} />;
};

export default LeaderboardStudents;