import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetInvoices, apiUpsertInvoice } from '../services/api';
import { Student, Invoice } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

const BursaryDiscounts = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsData, invoicesData] = await Promise.all([apiGetStudents(), apiGetInvoices()]);
            setStudents(studentsData);
            setInvoices(invoicesData);
            if (studentsData.length > 0) setSelectedStudentId(studentsData[0].id);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const unpaidInvoicesForStudent = invoices.filter(i => i.studentId === selectedStudentId && i.status !== 'paid');

    const handleApplyDiscount = async () => {
        if (!selectedInvoiceId || discountValue <= 0) {
            alert("Please select an invoice and enter a valid discount value.");
            return;
        }
        setIsSubmitting(true);
        try {
            const invoice = invoices.find(i => i.id === selectedInvoiceId);
            if (!invoice) throw new Error("Invoice not found.");

            let discountAmount = 0;
            let discountDescription = '';

            if (discountType === 'percentage') {
                discountAmount = (invoice.totalAmount * discountValue) / 100;
                discountDescription = `${reason || 'Discount'} (${discountValue}%)`;
            } else {
                discountAmount = discountValue;
                discountDescription = `${reason || 'Discount'}`;
            }

            const updatedInvoice = {
                ...invoice,
                items: [...invoice.items, { description: discountDescription, amount: -discountAmount }],
                totalAmount: invoice.totalAmount - discountAmount,
            };
            
            await apiUpsertInvoice(updatedInvoice);
            alert("Discount applied successfully!");
            // Refetch to update UI
            const invoicesData = await apiGetInvoices();
            setInvoices(invoicesData);
            // Reset form
            setSelectedInvoiceId('');
            setDiscountValue(0);
            setReason('');

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="card p-6 text-center">Loading...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Discounts & Waivers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">Select Student</label>
                        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="input-field">
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Select Unpaid Invoice</label>
                        <select value={selectedInvoiceId} onChange={e => setSelectedInvoiceId(e.target.value)} className="input-field" disabled={unpaidInvoicesForStudent.length === 0}>
                            <option value="">-- Select Invoice --</option>
                            {unpaidInvoicesForStudent.map(i => <option key={i.id} value={i.id}>{i.term} {i.session} (₦{(i.totalAmount - i.amountPaid).toLocaleString()})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Discount Type</label>
                        <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="input-field">
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₦)</option>
                        </select>
                    </div>
                    <div>
                         <label className="label">Value</label>
                        <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className="input-field" />
                    </div>
                     <div className="md:col-span-2">
                         <label className="label">Reason (Optional)</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input-field" placeholder="e.g., Scholarship, Sibling discount"/>
                    </div>
                </div>
                <div className="text-right mt-4">
                    <button onClick={handleApplyDiscount} className="btn btn-primary" disabled={isSubmitting || !selectedInvoiceId}>
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Apply Discount'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BursaryDiscounts;
