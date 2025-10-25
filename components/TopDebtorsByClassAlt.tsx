import React, { useEffect, useState } from 'react';
import { apiGetInvoices, apiGetSchoolSettings, apiGetStudents } from '../services/api';
import { Student, Invoice } from '../types';
import SkeletonLoader from './SkeletonLoader';
import { formatNGN } from '../utils/currency';

type ClassDebt = { className: string; outstanding: number };

const currency = (n: number) => formatNGN(n);

const TopDebtorsByClassAlt: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState<string>('');
  const [rows, setRows] = useState<ClassDebt[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settings, invoices, students] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetInvoices(),
          apiGetStudents(),
        ]);

        const currentTerm = settings?.currentTerm || settings?.term || 'Current Term';
        const currentSession = settings?.currentSession || settings?.session || '';
        setLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        const filtered: Invoice[] = (invoices || []).filter(inv => {
          if (inv.session && currentSession && inv.session !== currentSession) return false;
          if (inv.term && currentTerm && inv.term !== currentTerm) return false;
          return Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0)) > 0;
        });

        const studentMap = new Map<string, Student>((students || []).map(s => [s.id, s]));
        const byClass = new Map<string, number>();
        filtered.forEach(inv => {
          const stu = studentMap.get(inv.studentId);
          const className = inv.class || stu?.class || 'Unknown';
          const owed = Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0));
          if (owed > 0) {
            byClass.set(className, (byClass.get(className) || 0) + owed);
          }
        });

        const rowsList: ClassDebt[] = Array.from(byClass.entries())
          .map(([className, outstanding]) => ({ className, outstanding }))
          .sort((a, b) => b.outstanding - a.outstanding)
          .slice(0, 10);

        setRows(rowsList);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Top Debtors by Class</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">No outstanding invoices for the selected period.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.className} className="flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-700 dark:text-gray-200">{row.className}</span>
              <span className="text-gray-800 dark:text-gray-100">{currency(row.outstanding)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopDebtorsByClassAlt;