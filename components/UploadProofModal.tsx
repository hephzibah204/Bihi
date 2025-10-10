import React, { useState } from 'react';
import Modal from './Modal';
import { apiUpsertInvoice, apiUpsertPayment } from '../services/api';
import SpinnerIcon from './icons/SpinnerIcon';
import { Invoice } from '../types';

interface UploadProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice;
    studentId: string;
    onSuccess: () => void;
}

const UploadProofModal: React.FC<UploadProofModalProps> = ({ isOpen, onClose, invoice, studentId, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [reference, setReference] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!file || !reference) {
            setError('Please select a file and enter a payment reference.');
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            // In a real app, you would upload the file to a storage bucket (e.g., Supabase Storage)
            // and get a URL. Here, we'll simulate this.
            const simulatedProofUrl = 'https://i.imgur.com/3p3dF9c.png'; // Placeholder image

            const updatedInvoice = { ...invoice, status: 'pending-verification' as const };
            const newPayment = {
                id: `pay_manual_${Date.now()}`,
                invoiceId: invoice.id,
                studentId: studentId,
                amount: invoice.totalAmount - invoice.amountPaid,
                paymentDate: new Date().toISOString(),
                method: 'Bank Transfer' as const,
                reference,
                proofUrl: simulatedProofUrl,
                status: 'pending' as const,
            };

            await Promise.all([
                apiUpsertInvoice(updatedInvoice),
                apiUpsertPayment(newPayment)
            ]);
            
            onSuccess();
        } catch (err) {
            setError('Failed to submit proof. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload Proof of Payment">
            <div className="p-6 space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div>
                    <label className="label">Invoice For</label>
                    <p>{invoice.term} {invoice.session} - Amount: ₦{(invoice.totalAmount - invoice.amountPaid).toLocaleString()}</p>
                </div>
                <div>
                    <label className="label">Payment Receipt/Screenshot</label>
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="input-field" accept="image/*,.pdf"/>
                </div>
                <div>
                    <label className="label">Payment Reference (Optional)</label>
                    <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="input-field" placeholder="e.g., Teller number, transaction ID"/>
                </div>
                <div className="flex justify-end pt-2">
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                        {submitting && <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />}
                        {submitting ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UploadProofModal;