import React, { useEffect, useMemo, useState } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetSchoolSettings, apiGetStudents } from '../services/api';
import { Invoice, Payment, Student } from '../types';
import AIDebtReminderModal from './AIDebtReminderModal';
import SkeletonLoader from './SkeletonLoader';
import { exportToCSV } from '../utils/csvExporter';

type RiskRow = {
  student: Student;
  invoice: Invoice;
  outstanding: number;
  daysOverdue: number;
  riskProfile: 'High' | 'Medium' | 'Low';
  riskScore: number;
};

const currency = (n: number) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString()}`;
  }
};

const HighPriorityDebtorsWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>('');
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<{ student: Student; invoice: Invoice } | null>(null);

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

        const filtered = (invoices || []).filter(inv => {
          if (inv.session && currentSession && inv.session !== currentSession) return false;
          if (inv.term && currentTerm && inv.term !== currentTerm) return false;
          return Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0)) > 0;
        });

        const studentMap = new Map<string, Student>((students || []).map(s => [s.id, s]));

        const byStudent = new Map<string, Invoice[]>();
        filtered.forEach(inv => {
          const list = byStudent.get(inv.studentId) || [];
          list.push(inv);
          byStudent.set(inv.studentId, list);
        });

        const nowTs = Date.now();
        const computeRow = (inv: Invoice, stu: Student): RiskRow => {
          const owed = Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0));
          const dueTs = new Date(inv.dueDate).getTime();
          const daysOverdue = isFinite(dueTs) ? Math.max(0, Math.floor((nowTs - dueTs) / (1000 * 60 * 60 * 24))) : 0;
          // Simple risk scoring
          const riskScore = (owed) + (daysOverdue * 5000) + (inv.status === 'overdue' ? 50000 : 0) + (inv.status === 'partially-paid' ? 20000 : 0);
          const riskProfile: RiskRow['riskProfile'] = riskScore >= 200000 || daysOverdue >= 30 || inv.status === 'overdue'
            ? 'High'
            : (riskScore >= 80000 || daysOverdue >= 7 ? 'Medium' : 'Low');
          return { student: stu, invoice: inv, outstanding: owed, daysOverdue, riskScore, riskProfile };
        };

        const rowsList: RiskRow[] = Array.from(byStudent.entries()).map(([studentId, invs]) => {
          const stu = studentMap.get(studentId);
          if (!stu) return null as any;
          // Pick the invoice with maximum (owed + overdue weight)
          const best = invs
            .map(inv => computeRow(inv, stu))
            .sort((a, b) => b.riskScore - a.riskScore)[0];
          return best;
        }).filter(Boolean);

        rowsList.sort((a, b) => b.riskScore - a.riskScore);
        setRows(rowsList.slice(0, 6));
      } catch (e) {
        console.error('Failed to load high-priority debtors', e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const riskChip = (risk: RiskRow['riskProfile']) => {
    switch (risk) {
      case 'High': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">High</span>;
      case 'Medium': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Medium</span>;
      case 'Low': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Low</span>;
      default: return null;
    }
  };

  const onRemind = (row: RiskRow) => {
    setSelected({ student: row.student, invoice: row.invoice });
    setModalOpen(true);
  };

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">High-Priority Debtors</h3>
          <div className="flex items-center gap-3">
            <button
              className="btn btn-secondary h-8 text-sm"
              onClick={() => exportToCSV(rows.map(r => ({
                Student: r.student.name,
                Class: r.student.class,
                Outstanding: Math.round(r.outstanding),
                DaysOverdue: r.daysOverdue,
                Status: r.invoice.status || ''
              })), 'high-priority-debtors.csv')}
              disabled={loading || rows.length === 0}
            >
              Export CSV
            </button>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
        {loading ? (
          <div className="mt-4 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <SkeletonLoader className="h-4 w-48 mb-2" />
                  <SkeletonLoader className="h-3 w-64" />
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonLoader className="h-5 w-16 rounded-full" />
                  <SkeletonLoader className="h-8 w-28 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2">
            <ul className="space-y-2">
              {rows.length === 0 && (
                <li className="text-sm text-gray-500">No outstanding balances.</li>
              )}
              {rows.map(row => (
                <li key={`${row.student.id}-${row.invoice.id}`} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-medium truncate">{row.student.name} <span className="text-gray-500">• {row.student.class}</span></div>
                    <div className="text-[12px] text-gray-600">Owed {currency(row.outstanding)} • {row.daysOverdue} days overdue</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {riskChip(row.riskProfile)}
                    <button className="btn btn-secondary" onClick={() => onRemind(row)} disabled={!row.student.parentEmail}>Send Reminder</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selected && (
        <AIDebtReminderModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          student={selected.student}
          invoice={selected.invoice}
        />
      )}
    </div>
  );
};

export default HighPriorityDebtorsWidget;