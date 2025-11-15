import React, { useEffect, useMemo, useState } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetStudents } from '../services/api';
import { Invoice, Payment, Student } from '../types';
import BulkFinancialsPrintView from './BulkFinancialsPrintView2';
import { useTenant } from '../contexts/TenantContext';
import TableSkeleton from './skeletons/TableSkeleton';
import AnimatedCheckbox from './AnimatedCheckbox';
import PrinterIcon from './icons/PrinterIcon';

type DocType = 'receipt' | 'invoice' | 'reminder';

const BursaryPrintCenter: React.FC = () => {
  const [docType, setDocType] = useState<DocType>('receipt');
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Map<string, Student>>(new Map());
  const [invoicesMap, setInvoicesMap] = useState<Map<string, Invoice>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [classFilter, setClassFilter] = useState<string>('');
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [isPrintView, setIsPrintView] = useState(false);
  const [reminderMode, setReminderMode] = useState<'letter' | 'invoice'>('letter');
  const { settings } = useTenant();

  useEffect(() => {
    const fn = async () => {
      setLoading(true);
      try {
        const [invoices, payments, studentsList] = await Promise.all([
          apiGetInvoices(),
          apiGetPayments(),
          apiGetStudents(),
        ]);
        setAllInvoices(invoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
        setAllPayments(payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
        setStudents(new Map(studentsList.map(s => [s.id, s])));
        setInvoicesMap(new Map(invoices.map(i => [i.id, i])));
      } catch (e) {
        console.error('Failed to load print center data', e);
      } finally {
        setLoading(false);
      }
    };
    fn();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [docType, classFilter, sessionFilter]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.class) set.add(s.class); });
    return Array.from(set).sort();
  }, [students]);

  const sessionOptions = useMemo(() => {
    const set = new Set<string>();
    allInvoices.forEach(inv => { if (inv.session) set.add(inv.session); });
    return Array.from(set).sort();
  }, [allInvoices]);

  const filteredPayments = useMemo(() => {
    const base = allPayments.filter(p => p.status === 'verified');
    return base.filter(p => {
      const student = students.get(p.studentId);
      const invoice = invoicesMap.get(p.invoiceId);
      if (classFilter && student?.class !== classFilter) return false;
      if (sessionFilter && invoice?.session !== sessionFilter) return false;
      return true;
    });
  }, [allPayments, students, invoicesMap, classFilter, sessionFilter]);

  const filteredInvoices = useMemo(() => {
    const base = allInvoices.filter(inv => {
      if (docType === 'reminder') return inv.status !== 'paid';
      return true;
    });
    return base.filter(inv => {
      if (sessionFilter && inv.session !== sessionFilter) return false;
      if (classFilter && inv.class !== classFilter) return false;
      return true;
    });
  }, [allInvoices, docType, classFilter, sessionFilter]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = new Set<string>();
    if (docType === 'receipt') filteredPayments.forEach(p => ids.add(p.id));
    else filteredInvoices.forEach(i => ids.add(i.id));
    setSelectedIds(ids);
  };

  const clearSelection = () => setSelectedIds(new Set());

  if (loading) return <TableSkeleton cols={5} />;

  if (isPrintView) {
    return (
      <BulkFinancialsPrintView
        type={docType === 'receipt' ? 'receipt' : (docType === 'reminder' && reminderMode === 'letter' ? 'reminder' : 'invoice')}
        items={docType === 'receipt' ? filteredPayments.filter(p => selectedIds.has(p.id)) : filteredInvoices.filter(i => selectedIds.has(i.id))}
        students={students}
        invoices={invoicesMap}
        settings={settings}
        onClose={() => setIsPrintView(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Print Center</h1>
        <p className="text-sm text-gray-600 mt-1">Bulk print receipts, invoices, and payment reminders.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 p-1 rounded-lg">
              <button onClick={() => setDocType('receipt')} className={`px-3 py-1.5 text-sm rounded-md ${docType === 'receipt' ? 'bg-white shadow' : ''}`}>Receipts</button>
              <button onClick={() => setDocType('invoice')} className={`px-3 py-1.5 text-sm rounded-md ${docType === 'invoice' ? 'bg-white shadow' : ''}`}>Invoices</button>
              <button onClick={() => setDocType('reminder')} className={`px-3 py-1.5 text-sm rounded-md ${docType === 'reminder' ? 'bg-white shadow' : ''}`}>Reminders</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Class</label>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
                <option value="">All</option>
                {classOptions.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Session</label>
              <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
                <option value="">All</option>
                {sessionOptions.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className="btn btn-secondary">Select All</button>
            <button onClick={clearSelection} className="btn btn-secondary">Clear</button>
            <button onClick={() => setIsPrintView(true)} className="btn btn-primary" disabled={selectedIds.size === 0}>
              <PrinterIcon className="w-5 h-5 mr-2" />
              Print ({selectedIds.size})
            </button>
          </div>
        </div>

        {docType === 'reminder' && (
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-gray-200 p-1 rounded-lg">
              <button onClick={() => setReminderMode('letter')} className={`px-3 py-1.5 text-sm rounded-md ${reminderMode === 'letter' ? 'bg-white shadow' : ''}`}>Letter Mode</button>
              <button onClick={() => setReminderMode('invoice')} className={`px-3 py-1.5 text-sm rounded-md ${reminderMode === 'invoice' ? 'bg-white shadow' : ''}`}>Invoice Mode</button>
            </div>
            <span className="text-xs text-gray-500">Use Letter Mode to print payment reminder letters. Paper Saver is available in the print view.</span>
          </div>
        )}

        <div className="table-container mt-4">
          <table className="table">
            <thead>
              <tr>
                <th className="th w-12"></th>
                {docType === 'receipt' ? (
                  <>
                    <th className="th">Student</th>
                    <th className="th text-right">Amount (₦)</th>
                    <th className="th">Reference</th>
                    <th className="th">Date Paid</th>
                  </>
                ) : (
                  <>
                    <th className="th">Invoice ID</th>
                    <th className="th">Class</th>
                    <th className="th">Session</th>
                    <th className="th">Term</th>
                    <th className="th text-right">Total (₦)</th>
                    <th className="th text-right">Paid (₦)</th>
                    <th className="th">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {docType === 'receipt' && filteredPayments.map(p => {
                const student = students.get(p.studentId);
                return (
                  <tr key={p.id}>
                    <td className="td">
                      <AnimatedCheckbox checked={selectedIds.has(p.id)} onChange={(e) => toggleSelect(p.id, e.target.checked)} />
                    </td>
                    <td className="td font-medium">{student?.name || 'N/A'}</td>
                    <td className="td text-right font-mono">{p.amount.toLocaleString()}</td>
                    <td className="td">{p.reference}</td>
                    <td className="td">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {docType !== 'receipt' && filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="td">
                    <AnimatedCheckbox checked={selectedIds.has(inv.id)} onChange={(e) => toggleSelect(inv.id, e.target.checked)} />
                  </td>
                  <td className="td font-mono">{inv.id}</td>
                  <td className="td">{inv.class}</td>
                  <td className="td">{inv.session}</td>
                  <td className="td">{inv.term}</td>
                  <td className="td text-right font-mono">{inv.totalAmount?.toLocaleString?.() || 0}</td>
                  <td className="td text-right font-mono">{inv.amountPaid?.toLocaleString?.() || 0}</td>
                  <td className="td">
                    <span className={`px-2 py-1 rounded text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{String(inv.status).toUpperCase()}</span>
                  </td>
                </tr>
              ))}
              {docType === 'receipt' && filteredPayments.length === 0 && (
                <tr>
                  <td className="td text-center text-gray-500" colSpan={5}>No matching payments found.</td>
                </tr>
              )}
              {docType !== 'receipt' && filteredInvoices.length === 0 && (
                <tr>
                  <td className="td text-center text-gray-500" colSpan={8}>No matching invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BursaryPrintCenter;
