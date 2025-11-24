import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiGetStudents, apiGetScores, apiGetAttendance, apiGetSchoolSettings, apiGetSubjects, apiGetTeachers, apiGetBehavioralRecords, apiGetTeacherAttendance, apiGetPayments, apiGetInvoices, apiSendMessage, apiUpsertScheduledCampaign } from '../services/api';
import { Student, Subject, Score, BehavioralLogEntry, TeacherAttendanceRecord } from '../types';
import { downloadElementAsPdf, sanitizeFilename, renderElementAsPdfBlob } from '../utils/pdfUtils';
import { exportToCSV } from '../utils/csvExporter';

const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [behavioral, setBehavioral] = useState<BehavioralLogEntry[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'termly' | 'yearly'>('termly');
  const [reportDate, setReportDate] = useState<string>('');
  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState('');

  const subjectBreakdownChartRef = useRef<HTMLCanvasElement>(null);
  const financeChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [studentData, subjectData, teacherData, scoreData, settingsData, attendanceData, behavioralData]: [Student[], Subject[], any[], Score[], any, any[], BehavioralLogEntry[]] = await Promise.all([
          apiGetStudents(),
          apiGetSubjects(),
          apiGetTeachers(),
          apiGetScores(),
          apiGetSchoolSettings(),
          apiGetAttendance(),
          apiGetBehavioralRecords(),
        ]);
        setStudents(studentData);
        setSubjects(subjectData);
        setTeachers(teacherData);
        setScores(scoreData);
        setSettings(settingsData);
        setAttendance(attendanceData);
        setBehavioral(behavioralData);
        const sessions = [...new Set(scoreData.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
        if (sessions.length) setSelectedSession(sessions[0]);
        const terms = [...new Set(scoreData.map(s => s.term))];
        if (!terms.includes('All Terms')) setSelectedTerm('All Terms');
        const ta = await apiGetTeacherAttendance();
        setTeacherAttendance(ta);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const computeDateRange = () => {
    const now = new Date();
    if (reportPeriod === 'daily') {
      const d = reportDate ? new Date(reportDate) : now;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      return { start, end };
    }
    if (reportPeriod === 'weekly') {
      const d = weekStartDate ? new Date(weekStartDate) : now;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (reportPeriod === 'termly') {
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
    }
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
  };

  const filterByDate = (iso?: string, range?: { start: Date; end: Date }) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= (range?.start || new Date(0)) && d <= (range?.end || new Date(8640000000000000));
  };

  const sessionTermScores = useMemo(() => {
    const s = selectedSession || settings?.session || '';
    const t = selectedTerm === 'All Terms' ? '' : (selectedTerm || settings?.term || '');
    return scores.filter(v => (!s || v.session === s) && (!t || v.term === t));
  }, [scores, selectedSession, selectedTerm, settings]);

  const overallAvg = useMemo(() => {
    if (!sessionTermScores.length) return 0;
    const total = sessionTermScores.reduce((sum, v) => sum + (v.ca1 || 0) + (v.ca2 || 0) + (v.exam || 0), 0);
    return Number((total / sessionTermScores.length).toFixed(2));
  }, [sessionTermScores]);

  const attendanceRate = useMemo(() => {
    const range = computeDateRange();
    let present = 0, totalMarked = 0;
    attendance.filter(a => filterByDate(a.date, range)).forEach(rec => {
      Object.values(rec.statuses || {}).forEach(s => {
        totalMarked += 1;
        if (String(s).toLowerCase() === 'present') present += 1;
      });
    });
    return totalMarked > 0 ? Number(((present / totalMarked) * 100).toFixed(2)) : 0;
  }, [attendance, reportPeriod, reportDate, weekStartDate]);

  const classAverages = useMemo(() => {
    const list = [...new Set(students.map(s => s.class))];
    return list.map(cls => {
      const ids = new Set(students.filter(s => s.class === cls).map(s => s.id));
      const clsScores = sessionTermScores.filter(s => ids.has(s.studentId));
      const avg = clsScores.length > 0 ? (clsScores.reduce((sum, sc) => sum + (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0), 0) / clsScores.length) : 0;
      return { className: cls, average: Number(avg.toFixed(2)) };
    }).sort((a, b) => b.average - a.average).slice(0, 3);
  }, [students, sessionTermScores]);

  const behavioralSummary = useMemo(() => {
    const range = computeDateRange();
    const filtered = behavioral.filter(b => filterByDate(b.date, range));
    const positive = filtered.filter(b => b.type === 'positive').length;
    const negative = filtered.filter(b => b.type === 'negative').length;
    const neutral = filtered.filter(b => b.type === 'neutral').length;
    return { positive, negative, neutral };
  }, [behavioral, reportPeriod, reportDate, weekStartDate]);

  const teacherAttendanceSummary = useMemo(() => {
    const range = computeDateRange();
    const filtered = teacherAttendance.filter(r => filterByDate(r.timestamp, range));
    const present = filtered.filter(r => r.status === 'present').length;
    const absent = filtered.filter(r => r.status === 'absent').length;
    return { present, absent };
  }, [teacherAttendance, reportPeriod, reportDate, weekStartDate]);

  const exportCsv = async () => {
    const [payments, invoices] = await Promise.all([apiGetPayments(), apiGetInvoices()]);
    const range = computeDateRange();
    const relevantPayments = payments.filter(p => filterByDate(p.paymentDate, range));
    const totalCollected = relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstanding = invoices.reduce((sum, inv) => sum + Math.max((inv.totalAmount || 0) - (inv.amountPaid || 0), 0), 0);
    const rows: any[] = [
      { Metric: 'Period', Value: reportPeriod },
      { Metric: 'Session', Value: selectedSession || settings?.session || '' },
      { Metric: 'Term', Value: selectedTerm },
      { Metric: 'Students', Value: students.length },
      { Metric: 'Average Score', Value: overallAvg },
      { Metric: 'Attendance Rate (%)', Value: attendanceRate },
      { Metric: 'Teacher Present', Value: teacherAttendanceSummary.present },
      { Metric: 'Teacher Absent', Value: teacherAttendanceSummary.absent },
      { Metric: 'Behavioral Positive', Value: behavioralSummary.positive },
      { Metric: 'Behavioral Negative', Value: behavioralSummary.negative },
      { Metric: 'Behavioral Neutral', Value: behavioralSummary.neutral },
      { Metric: 'Total Collected', Value: totalCollected },
      { Metric: 'Outstanding Fees', Value: outstanding },
    ];
    classAverages.forEach((c, idx) => rows.push({ Metric: `Top Class ${idx + 1}`, Value: `${c.className} (${c.average})` }));
    exportToCSV(rows, `School_Performance_${reportPeriod}.csv`);
  };

  const exportPdf = async () => {
    await downloadElementAsPdf('#reports-root', sanitizeFilename(`School_Performance_${reportPeriod}`));
  };

  const sendEmailWithAttachment = async () => {
    const blob = await renderElementAsPdfBlob('#reports-root');
    let base64 = '';
    if (blob) {
      const ab = await blob.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      base64 = btoa(binary);
    }
    const recipients: string[] = [];
    const adminEmails = (teachers || []).filter(t => String(t.role) === 'Admin').map(t => t.email).filter(Boolean);
    recipients.push(...adminEmails);
    const schoolEmail = settings?.email ? [settings.email] : [];
    recipients.push(...schoolEmail);
    const content = `Attached: School Performance (${reportPeriod})`;
    const attachments = base64 ? [{ filename: `School_Performance_${reportPeriod}.pdf`, base64, contentType: 'application/pdf' }] : undefined;
    await apiSendMessage({ channel: 'email', content, recipients: recipients.length ? recipients : ['all'], type: 'announcement', attachments });
  };

  const sendSmsSummary = async () => {
    const recipients: string[] = [];
    if (settings?.phone) recipients.push(settings.phone);
    if (!recipients.length) {
      alert('No school phone configured in Settings.');
      return;
    }
    const text = `Perf ${reportPeriod}: Stud ${students.length}, Avg ${overallAvg}, Attn ${attendanceRate}%, TA P/A ${teacherAttendanceSummary.present}/${teacherAttendanceSummary.absent}, Beh +${behavioralSummary.positive}/-${behavioralSummary.negative}/${behavioralSummary.neutral}.`;
    await apiSendMessage({ channel: 'sms', content: text, recipients, type: 'announcement' });
  };

  const scheduleEmailReport = async () => {
    const now = new Date();
    const next = new Date(now);
    if (reportPeriod === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (reportPeriod === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (reportPeriod === 'termly') {
      next.setMonth(next.getMonth() + 3);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
    next.setHours(7, 0, 0, 0);
    await apiUpsertScheduledCampaign({
      id: `reports_${reportPeriod}_${Date.now()}`,
      name: `School Performance Report (${reportPeriod})`,
      templateId: 'reports-auto',
      channel: 'email',
      target: 'all',
      sendAt: next.toISOString(),
      enabled: true,
    } as any);
    alert(`Scheduled ${reportPeriod} report for ${next.toLocaleString()}`);
  };

  useEffect(() => {
    if (!window.Chart) return;
    Object.values(chartInstances.current).forEach((c: any) => { try { c?.destroy?.(); } catch {} });
    const gridColor = 'rgba(0, 0, 0, 0.1)';
    const labelColor = '#4B5563';
    const commonOptions = { responsive: true, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: labelColor } }, x: { grid: { color: gridColor }, ticks: { color: labelColor } } } };

    if (subjectBreakdownChartRef.current) {
      const classes = [...new Set(students.map(s => s.class))];
      const className = selectedClassForSubjects || classes[0] || '';
      const subjectsForClass = subjects.filter(s => className ? s.classes.includes(className) : true);
      const labels = subjectsForClass.map(s => s.name);
      const ids = new Set(students.filter(s => !className || s.class === className).map(s => s.id));
      const data = labels.map(name => {
        const subj = subjects.find(s => s.name === name);
        if (!subj) return 0;
        const relevant = sessionTermScores.filter(sc => ids.has(sc.studentId) && sc.subjectId === subj.id);
        if (!relevant.length) return 0;
        const total = relevant.reduce((sum, sc) => sum + (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0), 0);
        return Number((total / relevant.length).toFixed(2));
      });
      chartInstances.current.subject = new (window as any).Chart(subjectBreakdownChartRef.current, { type: 'bar', data: { labels, datasets: [{ label: `Subject Averages (${className || 'All'})`, data, backgroundColor: '#4F46E5' }] }, options: commonOptions });
    }

    if (financeChartRef.current) {
      const range = computeDateRange();
      const buildFinance = async () => {
        const [payments, invoices] = await Promise.all([apiGetPayments(), apiGetInvoices()]);
        const relevantPayments = payments.filter(p => filterByDate(p.paymentDate, range));
        const totalCollected = relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const outstanding = invoices.reduce((sum, inv) => sum + Math.max((inv.totalAmount || 0) - (inv.amountPaid || 0), 0), 0);
        chartInstances.current.finance = new (window as any).Chart(financeChartRef.current, { type: 'bar', data: { labels: ['Collected', 'Outstanding'], datasets: [{ label: '₦ Finance', data: [totalCollected, outstanding], backgroundColor: ['#10B981', '#EF4444'] }] }, options: commonOptions });
      };
      buildFinance();
    }
  }, [students, subjects, sessionTermScores, reportPeriod, reportDate, weekStartDate, selectedClassForSubjects]);

  if (loading) return <div className="card p-6 text-center">Loading reports...</div>;

  const sessions = [...new Set(scores.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
  const terms = ['All Terms', ...new Set(scores.map(s => s.term))];

  return (
    <div>
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Reports</h2>
              <p className="text-gray-500 mt-1">Download or send school-wide summaries including behavioral and teacher attendance.</p>
            </div>
            <div className="flex gap-2">
              <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value as any)} className="input-field">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="termly">Termly</option>
                <option value="yearly">Yearly</option>
              </select>
              {reportPeriod === 'daily' && (
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="input-field" />
              )}
              {reportPeriod === 'weekly' && (
                <input type="date" value={weekStartDate} onChange={e => setWeekStartDate(e.target.value)} className="input-field" />
              )}
              <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="input-field"><option value="">All Sessions</option>{sessions.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field">{terms.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
          </div>
          <div id="reports-root" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat title="Students" value={students.length} />
            <Stat title="Average Score" value={overallAvg} />
            <Stat title="Attendance Rate (%)" value={attendanceRate} />
            <Stat title="Teacher Present" value={teacherAttendanceSummary.present} />
            <Stat title="Teacher Absent" value={teacherAttendanceSummary.absent} />
            <Stat title="Behavioral Positive" value={behavioralSummary.positive} />
            <Stat title="Behavioral Negative" value={behavioralSummary.negative} />
            <Stat title="Behavioral Neutral" value={behavioralSummary.neutral} />
            {classAverages.map((c, i) => (
              <Stat key={i} title={`Top Class ${i + 1}`} value={`${c.className} (${c.average})`} />
            ))}
            <div className="card p-6 md:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Subject Breakdown</h3>
                <select value={selectedClassForSubjects} onChange={e => setSelectedClassForSubjects(e.target.value)} className="input-field">
                  <option value="">All Classes</option>
                  {[...new Set(students.map(s => s.class))].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <canvas ref={subjectBreakdownChartRef}></canvas>
            </div>
            <div className="card p-6 md:col-span-3">
              <h3 className="text-lg font-semibold mb-4">Finance</h3>
              <canvas ref={financeChartRef}></canvas>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-outline" onClick={exportCsv}>Export CSV</button>
            <button className="btn-outline" onClick={exportPdf}>Download PDF</button>
            <button className="btn" onClick={sendEmailWithAttachment}>Send Email (PDF)</button>
            <button className="btn" onClick={sendSmsSummary}>Send SMS Summary</button>
            <button className="btn-outline" onClick={scheduleEmailReport}>Schedule Email</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ title, value }: { title: string; value: number | string }) => (
  <div className="card p-6 text-center">
    <h3 className="text-2xl font-bold">{value}</h3>
    <p className="text-gray-500">{title}</p>
  </div>
);

export default Reports;
