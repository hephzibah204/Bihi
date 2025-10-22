import React, { useEffect, useRef, useState } from 'react';
import { apiGetExpenses, apiGetPayrollRuns } from '../services/api';
import SkeletonLoader from './SkeletonLoader';
import { exportToCSV } from '../utils/csvExporter';
import { formatNGN } from '../utils/currency';

type CategoryBucket = { label: string; amount: number; color: string };

const ExpenseCategoryBreakdown: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<CategoryBucket[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [expenses, payrollRuns] = await Promise.all([
          apiGetExpenses(),
          apiGetPayrollRuns(),
        ]);

        const colors: Record<string, string> = {
          Operational: '#3b82f6',
          Maintenance: '#6366f1',
          Supplies: '#22c55e',
          Utilities: '#f59e0b',
          Other: '#10b981',
          Payroll: '#ef4444',
        };

        const map = new Map<string, number>();
        (expenses || []).forEach(e => {
          const key = (e.category || 'Other');
          map.set(key, (map.get(key) || 0) + (e.amount || 0));
        });
        const payrollTotal = (payrollRuns || []).reduce((s, pr) => s + (pr.totalNet || 0), 0);
        if (payrollTotal > 0) map.set('Payroll', (map.get('Payroll') || 0) + payrollTotal);

        const bucketsList: CategoryBucket[] = Array.from(map.entries()).map(([label, amount]) => ({ label, amount, color: colors[label] || '#94a3b8' }));
        bucketsList.sort((a, b) => b.amount - a.amount);
        setBuckets(bucketsList);
      } catch (e) {
        console.error('Failed to load expense breakdown', e);
        setBuckets([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const C: any = (window as any).Chart;
    if (C && typeof C === 'function') {
      if (chartRef.current) chartRef.current.destroy?.();
      chartRef.current = new C(ctx, {
        type: 'pie',
        data: {
          labels: buckets.map(b => b.label),
          datasets: [{ data: buckets.map(b => b.amount), backgroundColor: buckets.map(b => b.color) }],
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
    return () => { chartRef.current?.destroy?.(); };
  }, [buckets]);

  const total = buckets.reduce((s, b) => s + b.amount, 0) || 1;

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Expense Category Breakdown</h3>
          <div className="flex items-center gap-3">
            <button
              className="btn btn-secondary h-8 text-sm"
              onClick={() => exportToCSV(buckets.map(b => ({ Category: b.label, Amount: Math.round(b.amount) })), 'expense-category-breakdown.csv')}
              disabled={loading || buckets.length === 0}
            >
              Export CSV
            </button>
            <p className="text-xs text-gray-500">Current totals</p>
          </div>
        </div>
        {loading ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ minHeight: 220 }}>
              <SkeletonLoader className="h-[220px] w-full" />
            </div>
            <div>
              <div className="space-y-2">
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
                <SkeletonLoader className="h-4" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ minHeight: 220 }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: 220 }} />
              {!((window as any).Chart) && (
                <div className="text-xs text-gray-600">
                  {buckets.map(b => (
                    <div key={b.label} className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-2.5 h-2.5 rounded" style={{ backgroundColor: b.color }} />
                      <span className="flex-1">{b.label}</span>
                      <span>{Math.round((b.amount / total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <ul className="text-sm space-y-2">
                {buckets.map(b => (
                  <li key={b.label} className="flex justify-between">
                    <span className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded" style={{ backgroundColor: b.color }}></span>{b.label}</span>
                    <span className="font-semibold">{formatNGN(b.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategoryBreakdown;