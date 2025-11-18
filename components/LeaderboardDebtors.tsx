import React, { useEffect, useMemo, useState } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetStudents } from '../services/api';

const LeaderboardDebtors: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const [s, inv, pay] = await Promise.all([apiGetStudents(), apiGetInvoices(), apiGetPayments()]);
      setStudents(s||[]); setInvoices(inv||[]); setPayments(pay||[]);
    } finally { setLoading(false); }
  })(); }, []);

  const rows = useMemo(() => {
    const byStudent: Record<string, { amount: number; lastPayment?: string }> = {};
    for (const i of invoices) {
      const sid = String(i.studentId||''); if (!sid) continue;
      const total = Number(i.totalAmount)||0; const paid = Number(i.amountPaid)||0; const outstanding = Math.max(0, total-paid);
      if (!byStudent[sid]) byStudent[sid] = { amount: 0 };
      byStudent[sid].amount += outstanding;
    }
    for (const p of payments) {
      const sid = String(p.studentId||''); if (!sid) continue;
      const ts = p.paymentDate ? new Date(p.paymentDate).getTime() : 0;
      if (!byStudent[sid]) byStudent[sid] = { amount: 0 };
      const prevTs = byStudent[sid].lastPayment ? new Date(byStudent[sid].lastPayment).getTime() : 0;
      if (ts && ts > prevTs) byStudent[sid].lastPayment = new Date(ts).toISOString();
    }
    const list = Object.entries(byStudent).map(([sid,v]) => {
      const st = students.find(x=>String(x.id)===sid)||{};
      return { id: sid, name: st.name||st.fullName||sid, className: st.class||'', amount: v.amount, lastPayment: v.lastPayment ? new Date(v.lastPayment).toLocaleDateString() : '-' };
    }).filter(r=>r.amount>0).sort((a,b)=>b.amount-a.amount);
    return list;
  }, [students, invoices, payments]);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Top Debtors</div>
        <div className="text-xs text-gray-500">Outstanding balance and last payment</div>
      </div>
      {loading ? (
        <div className="mt-3 text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="mt-3 overflow-x-auto border border-gray-200 rounded-3xl">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Class</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Outstanding</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.className}</td>
                  <td className="px-4 py-3">₦{r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{r.lastPayment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardDebtors;
