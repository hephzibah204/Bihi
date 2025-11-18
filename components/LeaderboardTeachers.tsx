import React, { useEffect, useMemo, useState } from 'react';
import { apiGetTeachers, apiGetScores, apiGetSubjects } from '../services/api';
import LeaderboardCard from './ui/LeaderboardCard';

const LeaderboardTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  useEffect(() => { (async () => { const [t, sc, subj] = await Promise.all([apiGetTeachers(), apiGetScores(), apiGetSubjects()]); setTeachers(t||[]); setScores(sc||[]); setSubjects(subj||[]); })(); }, []);
  const rows = useMemo(() => {
    const bySubject: Record<string, { total: number; count: number }> = {};
    for (const s of scores) {
      const subId = String(s.subjectId||''); if (!subId) continue;
      const tot = (Number(s.ca1)||0)+(Number(s.ca2)||0)+(Number(s.exam)||0);
      if (!bySubject[subId]) bySubject[subId] = { total:0, count:0 };
      bySubject[subId].total += tot; bySubject[subId].count += 1;
    }
    const computeSubjectAvg = (sid: string) => {
      const v = bySubject[sid]; return v && v.count ? v.total/v.count : 0;
    };
    const list = teachers.map(t => {
      const subs = Array.isArray(t.subjects) ? t.subjects : [];
      const avgs = subs.map((sid:string) => computeSubjectAvg(String(sid))).filter(n => n>0);
      const avg = avgs.length ? Math.round(avgs.reduce((a,b)=>a+b,0)/avgs.length) : 0;
      const sublabel = subs.slice(0,2).map((sid:string)=>{
        const subj = subjects.find((x:any)=>String(x.id)===String(sid))||{}; return subj.name||subj.title||sid;
      }).join(', ');
      return { label: t.name || t.fullName || t.email || 'Teacher', sublabel, value: `${avg}%` };
    }).sort((a,b)=>parseInt(String(b.value))-parseInt(String(a.value))).slice(0,20);
    return list;
  }, [teachers, scores, subjects]);
  return <LeaderboardCard title="Best Performing Teachers" rows={rows} />;
};

export default LeaderboardTeachers;