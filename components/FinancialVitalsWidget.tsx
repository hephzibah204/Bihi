import React, { useEffect, useMemo, useState } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetStudents, apiGetSchoolSettings, apiGetExpenses, apiGetPayrollRuns, apiGetIncome } from '../services/api';
import SkeletonLoader from './SkeletonLoader';
import { formatNGN } from '../utils/currency';

type Metric = { label: string; value: string; hint?: string; tone?: 'success' | 'warn' | 'danger' };

import type { Invoice, Payment, Expense, PayrollRun, Income } from '../types';

type InvoiceLike = Invoice;
type PaymentLike = Payment;
type ExpenseLike = Expense;
type PayrollRunLike = PayrollRun;
type IncomeLike = Income;

const currency = (n: number) => formatNGN(n);

const FinancialVitalsWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState<{ revenue: number; expenses: number }>({ revenue: 0, expenses: 0 });
  const [statusBreakdown, setStatusBreakdown] = useState<{ paid: number; partial: number; unpaid: number; total: number }>({ paid: 0, partial: 0, unpaid: 0, total: 0 });

  const [sessions, setSessions] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  const [invoicesData, setInvoicesData] = useState<InvoiceLike[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentLike[]>([]);
  const [expensesData, setExpensesData] = useState<ExpenseLike[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollRunLike[]>([]);
  const [incomesData, setIncomesData] = useState<IncomeLike[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [settings, invoices, payments, expenses, payrollRuns, incomes] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetInvoices(),
          apiGetPayments(),
          apiGetExpenses(),
          apiGetPayrollRuns(),
          apiGetIncome(),
        ]);

        const currentTerm = settings?.currentTerm || settings?.term || 'Current Term';
        const currentSession = settings?.currentSession || settings?.session || '';
        setSelectedSession(currentSession || '');
        setSelectedTerm(currentTerm || '');

        setInvoicesData(invoices || []);
        setPaymentsData(payments || []);
        setExpensesData(expenses || []);
        setPayrollData(payrollRuns || []);
        setIncomesData(incomes || []);

        // Derive sessions and terms from invoices data plus current settings
        const sessionSet = new Set<string>();
        const termSet = new Set<string>();
        (invoices || []).forEach((inv: InvoiceLike) => {
          if (inv.session) sessionSet.add(inv.session);
          if (inv.term) termSet.add(inv.term);
        });
        if (currentSession) sessionSet.add(currentSession);
        if (currentTerm) termSet.add(currentTerm);
        setSessions(Array.from(sessionSet));
        setTerms(Array.from(termSet));

      } catch (e) {
        // Non-fatal: keep UI placeholders
        setInvoicesData([]);
        setPaymentsData([]);
        setExpensesData([]);
        setPayrollData([]);
        setIncomesData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    // Compute label and metrics whenever filters or data change
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);

    const filteredInvoices = invoicesData.filter((inv: InvoiceLike) => {
      if (selectedSession && inv.session && inv.session !== selectedSession) return false;
      if (selectedTerm && inv.term && inv.term !== selectedTerm) return false;
      return true;
    });

    const totalBilled = filteredInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const totalPaid = filteredInvoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const outstanding = filteredInvoices.reduce((sum, i) => sum + Math.max(0, (i.totalAmount || 0) - (i.amountPaid || 0)), 0);

    const paidCount = filteredInvoices.filter(i => i.status === 'paid').length;
    const partialCount = filteredInvoices.filter(i => i.status === 'partially-paid').length;
    const unpaidCount = filteredInvoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length;
    const overdueCount = filteredInvoices.filter(i => i.status === 'overdue').length;

    const collectionRate = totalBilled > 0 ? +(100 * (totalPaid / totalBilled)).toFixed(1) : 0;

    const paymentsByInvoice = new Map<string, { date: number; amount: number }[]>();
    (paymentsData || []).forEach((p: PaymentLike) => {
      const arr = paymentsByInvoice.get(p.invoiceId) || [];
      arr.push({ date: new Date(p.paymentDate).getTime(), amount: p.amount || 0 });
      paymentsByInvoice.set(p.invoiceId, arr);
    });

    const outstandingLastWeek = filteredInvoices.reduce((sum, inv) => {
      const issueTs = new Date(inv.issueDate).getTime();
      const cutoffTs = cutoff.getTime();
      if (isFinite(issueTs) && issueTs > cutoffTs) return sum; // invoice issued after cutoff
      const paymentsForInv = paymentsByInvoice.get(inv.id) || [];
      const paidBeforeCutoff = paymentsForInv.reduce((s, r) => s + (r.date <= cutoffTs ? r.amount : 0), 0);
      const owedAtCutoff = Math.max(0, (inv.totalAmount || 0) - paidBeforeCutoff);
      return sum + owedAtCutoff;
    }, 0);

    let trendHint = '';
    if (outstandingLastWeek > 0) {
      const delta = outstanding - outstandingLastWeek;
      const pct = Math.abs((delta / outstandingLastWeek) * 100);
      const pctStr = `${pct.toFixed(1)}%`;
      trendHint = delta < 0 ? `down ${pctStr} from last week` : (delta > 0 ? `up ${pctStr} from last week` : 'no change from last week');
    }

    const m: Metric[] = [
      { label: 'Total Outstanding Fees', value: currency(outstanding), hint: trendHint, tone: outstanding === 0 ? 'success' : (outstanding < Math.max(1, totalBilled) * 0.25 ? 'warn' : 'danger') },
      { label: 'Total Billed', value: currency(totalBilled) },
      { label: 'Amount Collected', value: currency(totalPaid), hint: `${collectionRate}% collection rate`, tone: collectionRate >= 85 ? 'success' : (collectionRate >= 65 ? 'warn' : 'danger') },
      { label: 'Invoices', value: `${paidCount} paid • ${partialCount} partial • ${unpaidCount} unpaid`, hint: `${overdueCount} overdue` },
    ];
    setMetrics(m);

    setStatusBreakdown({ paid: paidCount, partial: partialCount, unpaid: unpaidCount, total: filteredInvoices.length });

    // Revenue vs Expenses (approximate term = last 90 days)
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const ninetyTs = ninetyDaysAgo.getTime();

    const paymentsRecent = (paymentsData || []).filter((p: PaymentLike) => {
      const ts = new Date(p.paymentDate).getTime();
      return isFinite(ts) && ts >= ninetyTs;
    }).reduce((s: number, p: PaymentLike) => s + (p.amount || 0), 0);

    const incomeRecent = (incomesData || []).filter((inc: IncomeLike) => {
      const ts = new Date(inc.date).getTime();
      return isFinite(ts) && ts >= ninetyTs;
    }).reduce((s: number, inc: IncomeLike) => s + (inc.amount || 0), 0);

    const expensesRecent = (expensesData || []).filter((exp: ExpenseLike) => {
      const ts = new Date(exp.date).getTime();
      return isFinite(ts) && ts >= ninetyTs;
    }).reduce((s: number, exp: ExpenseLike) => s + (exp.amount || 0), 0);

    const payrollRecent = (payrollData || []).filter((pr: PayrollRunLike) => {
      const ts = new Date(pr.runDate).getTime();
      return isFinite(ts) && ts >= ninetyTs;
    }).reduce((s: number, pr: PayrollRunLike) => s + (pr.totalNet || 0), 0);

    setRevenueVsExpenses({ revenue: paymentsRecent + incomeRecent, expenses: expensesRecent + payrollRecent });

    const sessionLabel = selectedSession || 'All Sessions';
    const termLabel = selectedTerm || 'All Terms';
    setLabel([sessionLabel, termLabel].filter(Boolean).join(' • '));
  }, [selectedSession, selectedTerm, invoicesData, paymentsData, expensesData, payrollData, incomesData]);

  const pillTone = (tone?: Metric['tone']) => {
    switch (tone) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'warn': return 'bg-amber-100 text-amber-700';
      case 'danger': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const Donut: React.FC<{ paid: number; partial: number; unpaid: number; total: number }> = ({ paid, partial, unpaid, total }) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const segments = useMemo(() => {
      const safeTotal = total > 0 ? total : 1;
      const paidPct = paid / safeTotal;
      const partialPct = partial / safeTotal;
      const unpaidPct = unpaid / safeTotal;
      return [
        { pct: paidPct, color: '#10b981' },
        { pct: partialPct, color: '#f59e0b' },
        { pct: unpaidPct, color: '#ef4444' },
      ];
    }, [paid, partial, unpaid, total]);

    let offset = 0;
    const arcs = segments.map((seg, idx) => {
      const dash = seg.pct * circumference;
      const arc = (
        <circle
          key={idx}
          cx="36" cy="36" r={radius}
          fill="transparent"
          stroke={seg.color}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={-offset}
        />
      );
      offset += dash;
      return arc;
    });

    return (
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="#f3f4f6" />
        {arcs}
      </svg>
    );
  };

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Financial Vitals</h3>
          <div className="flex items-center gap-2">
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="input-field h-8 text-xs">
              <option value="">All Sessions</option>
              {sessions.map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="input-field h-8 text-xs">
              <option value="">All Terms</option>
              {terms.map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
        {loading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-4 border rounded-lg"><SkeletonLoader className="h-4 mb-2" /><SkeletonLoader className="h-6" /></div>
              <div className="p-4 border rounded-lg"><SkeletonLoader className="h-4 mb-2" /><SkeletonLoader className="h-6" /></div>
              <div className="p-4 border rounded-lg"><SkeletonLoader className="h-4 mb-2" /><SkeletonLoader className="h-6" /></div>
              <div className="p-4 border rounded-lg"><SkeletonLoader className="h-4 mb-2" /><SkeletonLoader className="h-6" /></div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <SkeletonLoader className="h-4 w-40 mb-3" />
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <SkeletonLoader className="h-3 w-24 mb-2" />
                    <SkeletonLoader className="h-6 w-32" />
                  </div>
                  <div>
                    <SkeletonLoader className="h-3 w-24 mb-2" />
                    <SkeletonLoader className="h-6 w-32" />
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <SkeletonLoader className="h-4 w-40 mb-3" />
                <div className="mt-3 flex items-center gap-6">
                  <SkeletonLoader className="w-20 h-20 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonLoader className="h-3 w-48" />
                    <SkeletonLoader className="h-3 w-48" />
                    <SkeletonLoader className="h-3 w-48" />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {metrics.map(m => (
                <div key={m.label} className="p-4 border rounded-lg">
                  <p className="text-xs text-gray-600">{m.label}</p>
                  <p className="mt-1 text-lg font-semibold">{m.value}</p>
                  {m.hint && (
                    <span className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${pillTone(m.tone)}`}>{m.hint}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-gray-600">Revenue vs. Expenses (This Term)</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Revenue Collected</p>
                    <p className="mt-1 text-xl font-semibold text-green-700">{currency(revenueVsExpenses.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expenses</p>
                    <p className="mt-1 text-xl font-semibold text-rose-700">{currency(revenueVsExpenses.expenses)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <p className="text-xs text-gray-600">Payment Status Breakdown</p>
                <div className="mt-3 flex items-center gap-6">
                  <Donut paid={statusBreakdown.paid} partial={statusBreakdown.partial} unpaid={statusBreakdown.unpaid} total={statusBreakdown.total} />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }}></span> Paid in Full: {statusBreakdown.total ? Math.round((statusBreakdown.paid / statusBreakdown.total) * 100) : 0}%</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }}></span> Partially Paid: {statusBreakdown.total ? Math.round((statusBreakdown.partial / statusBreakdown.total) * 100) : 0}%</div>
                    <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }}></span> Unpaid: {statusBreakdown.total ? Math.round((statusBreakdown.unpaid / statusBreakdown.total) * 100) : 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialVitalsWidget;