import React, { useEffect, useRef, useState } from 'react';
import { apiGetPayments, apiGetScores } from '../services/api';

type Range = 'week' | 'month' | 'year' | 'all';

const SchoolOverviewChart: React.FC = () => {
  const [range, setRange] = useState<Range>('week');
  const [labels, setLabels] = useState<string[]>([]);
  const [seriesA, setSeriesA] = useState<number[]>([]);
  const [seriesB, setSeriesB] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      const [payments, scores] = await Promise.all([apiGetPayments(), apiGetScores()]);
      const now = new Date();
      if (range === 'week') {
        const buckets = Array.from({ length: 8 }).map((_,i)=>{
          const d = new Date(now); d.setDate(d.getDate() - (7 - i)); return d;
        });
        setLabels(buckets.map(d=>d.toLocaleDateString(undefined,{ month:'short', day:'2-digit' })));
        const fees = buckets.map((d,i)=>{
          const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1).getTime();
          return (payments||[]).filter(p=>{ const ts=new Date(p.paymentDate).getTime(); return ts>=start && ts<end; }).reduce((s,p)=>s+(Number(p.amount)||0),0);
        });
        const pass = buckets.map((d)=>{ return (scores||[]).reduce((s:any,sc:any)=>{const tot=(Number(sc.ca1)||0)+(Number(sc.ca2)||0)+(Number(sc.exam)||0); return s+(tot>=50?1:0);},0); });
        setSeriesA(fees); setSeriesB(pass);
      } else if (range === 'month') {
        const buckets = Array.from({ length: 12 }).map((_,i)=>{ const d=new Date(now.getFullYear(), now.getMonth()-11+i, 1); return d; });
        setLabels(buckets.map(d=>d.toLocaleString(undefined,{ month:'short' })));
        const fees = buckets.map(d=>{ const start=new Date(d.getFullYear(),d.getMonth(),1).getTime(); const end=new Date(d.getFullYear(),d.getMonth()+1,1).getTime(); return (payments||[]).filter(p=>{ const ts=new Date(p.paymentDate).getTime(); return ts>=start && ts<end; }).reduce((s,p)=>s+(Number(p.amount)||0),0); });
        const passRate = (()=>{ const byTerm: number[] = buckets.map(()=>0); return byTerm; })();
        setSeriesA(fees); setSeriesB(passRate);
      } else if (range === 'year') {
        // Use sessions if available for pass rate; fees aggregated yearly
        const sessions = Array.from(new Set<string>((scores||[]).map((sc:any)=>String(sc.session||'').trim()).filter(Boolean))).slice(-6) as string[];
        if (sessions.length) {
          setLabels(sessions as string[]);
          const passRates = sessions.map(sess => {
            const scoped = (scores||[]).filter((sc:any)=>String(sc.session||'').trim()===sess);
            const total = scoped.length;
            const pass = scoped.reduce((cnt:number, sc:any)=>{ const tot=(Number(sc.ca1)||0)+(Number(sc.ca2)||0)+(Number(sc.exam)||0); return cnt + (tot>=50?1:0); },0);
            return total>0 ? Math.round((pass/total)*100) : 0;
          });
          setSeriesB(passRates);
          // Fees by year aligned to the same sessions range if possible; otherwise aggregate overall
          const feesByYear = Array.from({ length: sessions.length }).map((_,i)=>{
            const y = now.getFullYear()- (sessions.length-1-i);
            const start=new Date(y,0,1).getTime(); const end=new Date(y+1,0,1).getTime();
            return (payments||[]).filter(p=>{ const ts=new Date(p.paymentDate).getTime(); return ts>=start && ts<end; }).reduce((s,p)=>s+(Number(p.amount)||0),0);
          });
          setSeriesA(feesByYear);
        } else {
          const buckets = Array.from({ length: 3 }).map((_,i)=> new Date(now.getFullYear()-2+i, 0,1));
          setLabels(buckets.map(d=>String(d.getFullYear())));
          const fees = buckets.map(d=>{ const start=new Date(d.getFullYear(),0,1).getTime(); const end=new Date(d.getFullYear()+1,0,1).getTime(); return (payments||[]).filter(p=>{ const ts=new Date(p.paymentDate).getTime(); return ts>=start && ts<end; }).reduce((s,p)=>s+(Number(p.amount)||0),0); });
          setSeriesA(fees); setSeriesB(buckets.map(()=>0));
        }
      } else {
        const totalFees = (payments||[]).reduce((s,p)=>s+(Number(p.amount)||0),0);
        setLabels(['All']); setSeriesA([totalFees]); setSeriesB([0]);
      }
    };
    load();
  }, [range]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d'); if (!ctx) return;
    const C: any = (window as any).Chart; if (C && typeof C === 'function') {
      if (chartRef.current) chartRef.current.destroy?.();
      chartRef.current = new C(ctx, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Fees', data: seriesA, backgroundColor: 'rgba(37,99,235,0.5)', borderColor: '#2563EB' },
          { label: 'Pass Count', data: seriesB, backgroundColor: 'rgba(6,182,212,0.5)', borderColor: '#06B6D4' },
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } }
      });
    }
    return () => { if (chartRef.current) chartRef.current.destroy?.(); };
  }, [labels, seriesA, seriesB]);

  return (
    <div className="card">
      <div className="bg-[#F5F7FF] rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="text-base font-semibold">School Overview</div>
        <div className="flex items-center gap-2">
          <button className="toggle-pill" onClick={()=>setRange('week')}>Week</button>
          <button className="toggle-pill" onClick={()=>setRange('month')}>Month</button>
          <button className="toggle-pill" onClick={()=>setRange('year')}>Year</button>
          <button className="toggle-pill" onClick={()=>setRange('all')}>All</button>
        </div>
      </div>
      <div className="p-4" style={{ minHeight: 220 }}>
        <canvas ref={canvasRef} style={{ width:'100%', height:220 }} />
      </div>
    </div>
  );
};

export default SchoolOverviewChart;
