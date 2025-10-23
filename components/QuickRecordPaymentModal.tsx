import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { apiGetStudents, apiGetInvoices, apiUpsertInvoice, apiUpsertPayment } from '../services/api';
import type { Student, Invoice } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface QuickRecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickRecordPaymentModal: React.FC<QuickRecordPaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'Cash' | 'Bank Transfer' | 'Card'>('Cash');
  const [reference, setReference] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([apiGetStudents(), apiGetInvoices()])
      .then(([studs, invs]) => {
        setStudents(studs);
        setInvoices(invs);
      })
      .catch(err => console.error('QuickRecordPayment: fetch failed', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q)
    );
  }, [students, query]);

  const studentInvoices = useMemo(() => {
    if (!studentId) return [];
    return invoices
      .filter(inv => inv.studentId === studentId)
      .sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, studentId]);

  const selectedInvoice = useMemo(() => studentInvoices.find(inv => inv.id === invoiceId) || null, [studentInvoices, invoiceId]);

  useEffect(() => {
    if (selectedInvoice) {
      const due = Math.max(0, selectedInvoice.totalAmount - selectedInvoice.amountPaid);
      setAmount(due);
    } else {
      setAmount(0);
    }
  }, [selectedInvoice]);

  const handleSubmit = async () => {
    if (!studentId) { setError('Select a student.'); return; }
    if (!selectedInvoice) { setError('Select an invoice for the student.'); return; }
    if (amount <= 0) { setError('Amount must be greater than zero.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const newAmountPaid = selectedInvoice.amountPaid + amount;
      const newStatus = newAmountPaid >= selectedInvoice.totalAmount ? 'paid' : 'partially-paid';
      const updatedInvoice: Invoice = { ...selectedInvoice, amountPaid: newAmountPaid, status: newStatus as Invoice['status'] };

      const newPayment = {
        invoiceId: selectedInvoice.id,
        studentId: selectedInvoice.studentId,
        amount,
        paymentDate: new Date().toISOString(),
        method,
        reference,
        status: 'verified' as const,
        verifiedBy: 'Admin (Manual)'
      };

      await Promise.all([
        apiUpsertInvoice(updatedInvoice),
        apiUpsertPayment(newPayment)
      ]);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('QuickRecordPayment: submit failed', err);
      setError('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <div className="p-6 space-y-4">
        {loading && <div className="flex items-center text-sm text-gray-500"><SpinnerIcon className="w-4 h-4 animate-spin mr-2"/> Loading data...</div>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="label">Search Student</label>
          <input className="input-field" placeholder="Type name, admission no., or class" value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        <div>
          <label className="label">Student</label>
          <select className="input-field" value={studentId} onChange={e => { setStudentId(e.target.value); setInvoiceId(''); }}>
            <option value="">-- Select Student --</option>
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Invoice</label>
          <select className="input-field" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} disabled={!studentId}>
            <option value="">-- Select Invoice --</option>
            {studentInvoices.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.term} {inv.session} • Due ₦{(inv.totalAmount - inv.amountPaid).toLocaleString()}</option>
            ))}
          </select>
          {!studentId && <p className="text-xs text-gray-500 mt-1">Select a student first.</p>}
          {studentId && studentInvoices.length === 0 && <p className="text-xs text-gray-500 mt-1">No invoice found for this student.</p>}
        </div>

        <div>
          <label className="label">Amount</label>
          <input type="number" className="input-field" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        </div>

        <div>
          <label className="label">Method</label>
          <select className="input-field" value={method} onChange={e => setMethod(e.target.value as any)}>
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>Card</option>
          </select>
        </div>

        <div>
          <label className="label">Reference (optional)</label>
          <input type="text" className="input-field" value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g., Teller no., staff name" />
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting || loading}>
            {submitting && <SpinnerIcon className="w-5 h-5 animate-spin mr-2"/>}
            {submitting ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickRecordPaymentModal;