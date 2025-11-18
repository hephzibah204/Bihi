import React, { useEffect, useMemo, useState } from 'react';
import { apiGetSubjects, apiGetScores } from '../services/api';
import LeaderboardCard from './ui/LeaderboardCard';

const LeaderboardSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  useEffect(() => { (async () => { const [subj, sc] = await Promise.all([apiGetSubjects(), apiGetScores()]); setSubjects(subj||[]); setScores(sc||[]); })(); }, []);
  const rows = useMemo(() => {
    const bySubject: Record<string, { total: number; count: number }> = {};
    for (const s of scores) {
      const subId = String(s.subjectId||''); if (!subId) continue;
      const tot = (Number(s.ca1)||0)+(Number(s.ca2)||0)+(Number(s.exam)||0);
      if (!bySubject[subId]) bySubject[subId] = { total:0, count:0 };
      bySubject[subId].total += tot; bySubject[subId].count += 1;
    }
    const list = Object.entries(bySubject).map(([sid,v]) => {
      const avg = v.count ? Math.round(v.total/v.count) : 0;
      const subj = subjects.find(x=>String(x.id)===sid) || {};
      const name = subj.name || subj.title || sid;
      return { label: name, value: `${avg}%` };
    }).sort((a,b)=>parseInt(String(b.value)) - parseInt(String(a.value))).slice(0,20);
    return list;
  }, [subjects, scores]);
  return <LeaderboardCard title="Top Performing Subjects" rows={rows} />;
};

export default LeaderboardSubjects;