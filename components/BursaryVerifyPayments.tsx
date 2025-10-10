import React, { useState, useEffect } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetStudents, apiUpsertInvoice, apiUpsertPayment } from '../services/api';
import { Invoice, Payment, Student } from '../types';
import { formatDate } from '../utils/dateHelpers';
import Modal from './Modal';
import SpinnerIcon from '../icons/SpinnerIcon';

const BursaryVerifyPayments = () => {
    const [pending, setPending] = useState<{ invoice: Invoice, payment: Payment }[]>([]);
    const [students, setStudents] = useState<Map<string, Student>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [verifyingItem, setVerifyingItem] = useState<{ invoice: Invoice, payment: Payment } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allInvoices, allPayments, allStudents] = await Promise.all([
                apiGetInvoices(),
                apiGetPayments(),
                apiGetStudents()
            ]);
            
            const studentMap = new Map(allStudents.map(s => [s.id, s]));
            setStudents(studentMap);

            const pendingPayments = allPayments.filter(p => p.status === 'pending');
            const itemsToVerify = pendingPayments.map(payment => {
                const invoice = allInvoices.find(inv => inv.id === payment.invoiceId);
                return invoice ? { invoice, payment } : null;
            }).filter(Boolean);
            
            setPending(itemsToVerify);
        } catch (err) {
            setError('Failed to load payments for verification.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!verifyingItem) return;
        setIsProcessing(true);

        const { invoice, payment } = verifyingItem;
        
        try {
            if (action === 'approve') {
                const newAmountPaid = invoice.amountPaid + payment.amount;
                const newStatus = newAmountPaid >= invoice.totalAmount ? 'paid' : 'partially-paid';
                
                await Promise.all([
                    apiUpsertInvoice({ ...invoice, status: newStatus, amountPaid: newAmountPaid }),
                    apiUpsertPayment({ ...payment, status: 'verified' })
                ]);
            } else { // Reject
                await Promise.all([
                    apiUpsertInvoice({ ...invoice, status: invoice.amountPaid > 0 ? 'partially-paid' : 'unpaid' }),
                    // In a real app, you might delete the payment record. Here we'll just update it.
                    apiUpsertPayment({ ...payment, status: 'verified', amount: 0 }) // Effectively cancels it
                ]);
            }
            setVerifyingItem(null);
            fetchData(); // Refresh list
        } catch (err) {
            alert(`Action failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="card p-6 text-center"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/> Loading pending payments...</div>;

    return (
        <div className="card">
            <div className="p-6">
                 <h2 className="text-xl font-semibold">Verify Manual Payments</h2>
                 <p className="text-sm text-gray-500 mt-1">Review and approve payments made via bank transfer or other manual methods.</p>
                 <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr>
                            <th className="th">Student</th>
                            <th className="th">Invoice Date</th>
                            <th className="th text-right">Amount Paid (₦)</th>
                            <th className="th text-right">Actions</th>
                        </tr></thead>
                        <tbody>
                            {pending.length > 0 ? pending.map(item => (
                                <tr key={item.payment.id}>
                                    <td className="td font-medium">{students.get(item.invoice.studentId)?.name || 'Unknown'}</td>
                                    <td className="td">{formatDate(item.invoice.issueDate)}</td>
                                    <td className="td text-right font-mono">{item.payment.amount.toLocaleString()}</td>
                                    <td className="td text-right">
                                        <button onClick={() => setVerifyingItem(item)} className="btn btn-secondary text-sm">Review</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="td text-center">No payments are pending verification.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
            
            {verifyingItem && (
                <Modal isOpen={!!verifyingItem} onClose={() => setVerifyingItem(null)} title="Verify Payment">
                    <div className="p-6 space-y-4">
                        <div><label className="label">Student</label><p>{students.get(verifyingItem.invoice.studentId)?.name}</p></div>
                        <div><label className="label">Amount</label><p>₦{verifyingItem.payment.amount.toLocaleString()}</p></div>
                        <div><label className="label">Reference</label><p>{verifyingItem.payment.reference || 'Not provided'}</p></div>
                        <div>
                            <label className="label">Proof of Payment</label>
                            <a href={verifyingItem.payment.proofUrl} target="_blank" rel="noopener noreferrer">
                                <img src={verifyingItem.payment.proofUrl} alt="Proof of payment" className="max-w-full h-auto border rounded-md"/>
                            </a>
                        </div>
                         <div className="flex justify-end pt-4 space-x-2">
                            <button onClick={() => handleAction('reject')} disabled={isProcessing} className="btn btn-secondary bg-red-100 text-red-700">Reject</button>
                            <button onClick={() => handleAction('approve')} disabled={isProcessing} className="btn btn-primary bg-green-600">
                                {isProcessing && <SpinnerIcon className="w-4 h-4 mr-2 animate-spin"/>}
                                Approve
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BursaryVerifyPayments;