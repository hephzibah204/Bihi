import React, { useEffect, useState } from 'react';
import StatCard from './StatCard';
import UsersIcon from './icons/UsersIcon';
import ClockIcon from './icons/ClockIcon';
import TrophyIcon from './icons/TrophyIcon';
import WalletIcon from './icons/WalletIcon';
import { apiGetStudents, apiGetAttendance, apiGetScores, apiGetInvoices, apiGetSchoolSettings, apiGetActivityLog } from '../services/api';

type KPIState = {
  totalStudents: number;
  studentsDelta: number; // net adds - deletes in last 30 days
  todayAttendancePct: number;
  termAveragePct: number;
  outstandingFees: number;
  label: string; // e.g., "2024/2025 • Second Term"
};

const currency = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString()}`;
  }
};

const attendanceToneClass = (pct: number) => {
  if (pct >= 95) return 'border-l-4 border-green-500';
  if (pct >= 90) return 'border-l-4 border-amber-500';
  return 'border-l-4 border-rose-500';
};

const SchoolVitals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIState | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, students, attendance, scores, invoices, activities] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetStudents(),
          apiGetAttendance(),
          apiGetScores(),
          apiGetInvoices(),
          apiGetActivityLog(),
        ]);

        const currentTerm = (settings as any)?.currentTerm || settings?.term || 'Current Term';
        const currentSession = (settings as any)?.currentSession || settings?.session || '';
        const label = [currentSession, currentTerm].filter(Boolean).join(' • ');

        // Total students and 30-day delta via activities
        const totalStudents = Array.isArray(students) ? students.length : 0;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const recentActivities = (activities || []).filter(a => new Date(a.timestamp).getTime() >= cutoff.getTime());
        const adds = recentActivities.filter(a => typeof a.type === 'string' && a.type.startsWith('STUDENT_ADD')).length;
        const deletes = recentActivities.filter(a => typeof a.type === 'string' && a.type.startsWith('STUDENT_DELETE')).length;
        const studentsDelta = adds - deletes;

        // Today attendance across all classes
        const todayStr = new Date().toDateString();
        const todayRecords = (attendance || []).filter(rec => new Date(rec.date).toDateString() === todayStr);
        let presentUnits = 0;
        let totalUnits = 0;
        todayRecords.forEach(rec => {
          const statuses = rec.statuses || {};
          Object.keys(statuses).forEach(id => {
            const s = statuses[id];
            presentUnits += s === 'present' ? 1 : (s === 'late' ? 0.5 : 0);
            totalUnits += 1;
          });
        });
        const todayAttendancePct = totalUnits > 0 ? +(100 * (presentUnits / totalUnits)).toFixed(1) : 0;

        // School-wide average for current term
        const maxCa1 = settings?.maxCa1 ?? 0;
        const maxCa2 = settings?.maxCa2 ?? 0;
        const maxExam = settings?.maxExam ?? 0;
        const maxTotal = (maxCa1 + maxCa2 + maxExam) || 100; // fallback to 100
        const termScores = (scores || []).filter(s => (!s.term || !currentTerm ? true : s.term === currentTerm) && (!s.session || !currentSession ? true : s.session === currentSession));
        let normalizedSum = 0;
        termScores.forEach(s => {
          const total = (s?.ca1 || 0) + (s?.ca2 || 0) + (s?.exam || 0);
          normalizedSum += 100 * (total / maxTotal);
        });
        const termAveragePct = termScores.length > 0 ? +(normalizedSum / termScores.length).toFixed(1) : 0;

        // Outstanding fees (session/term-filtered)
        const filteredInvoices = (invoices || []).filter(inv => {
          if (inv.session && currentSession && inv.session !== currentSession) return false;
          if (inv.term && currentTerm && inv.term !== currentTerm) return false;
          return true;
        });
        const outstandingFees = filteredInvoices.reduce((sum, i) => {
          const totalAmt = (i.totalAmount ?? i.amount ?? 0);
          const paidAmt = (i.amountPaid ?? 0);
          const balance = (i.balanceRemaining ?? Math.max(0, totalAmt - paidAmt));
          return sum + balance;
        }, 0);

        setKpis({ totalStudents, studentsDelta, todayAttendancePct, termAveragePct, outstandingFees, label });
      } catch (e) {
        console.error('Failed to load school vitals', e);
        setKpis({ totalStudents: 0, studentsDelta: 0, todayAttendancePct: 0, termAveragePct: 0, outstandingFees: 0, label: '' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="card p-6">Loading vitals...</div>
      </div>
    );
  }

  const attendanceTone = attendanceToneClass(kpis.todayAttendancePct);
  const studentTrend = kpis.studentsDelta !== 0 ? { value: `${kpis.studentsDelta > 0 ? '+' : ''}${kpis.studentsDelta} last 30 days`, direction: kpis.studentsDelta > 0 ? 'up' as const : 'down' as const } : null;

  return (
    <div className="mt-6">
      {kpis.label && <p className="text-sm text-gray-500 mb-2">{kpis.label}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={kpis.totalStudents} 
          icon={<UsersIcon className="w-6 h-6" />} 
          trend={studentTrend}
        />

        <StatCard 
          title="Overall Attendance (Today)" 
          value={`${kpis.todayAttendancePct}%`} 
          icon={<ClockIcon className="w-6 h-6" />} 
          className={attendanceTone}
        />

        <StatCard 
          title="School-Wide Average (Term)" 
          value={`${kpis.termAveragePct}%`} 
          icon={<TrophyIcon className="w-6 h-6" />} 
        />

        <StatCard 
          title="Outstanding Fees" 
          value={currency(kpis.outstandingFees)} 
          icon={<WalletIcon className="w-6 h-6" />} 
        />
      </div>
    </div>
  );
};

export default SchoolVitals;