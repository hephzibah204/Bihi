import React, { useState } from 'react';
import Modal from './Modal';
import { apiUpsertInvoice, apiUpsertPayment } from '../services/api';
import SpinnerIcon from './icons/SpinnerIcon';
import { Invoice, Student } from '../types';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice;
    student: Student | undefined;
    onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, invoice, student, onSuccess }) => {
    const amountDue = invoice.totalAmount - invoice.amountPaid;
    const [amount, setAmount] = useState<number>(amountDue);
    const [method, setMethod] = useState<'Cash' | 'Bank Transfer' | 'Card'>('Cash');
    const [reference, setReference] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (amount <= 0) {
            setError('Payment amount must be greater than zero.');
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            const newAmountPaid = invoice.amountPaid + amount;
            const newStatus = newAmountPaid >= invoice.totalAmount ? 'paid' : 'partially-paid';
            
            const updatedInvoice = {
                ...invoice,
                amountPaid: newAmountPaid,
                // FIX: Explicitly cast the status to satisfy the strict Invoice['status'] type.
                status: newStatus as Invoice['status'],
            };

            const newPayment = {
                invoiceId: invoice.id,
                studentId: invoice.studentId,
                amount,
                paymentDate: new Date().toISOString(),
                method,
                reference,
                status: 'verified' as const,
                verifiedBy: 'Admin (Manual)',
            };
            
            await Promise.all([
                apiUpsertInvoice(updatedInvoice),
                apiUpsertPayment(newPayment)
            ]);

            onSuccess();
        } catch (err) {
            setError('Failed to record payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment for ${student?.name}`}>
            <div className="p-6 space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                    <label className="label">Invoice For</label>
                    <p>{invoice.term} {invoice.session}</p>
                    <p><strong>Amount Due:</strong> ₦{amountDue.toLocaleString()}</p>
                </div>
                <div>
                    <label className="label">Amount Paid</label>
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="input-field" max={amountDue} />
                </div>
                 <div>
                    <label className="label">Payment Method</label>
                    <select value={method} onChange={e => setMethod(e.target.value as any)} className="input-field">
                        <option>Cash</option>
                        <option>Bank Transfer</option>
                        <option>Card</option>
                    </select>
                </div>
                <div>
                    <label className="label">Reference (Optional)</label>
                    <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="input-field" placeholder="e.g., Teller no., staff name"/>
                </div>
                <div className="flex justify-end pt-2">
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                        {submitting && <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />}
                        {submitting ? 'Saving...' : 'Record Payment'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RecordPaymentModal;