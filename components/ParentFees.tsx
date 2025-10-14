import React, { useState, useEffect } from 'react';
import { apiGetInvoices, apiGetStudents, apiGetSchoolSettings, apiUpsertInvoice, apiUpsertPayment } from '../services/api';
import { Invoice, Student, SchoolSettings, Payment } from '../types';
import { formatDate } from '../utils/dateHelpers';
import UploadProofModal from './UploadProofModal';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const ParentFees = ({ demoUserId }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [student, setStudent] = useState<Student | null>(null);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const fetchData = async () => {
        if (!demoUserId) { setLoading(false); setError("Student profile not selected."); return; }
        setLoading(true);
        setError('');
        try {
            const [invoicesData, studentsData, settingsData] = await Promise.all([apiGetInvoices(), apiGetStudents(), apiGetSchoolSettings()]);
            const currentStudent = studentsData.find(s => s.id === demoUserId);
            if (!currentStudent) throw new Error("Student profile not found.");
            
            setStudent(currentStudent);
            setSettings(settingsData);
            setInvoices(invoicesData.filter(i => i.studentId === demoUserId).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
        } catch (err) {
            setError("Could not load fee information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [demoUserId]);

    const handlePayNow = (invoice: Invoice) => {
        const paystackKey = settings?.paystackPublicKey;
        if (!window.PaystackPop || !paystackKey || !student?.parentEmail) {
            setSelectedInvoice(invoice);
            setUploadModalOpen(true);
            return;
        }
        
        const amountDue = (invoice.totalAmount - invoice.amountPaid) * 100; // in kobo

        const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: student.parentEmail,
            amount: amountDue,
            ref: `inv_${invoice.id.slice(0, 8)}_${Date.now()}`,
            onClose: () => {},
            callback: async (response) => {
                if (response.status === 'success') {
                    const newPayment: Partial<Payment> = {
                        invoiceId: invoice.id,
                        studentId: student.id,
                        amount: amountDue / 100,
                        paymentDate: new Date().toISOString(),
                        method: 'Card',
                        reference: response.reference,
                        status: 'verified',
                        verifiedBy: 'Paystack',
                    };
                    const updatedInvoice: Invoice = {
                        ...invoice,
                        amountPaid: invoice.totalAmount,
                        status: 'paid',
                    };
                    await Promise.all([apiUpsertPayment(newPayment), apiUpsertInvoice(updatedInvoice)]);
                    alert('Payment successful!');
                    fetchData();
                } else {
                    alert('Payment failed. Please try again.');
                }
            }
        });
        handler.openIframe();
    };
    
    const getStatusChip = (status: Invoice['status']) => {
        const classMap = {
            paid: 'bg-green-100 text-green-800', 'partially-paid': 'bg-yellow-100 text-yellow-800',
            unpaid: 'bg-red-100 text-red-800', overdue: 'bg-red-200 text-red-900',
            'pending-verification': 'bg-blue-100 text-blue-800',
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classMap[status]}`}>{status.replace('-', ' ')}</span>;
    };


    if (loading) return <div className="card p-6 text-center">Loading fee details...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    return (
        <div>
            {invoices.length === 0 ? (
                <div className="card p-6 text-center text-gray-500">No invoices have been issued for {student?.name}.</div>
            ) : (
                invoices.map(invoice => (
                    <div key={invoice.id} className="card mb-4">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between md:items-center">
                                <div>
                                    <h3 className="text-lg font-bold">{invoice.term} {invoice.session}</h3>
                                    <p className="text-sm text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                                </div>
                                <div className="mt-2 md:mt-0">{getStatusChip(invoice.status)}</div>
                            </div>
                            <div className="mt-4 border-t pt-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span>Total Fees:</span> <span className="font-mono">₦{invoice.totalAmount.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Amount Paid:</span> <span className="font-mono">₦{invoice.amountPaid.toLocaleString()}</span></div>
                                <div className="flex justify-between font-bold text-base"><span>Amount Due:</span> <span className="font-mono">₦{(invoice.totalAmount - invoice.amountPaid).toLocaleString()}</span></div>
                            </div>
                            {invoice.status !== 'paid' && (
                                <div className="mt-4 text-right">
                                    <button onClick={() => handlePayNow(invoice)} className="btn btn-primary">
                                        Pay ₦{(invoice.totalAmount - invoice.amountPaid).toLocaleString()} Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
            {selectedInvoice && student && (
                <UploadProofModal 
                    isOpen={isUploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    invoice={selectedInvoice}
                    studentId={student.id}
                    onSuccess={() => { setUploadModalOpen(false); fetchData(); }}
                />
            )}
        </div>
    );
};

export default ParentFees;