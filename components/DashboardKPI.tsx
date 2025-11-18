import React, { useEffect, useMemo, useState } from 'react';
import KpiCard from './ui/KpiCard';
import { ADMIN_VIEWS } from '../utils/constants';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import WalletIcon from './icons/WalletIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import ScaleIcon from './icons/ScaleIcon';
import { apiGetStudents, apiGetTeachers, apiGetInvoices, apiGetPayments, apiGetScores, apiGetAttendance } from '../services/api';
import useAttendanceMetrics from '../hooks/useAttendanceMetrics';
import { useDashboardFilter } from '../contexts/DashboardFilterContext';

const DashboardKPI: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { session, term } = useDashboardFilter();
  const { metrics: att, loading: attLoading } = useAttendanceMetrics(session, term);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, t, inv, pay, sc, att] = await Promise.all([
          apiGetStudents(),
          apiGetTeachers(),
          apiGetInvoices(),
          apiGetPayments(),
          apiGetScores(),
          apiGetAttendance()
        ]);
        setStudents(s || []);
        setTeachers(t || []);
        setInvoices(inv || []);
        setPayments(pay || []);
        setScores(sc || []);
        setAttendance(att || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const feesCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalBillable = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
    const outstanding = invoices.reduce((sum, i) => sum + Math.max(0, (Number(i.totalAmount) || 0) - (Number(i.amountPaid) || 0)), 0);
    const recoveryRate = totalBillable > 0 ? Math.round((feesCollected / totalBillable) * 100) : 0;

    const byStudent: Record<string, { total: number; count: number }> = {};
    for (const s of scores) {
      const totalScore = (Number(s.ca1) || 0) + (Number(s.ca2) || 0) + (Number(s.exam) || 0);
      const id = String(s.studentId || '');
      if (!id) continue;
      if (!byStudent[id]) byStudent[id] = { total: 0, count: 0 };
      byStudent[id].total += totalScore;
      byStudent[id].count += 1;
    }
    const averages = Object.values(byStudent).map(v => v.count ? v.total / v.count : 0);
    const passRate = averages.length ? Math.round((averages.filter(a => a >= 50).length / averages.length) * 100) : 0;
    const highRiskCount = averages.filter(a => a < 50).length;
    const topPerformingCount = averages.filter(a => a >= 75).length;

    let present = 0; let absent = 0; let late = 0;
    for (const rec of attendance) {
      const statuses = rec?.statuses || {};
      for (const k of Object.keys(statuses)) {
        const st = String(statuses[k] || '').toLowerCase();
        if (st === 'present') present++; else if (st === 'absent') absent++; else if (st === 'late') late++;
      }
    }
    const attendanceRate = att.termRate || 0;

    const debtors = invoices.filter(i => (Number(i.totalAmount) || 0) > (Number(i.amountPaid) || 0));
    const topDebtorsCount = debtors.length;

    // New students this term
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const termStudents = students.filter(s => {
      const ts = new Date(s.enrollment_date || s.admission_date || s.created_at || s.joined_at || 0).getTime();
      return isFinite(ts);
    });
    const thisMonthNew = termStudents.filter(s => {
      const ts = new Date(s.enrollment_date || s.admission_date || s.created_at || s.joined_at || 0).getTime();
      return ts >= monthStart;
    }).length;
    const lastMonthNew = termStudents.filter(s => {
      const ts = new Date(s.enrollment_date || s.admission_date || s.created_at || s.joined_at || 0).getTime();
      return ts >= prevMonthStart && ts < prevMonthEnd;
    }).length;
    const newStudentsDelta = thisMonthNew - lastMonthNew;

    // Teacher performance count (teachers with avg >= 70 across their subjects if mappable)
    let bestTeachersCount = 0;
    try {
      const bySubject: Record<string, { total: number; count: number }> = {};
      for (const s of scores) {
        const sid = String(s.subjectId||''); if (!sid) continue;
        const tot = (Number(s.ca1)||0)+(Number(s.ca2)||0)+(Number(s.exam)||0);
        if (!bySubject[sid]) bySubject[sid] = { total:0, count:0 };
        bySubject[sid].total += tot; bySubject[sid].count += 1;
      }
      const teacherAvgs: number[] = [];
      for (const t of teachers) {
        const subs = Array.isArray(t.subjects) ? t.subjects : [];
        const avgs = subs.map((sid:string)=>{
          const v = bySubject[String(sid)]; return v && v.count ? v.total/v.count : 0;
        }).filter(n=>n>0);
        const avg = avgs.length ? (avgs.reduce((a,b)=>a+b,0)/avgs.length) : 0;
        if (avg>0) teacherAvgs.push(avg);
      }
      bestTeachersCount = teacherAvgs.filter(a=>a>=70).length;
    } catch {}

    const now2 = new Date();
    const feesBuckets = Array.from({ length: 8 }).map((_, i) => {
      const d = new Date(now2); d.setDate(d.getDate() - (7 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1).getTime();
      const total = (payments||[]).filter(p=>{ const ts=new Date(p.paymentDate).getTime(); return ts>=start && ts<end; }).reduce((s,p)=>s+(Number(p.amount)||0),0);
      return total;
    });
    const recentFees = feesBuckets.slice(-7).reduce((a,b)=>a+b,0);
    const prevFees = feesBuckets[0];
    const feesDelta = recentFees - prevFees;
    const feesDeltaText = `${feesDelta >= 0 ? '▲' : '▼'} ${Math.abs(feesDelta).toLocaleString()}`;

    return {
      totalStudents,
      totalTeachers,
      feesCollected,
      outstanding,
      recoveryRate,
      passRate,
      highRiskCount,
      topPerformingCount,
      attendanceRate,
      topDebtorsCount,
      bestTeachersCount,
      feesSpark: feesBuckets,
      feesDeltaText,
      feesDeltaDir: feesDelta >= 0 ? 'up' : 'down',
      newStudentsThisMonth: thisMonthNew,
      newStudentsDelta
    };
  }, [students, teachers, invoices, payments, scores, attendance]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <KpiCard icon={<UsersIcon className="w-5 h-5" />} label="Total Students" value={loading ? '…' : metrics.totalStudents} accentColor="#2563EB" />
      <KpiCard icon={<BriefcaseIcon className="w-5 h-5" />} label="Total Teachers" value={loading ? '…' : metrics.totalTeachers} accentColor="#F97316" />
      <KpiCard icon={<WalletIcon className="w-5 h-5" />} label="Fees Collected" value={loading ? '…' : `₦${metrics.feesCollected.toLocaleString()}`} deltaText={loading ? '' : metrics.feesDeltaText} deltaDirection={metrics.feesDeltaDir as any} accentColor="#06B6D4" sparkline={metrics.feesSpark} sparklineColor="#06B6D4" />
      <KpiCard icon={<ScaleIcon className="w-5 h-5" />} label="Outstanding Fees" value={loading ? '…' : `₦${metrics.outstanding.toLocaleString()}`} accentColor="#F97316" />
      <KpiCard icon={<AcademicCapIcon className="w-5 h-5" />} label="Average Pass Rate" value={loading ? '…' : `${metrics.passRate}%`} accentColor="#2563EB" progress={metrics.passRate} />
      <KpiCard icon={<ChartBarIcon className="w-5 h-5" />} label="High-Risk Students" value={loading ? '…' : metrics.highRiskCount} accentColor="#F97316" />
      <KpiCard icon={<AcademicCapIcon className="w-5 h-5" />} label="Top Performing Students" value={loading ? '…' : metrics.topPerformingCount} accentColor="#2563EB" onClick={() => { const url = new URL(window.location.toString()); url.searchParams.set('view', ADMIN_VIEWS.LEADERBOARD_STUDENTS); window.history.pushState({}, '', url.toString()); }} />
      <KpiCard icon={<BriefcaseIcon className="w-5 h-5" />} label="Best Performing Teachers" value={loading ? '…' : metrics.bestTeachersCount} accentColor="#2563EB" onClick={() => { const url = new URL(window.location.toString()); url.searchParams.set('view', ADMIN_VIEWS.LEADERBOARD_TEACHERS); window.history.pushState({}, '', url.toString()); }} />
      <KpiCard icon={<UsersIcon className="w-5 h-5" />} label="New Students (This Term)" value={loading ? '…' : metrics.newStudentsThisMonth} accentColor="#2563EB" deltaText={loading ? '' : `${metrics.newStudentsDelta >= 0 ? '▲' : '▼'} ${Math.abs(metrics.newStudentsDelta)} vs last month`} deltaDirection={metrics.newStudentsDelta >= 0 ? 'up' : 'down'} />
      <KpiCard icon={<UsersIcon className="w-5 h-5" />} label={att.todayRate === null ? 'Attendance (Term)' : 'Attendance (Today)'} value={(loading || attLoading) ? '…' : `${(att.todayRate ?? att.termRate)}%`} accentColor="#2563EB" progress={(att.todayRate ?? att.termRate)} />
      <KpiCard icon={<WalletIcon className="w-5 h-5" />} label="Top Debtors" value={loading ? '…' : metrics.topDebtorsCount} accentColor="#F97316" onClick={() => { const url = new URL(window.location.toString()); url.searchParams.set('view', ADMIN_VIEWS.LEADERBOARD_DEBTORS); window.history.pushState({}, '', url.toString()); }} />
    </div>
  );
};

export default DashboardKPI;
