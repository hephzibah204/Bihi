import React, { useEffect, useMemo, useState } from 'react';
import { apiGetInvoices, apiGetStudents } from '../services/api';
import Card from './ui/Card';

const TopDebtorsQuickList: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, inv] = await Promise.all([apiGetStudents(), apiGetInvoices()]);
        setStudents(s || []);
        setInvoices(inv || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rows = useMemo(() => {
    const byStudent: Record<string, { amount: number; lastPayment?: string }> = {};
    for (const i of invoices) {
      const total = Number(i.totalAmount) || 0;
      const paid = Number(i.amountPaid) || 0;
      const outstanding = Math.max(0, total - paid);
      if (outstanding > 0) {
        const sid = String(i.studentId || '');
        if (!sid) continue;
        if (!byStudent[sid]) byStudent[sid] = { amount: 0 };
        byStudent[sid].amount += outstanding;
      }
    }
    const list = Object.entries(byStudent).map(([sid, v]) => {
      const s = students.find(st => String(st.id) === sid) || {};
      return { id: sid, name: s.name || s.fullName || sid, className: s.class || '', amount: v.amount };
    });
    return list.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [students, invoices]);

  return (
    <Card header={<div className="flex items-center justify-between"><div className="text-base font-semibold">Top Debtors</div><button className="toggle-pill" onClick={() => { const url = new URL(window.location.toString()); url.searchParams.set('view', 'leaderboard-debtors'); window.history.pushState({}, '', url.toString()); }}>View full</button></div>}>
      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No debtors</div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
              <div>
                <div className="text-sm font-medium text-[#0F172A]">{r.name}</div>
                <div className="text-xs text-gray-500">{r.className}</div>
              </div>
              <div className="text-sm font-semibold">₦{r.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TopDebtorsQuickList;
