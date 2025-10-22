import React, { useEffect, useState } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetStudents, apiGetSchoolSettings } from '../services/api';

type Metric = { label: string; value: string; hint?: string; tone?: 'success' | 'warn' | 'danger' };

const currency = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString()}`;
  }
};

const FinanceSnapshotWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [topDebtors, setTopDebtors] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, invoices, payments, students] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetInvoices(),
          apiGetPayments(),
          apiGetStudents(),
        ]);

        const currentTerm = settings?.currentTerm || settings?.term || 'Current Term';
        const currentSession = settings?.currentSession || settings?.session || '';
        setLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        const filtered = invoices.filter(inv => {
          // Prefer matching current session/term where available; otherwise include all
          if (inv.session && currentSession && inv.session !== currentSession) return false;
          if (inv.term && currentTerm && inv.term !== currentTerm) return false;
          return true;
        });

        const totalBilled = filtered.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
        const totalPaid = filtered.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
        const outstanding = filtered.reduce((sum, i) => sum + Math.max(0, (i.totalAmount || 0) - (i.amountPaid || 0)), 0);
        const paidCount = filtered.filter(i => i.status === 'paid').length;
        const unpaidCount = filtered.filter(i => i.status === 'unpaid' || i.status === 'overdue' || i.status === 'partially-paid').length;
        const overdueCount = filtered.filter(i => i.status === 'overdue').length;

        const collectionRate = totalBilled > 0 ? +(100 * (totalPaid / totalBilled)).toFixed(1) : 0;

        const m: Metric[] = [
          { label: 'Total Billed', value: currency(totalBilled) },
          { label: 'Amount Collected', value: currency(totalPaid), hint: `${collectionRate}% collection rate`, tone: collectionRate >= 85 ? 'success' : (collectionRate >= 65 ? 'warn' : 'danger') },
          { label: 'Outstanding', value: currency(outstanding), tone: outstanding === 0 ? 'success' : (outstanding < totalBilled * 0.25 ? 'warn' : 'danger') },
          { label: 'Invoices', value: `${paidCount} paid • ${unpaidCount} unpaid`, hint: `${overdueCount} overdue` },
        ];
        setMetrics(m);

        // Top debtors (by outstanding amount)
        const debtorMap = new Map<string, number>();
        filtered.forEach(i => {
          const owed = Math.max(0, (i.totalAmount || 0) - (i.amountPaid || 0));
          if (owed > 0) debtorMap.set(i.studentId, (debtorMap.get(i.studentId) || 0) + owed);
        });
        const studentMap = new Map(students.map(s => [s.id, s.name]));
        const debtors = Array.from(debtorMap.entries())
          .map(([id, amt]) => ({ name: studentMap.get(id) || id, amount: amt }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        setTopDebtors(debtors);
      } catch (e) {
        console.error('Failed to load finance snapshot', e);
        setMetrics([]);
        setTopDebtors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pillTone = (tone?: Metric['tone']) => {
    switch (tone) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'warn': return 'bg-amber-100 text-amber-700';
      case 'danger': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Finance Snapshot</h3>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
        {loading ? (
          <div className="mt-4 text-sm text-gray-500">Loading finance metrics...</div>
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

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-600">Top Debtors</p>
              <ul className="mt-2 space-y-2">
                {topDebtors.length === 0 && (
                  <li className="text-sm text-gray-500">No outstanding balances.</li>
                )}
                {topDebtors.map(d => (
                  <li key={d.name} className="flex justify-between text-sm">
                    <span className="truncate pr-3">{d.name}</span>
                    <span className="font-semibold">{currency(d.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinanceSnapshotWidget;