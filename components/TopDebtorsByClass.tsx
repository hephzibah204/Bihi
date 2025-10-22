import React, { useEffect, useState } from 'react';
import { apiGetInvoices, apiGetSchoolSettings } from '../services/api';

type ClassDebt = { className: string; outstanding: number };

const currency = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString()}`;
  }
};

const TopDebtorsByClass: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>('');
  const [classes, setClasses] = useState<ClassDebt[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, invoices] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetInvoices(),
        ]);

        const currentTerm = settings?.currentTerm || settings?.term || 'Current Term';
        const currentSession = settings?.currentSession || settings?.session || '';
        setLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        const filtered = (invoices || []).filter(inv => {
          if (inv.session && currentSession && inv.session !== currentSession) return false;
          if (inv.term && currentTerm && inv.term !== currentTerm) return false;
          return true;
        });

        const agg = new Map<string, number>();
        filtered.forEach(i => {
          const owed = Math.max(0, (i.totalAmount || 0) - (i.amountPaid || 0));
          const key = i.class || 'Unspecified';
          agg.set(key, (agg.get(key) || 0) + owed);
        });

        const list: ClassDebt[] = Array.from(agg.entries()).map(([cls, amt]) => ({ className: cls, outstanding: amt }));
        list.sort((a, b) => b.outstanding - a.outstanding);
        setClasses(list.slice(0, 8));
      } catch (e) {
        console.error('Failed to load top debtors by class', e);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxVal = Math.max(...classes.map(c => c.outstanding), 1);

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Top Debtors by Class</h3>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
        {loading ? (
          <div className="mt-4 text-sm text-gray-500">Loading class rankings...</div>
        ) : (
          <div className="mt-3 space-y-3">
            {classes.length === 0 && <p className="text-sm text-gray-500">No outstanding balances.</p>}
            {classes.map(c => {
              const pct = Math.round((c.outstanding / maxVal) * 100);
              return (
                <div key={c.className}>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{c.className}</span>
                    <span className="font-medium">{currency(c.outstanding)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-rose-500 rounded" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopDebtorsByClass;