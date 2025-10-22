import React, { useState, useEffect, useMemo } from 'react';
import { apiGetPayments, apiUpsertPayment, apiGetInvoices, apiUpsertInvoice, apiGetStudents } from '../services/api';
import { Payment, Invoice, Student } from '../types';
import { formatDate } from '../utils/dateHelpers';
import Modal from './Modal';
import SpinnerIcon from './icons/SpinnerIcon';
import TableSkeleton from './skeletons/TableSkeleton';
import BulkFinancialsPrintView from './BulkFinancialsPrintView2';
import { useTenant } from '../contexts/TenantContext';
import PrinterIcon from './icons/PrinterIcon';
import AnimatedCheckbox from './AnimatedCheckbox';

const BursaryVerifyPayments = () => {
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [invoices, setInvoices] = useState<Map<string, Invoice>>(new Map());
    const [students, setStudents] = useState<Map<string, Student>>(new Map());
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [viewingProof, setViewingProof] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'pending' | 'verified' | 'all'>('pending');
    const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
    const [isPrintView, setIsPrintView] = useState(false);
    const { settings } = useTenant();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [paymentsData, invoicesData, studentsData] = await Promise.all([
                apiGetPayments(),
                apiGetInvoices(),
                apiGetStudents(),
            ]);
            setAllPayments(paymentsData.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
            setInvoices(new Map(invoicesData.map(i => [i.id, i])));
            setStudents(new Map(studentsData.map(s => [s.id, s])));
        } catch (error) {
            console.error("Failed to load data for verification:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const filteredPayments = useMemo(() => {
        if (filterStatus === 'all') return allPayments;
        return allPayments.filter(p => p.status === filterStatus);
    }, [allPayments, filterStatus]);

    const handleVerify = async (payment: Payment) => {
        setVerifyingId(payment.id);
        try {
            const invoice = invoices.get(payment.invoiceId);
            if (!invoice) throw new Error("Associated invoice not found.");

            // Update payment status
            const updatedPayment = { ...payment, status: 'verified' as const, verifiedBy: 'Admin' };
            await apiUpsertPayment(updatedPayment);

            // Update invoice status and amount paid
            const newAmountPaid = invoice.amountPaid + payment.amount;
            const newStatus = newAmountPaid >= invoice.totalAmount ? 'paid' : 'partially-paid';
            const updatedInvoice = { ...invoice, amountPaid: newAmountPaid, status: newStatus as any };
            await apiUpsertInvoice(updatedInvoice);
            
            fetchData();

        } catch (error) {
            alert(`Failed to verify payment: ${error.message}`);
        } finally {
            setVerifyingId(null);
        }
    };
    
    const handleSelectPayment = (paymentId: string, isSelected: boolean) => {
        setSelectedPayments(prev => {
            const newSet = new Set(prev);
            isSelected ? newSet.add(paymentId) : newSet.delete(paymentId);
            return newSet;
        });
    };

    if (loading) return <TableSkeleton cols={5} />;
    
    if (isPrintView) {
        return (
            <BulkFinancialsPrintView
                type="receipt"
                items={allPayments.filter(p => selectedPayments.has(p.id))}
                students={students}
                invoices={invoices}
                settings={settings}
                onClose={() => setIsPrintView(false)}
            />
        );
    }

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Verify & Manage Payments</h2>
                     <div className="flex items-center gap-2">
                        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                            <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'pending' ? 'bg-white shadow' : ''}`}>Pending</button>
                            <button onClick={() => setFilterStatus('verified')} className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'verified' ? 'bg-white shadow' : ''}`}>Verified</button>
                            <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-sm rounded-md ${filterStatus === 'all' ? 'bg-white shadow' : ''}`}>All</button>
                        </div>
                        <button onClick={() => setIsPrintView(true)} className="btn btn-secondary" disabled={selectedPayments.size === 0}>
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Print ({selectedPayments.size})
                        </button>
                    </div>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th w-12"></th>
                                <th className="th">Student</th>
                                <th className="th text-right">Amount (₦)</th>
                                <th className="th">Reference</th>
                                <th className="th">Date Paid</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map(payment => {
                                const student = students.get(payment.studentId);
                                const isVerifying = verifyingId === payment.id;
                                return (
                                    <tr key={payment.id}>
                                         <td className="td">
                                            {payment.status === 'verified' && (
                                                <AnimatedCheckbox
                                                    checked={selectedPayments.has(payment.id)}
                                                    onChange={(e) => handleSelectPayment(payment.id, e.target.checked)}
                                                />
                                            )}
                                        </td>
                                        <td className="td font-medium">{student?.name || 'N/A'}</td>
                                        <td className="td text-right font-mono">{payment.amount.toLocaleString()}</td>
                                        <td className="td">{payment.reference}</td>
                                        <td className="td">{formatDate(payment.paymentDate)}</td>
                                        <td className="td text-right space-x-2">
                                            {payment.proofUrl && (
                                                <button onClick={() => setViewingProof(payment.proofUrl)} className="btn btn-secondary text-sm">View Proof</button>
                                            )}
                                            {payment.status === 'pending' && (
                                                <button onClick={() => handleVerify(payment)} disabled={isVerifying} className="btn btn-primary text-sm">
                                                    {isVerifying ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : 'Verify'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                             {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="td text-center text-gray-500">No {filterStatus} payments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={!!viewingProof} onClose={() => setViewingProof(null)} title="Payment Proof" size="lg">
                <div className="p-4">
                    <img src={viewingProof} alt="Proof of payment" className="max-w-full h-auto mx-auto" />
                </div>
            </Modal>
        </div>
    );
};

export default BursaryVerifyPayments;