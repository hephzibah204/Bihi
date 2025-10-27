import React, { useEffect, useRef, useState } from 'react';
import { apiGetExpenses, apiGetIncome, apiGetPayrollRuns, apiGetPayments } from '../services/api';

const monthLabel = (d: Date) => d.toLocaleString(undefined, { month: 'short' });

const IncomeExpenseTrendChart: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<string[]>([]);
  const [incomeSeries, setIncomeSeries] = useState<number[]>([]);
  const [expenseSeries, setExpenseSeries] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [payments, incomes, expenses, payrollRuns] = await Promise.all([
          apiGetPayments(),
          apiGetIncome(),
          apiGetExpenses(),
          apiGetPayrollRuns(),
        ]);

        // Prepare last 12 months buckets
        const now = new Date();
        const months: { key: string; label: string; start: number; end: number }[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
          months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${monthLabel(d)} ${String(d.getFullYear()).slice(2)}`, start, end });
        }

        const incomeByMonth = months.map(m => {
          const paymentsSum = (payments || []).filter(p => {
            const ts = new Date(p.paymentDate).getTime();
            return isFinite(ts) && ts >= m.start && ts < m.end;
          }).reduce((s, p) => s + (p.amount || 0), 0);
          const otherIncome = (incomes || []).filter((inc: any) => {
            const ts = new Date(inc.date).getTime();
            return isFinite(ts) && ts >= m.start && ts < m.end;
          }).reduce((s: number, inc: any) => s + (inc.amount || 0), 0);
          return paymentsSum + otherIncome;
        });

        const expenseByMonth = months.map(m => {
          const expSum = (expenses || []).filter(exp => {
            const ts = new Date(exp.date).getTime();
            return isFinite(ts) && ts >= m.start && ts < m.end;
          }).reduce((s, exp) => s + (exp.amount || 0), 0);
          const payrollSum = (payrollRuns || []).filter(pr => {
            const ts = new Date(pr.runDate).getTime();
            return isFinite(ts) && ts >= m.start && ts < m.end;
          }).reduce((s, pr) => s + (pr.totalNet || 0), 0);
          return expSum + payrollSum;
        });

        setLabels(months.map(m => m.label));
        setIncomeSeries(incomeByMonth);
        setExpenseSeries(expenseByMonth);
      } catch (e) {
        // Non-fatal: keep empty chart fallback
        setLabels([]);
        setIncomeSeries([]);
        setExpenseSeries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    // If Chart.js is available, render a line chart
    const C: any = (window as any).Chart;
    if (C && typeof C === 'function') {
      if (chartRef.current) chartRef.current.destroy?.();
      chartRef.current = new C(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Income', data: incomeSeries, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', tension: 0.25 },
            { label: 'Expenses', data: expenseSeries, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', tension: 0.25 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: { y: { ticks: { callback: (v: any) => `₦${Math.round(Number(v)).toLocaleString()}` } } }
        }
      });
    }
    return () => {
      if (chartRef.current) chartRef.current.destroy?.();
    };
  }, [labels, incomeSeries, expenseSeries]);

  const fallbackBars = () => (
    <div className="mt-3">
      {labels.length === 0 && <p className="text-xs text-gray-500">No data available.</p>}
      {labels.map((lab, i) => {
        const inc = incomeSeries[i] || 0;
        const exp = expenseSeries[i] || 0;
        const max = Math.max(inc, exp, 1);
        const incPct = Math.round((inc / max) * 100);
        const expPct = Math.round((exp / max) * 100);
        return (
          <div key={lab} className="mb-2">
            <div className="flex justify-between text-[11px] text-gray-600"><span>{lab}</span><span>Income {incPct}% • Expenses {expPct}%</span></div>
            <div className="h-1.5 bg-gray-200 rounded">
              <div className="h-1.5 bg-green-500 rounded" style={{ width: `${incPct}%` }} />
            </div>
            <div className="h-1.5 bg-gray-200 rounded mt-1">
              <div className="h-1.5 bg-rose-500 rounded" style={{ width: `${expPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Income vs Expense Trend</h3>
          <p className="text-xs text-gray-500">Last 12 months</p>
        </div>
        {loading ? (
          <div className="mt-4 text-sm text-gray-500">Loading trend...</div>
        ) : (
          <div className="mt-3" style={{ minHeight: 220 }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 220 }} />
            {!(window as any).Chart && fallbackBars()}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseTrendChart;