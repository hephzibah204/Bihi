import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetExpenses, apiGetPayrollRuns, apiGetIncome, apiGetSchoolSettings } from '../services/api';
import KpiCard from './ui/KpiCard';
import WalletIcon from './icons/WalletIcon';
import ScaleIcon from './icons/ScaleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import TopDebtorsQuickList from './TopDebtorsQuickList';
import { formatNGN } from '../utils/currency';

type InvoiceLike = any;
type PaymentLike = any;
type ExpenseLike = any;
type PayrollRunLike = any;
type IncomeLike = any;

const currency = (n: number) => formatNGN(n || 0);

const Donut: React.FC<{ paid: number; partial: number; unpaid: number; total: number }> = ({ paid, partial, unpaid, total }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 1;
  const segments = [
    { pct: paid / safeTotal, color: '#22C55E' },
    { pct: partial / safeTotal, color: '#F59E0B' },
    { pct: unpaid / safeTotal, color: '#EF4444' },
  ];
  let offset = 0;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={radius} fill="#eef2ff" />
      {segments.map((seg, i) => {
        const dash = seg.pct * circumference;
        const arc = (
          <circle key={i} cx="36" cy="36" r={radius} fill="transparent" stroke={seg.color} strokeWidth="12" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} />
        );
        offset += dash;
        return arc;
      })}
    </svg>
  );
};

const FinancialVitalsPro: React.FC = () => {
  const [sessions, setSessions] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  const [invoices, setInvoices] = useState<InvoiceLike[]>([]);
  const [payments, setPayments] = useState<PaymentLike[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLike[]>([]);
  const [payroll, setPayroll] = useState<PayrollRunLike[]>([]);
  const [income, setIncome] = useState<IncomeLike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [settings, inv, pay, exp, pr, inc] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetInvoices(),
          apiGetPayments(),
          apiGetExpenses(),
          apiGetPayrollRuns(),
          apiGetIncome(),
        ]);
        const currentTerm = settings?.currentTerm || settings?.term || '';
        const currentSession = settings?.currentSession || settings?.session || '';
        setSelectedSession(currentSession || '');
        setSelectedTerm(currentTerm || '');
        setInvoices(inv || []);
        setPayments(pay || []);
        setExpenses(exp || []);
        setPayroll(pr || []);
        setIncome(inc || []);
        const sessionSet = new Set<string>();
        const termSet = new Set<string>();
        (inv || []).forEach((i: InvoiceLike) => { if (i.session) sessionSet.add(i.session); if (i.term) termSet.add(i.term); });
        if (currentSession) sessionSet.add(currentSession);
        if (currentTerm) termSet.add(currentTerm);
        setSessions(Array.from(sessionSet));
        setTerms(Array.from(termSet));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter((inv: InvoiceLike) => {
      if (selectedSession && inv.session && inv.session !== selectedSession) return false;
      if (selectedTerm && inv.term && inv.term !== selectedTerm) return false;
      return true;
    });
  }, [invoices, selectedSession, selectedTerm]);

  const totals = useMemo(() => {
    const billed = filteredInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const paid = filteredInvoices.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0);
    const outstanding = filteredInvoices.reduce((s, i) => s + Math.max(0, (Number(i.totalAmount) || 0) - (Number(i.amountPaid) || 0)), 0);
    const paidCount = filteredInvoices.filter(i => i.status === 'paid').length;
    const partialCount = filteredInvoices.filter(i => i.status === 'partially-paid').length;
    const unpaidCount = filteredInvoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length;
    const overdueCount = filteredInvoices.filter(i => i.status === 'overdue').length;

    const collectionRate = billed > 0 ? +(100 * (paid / billed)).toFixed(1) : 0;
    return { billed, paid, outstanding, paidCount, partialCount, unpaidCount, overdueCount, collectionRate };
  }, [filteredInvoices]);

  const trend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }).map((_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
    const labels = months.map(m => m.toLocaleString(undefined, { month: 'short' }));
    const feesByMonth = months.map(m => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1).getTime();
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
      return (payments || []).filter(p => {
        const ts = new Date(p.paymentDate).getTime();
        return isFinite(ts) && ts >= start && ts < end;
      }).reduce((s: number, p: PaymentLike) => s + (Number(p.amount) || 0), 0);
    });
    const expensesByMonth = months.map(m => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1).getTime();
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
      const op = (expenses || []).filter(e => {
        const ts = new Date(e.date).getTime();
        return isFinite(ts) && ts >= start && ts < end;
      }).reduce((s: number, e: ExpenseLike) => s + (Number(e.amount) || 0), 0);
      const pr = (payroll || []).filter(pr => {
        const ts = new Date(pr.runDate).getTime();
        return isFinite(ts) && ts >= start && ts < end;
      }).reduce((s: number, pr: PayrollRunLike) => s + (Number(pr.totalNet) || 0), 0);
      return op + pr;
    });
    return { labels, feesByMonth, expensesByMonth };
  }, [payments, expenses, payroll]);

  useEffect(() => {
    const C: any = (window as any).Chart;
    if (!C || !chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy?.();
    chartInstanceRef.current = new C(ctx, {
      type: 'bar',
      data: {
        labels: trend.labels,
        datasets: [
          { label: 'Revenue', data: trend.feesByMonth, backgroundColor: 'rgba(37,99,235,0.5)', borderColor: '#2563EB' },
          { label: 'Expenses', data: trend.expensesByMonth, backgroundColor: 'rgba(239,68,68,0.4)', borderColor: '#EF4444' },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } } }
    });
    return () => { chartInstanceRef.current?.destroy?.(); };
  }, [trend.labels, trend.feesByMonth, trend.expensesByMonth]);

  const progressWidth = `${Math.min(100, Math.max(0, totals.collectionRate))}%`;

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Financial Vitals</h3>
          <div className="flex items-center gap-2">
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="input-field h-8 text-xs">
              <option value="">All Sessions</option>
              {sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field h-8 text-xs">
              <option value="">All Terms</option>
              {terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-500">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
              <div className="square-card">
                <div>
                  <div className="tile-title">Outstanding Fees</div>
                  <div className="tile-value" title={currency(totals.outstanding)}>{currency(totals.outstanding)}</div>
                  {totals.overdueCount > 0 && <div className="tile-sub">{totals.overdueCount} overdue invoices</div>}
                </div>
                <div className="flex items-center justify-end">
                  <ScaleIcon className="w-8 h-8 text-[#F97316]" />
                </div>
              </div>

              <div className="square-card">
                <div>
                  <div className="tile-title">Total Billed</div>
                  <div className="tile-value" title={currency(totals.billed)}>{currency(totals.billed)}</div>
                  <div className="tile-sub">Term: {selectedTerm || 'All'} • Session: {selectedSession || 'All'}</div>
                </div>
                <div className="flex items-center justify-end">
                  <WalletIcon className="w-8 h-8 text-[#2563EB]" />
                </div>
              </div>

              <div className="square-card">
                <div>
                  <div className="tile-title">Amount Collected</div>
                  <div className="tile-value" title={currency(totals.paid)}>{currency(totals.paid)}</div>
                </div>
                <div>
                  <div className="tile-sub">Collection Rate</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-[var(--brand-color-accent)] rounded-full" style={{ width: progressWidth }} />
                    </div>
                    <div className="text-xs font-semibold">{totals.collectionRate}%</div>
                  </div>
                </div>
              </div>

              
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card-soft p-4" style={{ minHeight: 240 }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Revenue vs Expenses (12 months)</div>
                  <ChartBarIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="mt-3" style={{ height: 200 }}>
                  {typeof (window as any).Chart === 'function' ? (
                    <canvas ref={chartRef} style={{ width: '100%', height: '200px' }} />
                  ) : (
                    <div className="text-xs text-gray-500">Chart library not loaded</div>
                  )}
                </div>
              </div>
              <div className="card-soft p-4">
                <div className="text-sm font-semibold">Payment Status Breakdown</div>
                <div className="mt-3 flex items-center gap-6">
                  <Donut paid={totals.paidCount} partial={totals.partialCount} unpaid={totals.unpaidCount} total={totals.paidCount + totals.partialCount + totals.unpaidCount} />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }}></span> Paid in Full: {(totals.paidCount + totals.partialCount + totals.unpaidCount) ? Math.round((totals.paidCount / (totals.paidCount + totals.partialCount + totals.unpaidCount)) * 100) : 0}%</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }}></span> Partially Paid: {(totals.paidCount + totals.partialCount + totals.unpaidCount) ? Math.round((totals.partialCount / (totals.paidCount + totals.partialCount + totals.unpaidCount)) * 100) : 0}%</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }}></span> Unpaid: {(totals.paidCount + totals.partialCount + totals.unpaidCount) ? Math.round((totals.unpaidCount / (totals.paidCount + totals.partialCount + totals.unpaidCount)) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <TopDebtorsQuickList />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialVitalsPro;
