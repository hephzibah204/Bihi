import React, { useState } from 'react';
import Modal from './Modal';
import { apiUpsertInvoice, apiUpsertPayment, getTenantId } from '../services/api';
import SpinnerIcon from './icons/SpinnerIcon';
import { Invoice } from '../types';
import { supabase } from '../services/supabaseClient';

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
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setSubmitting(true);
        setError('');

        try {
            if (!supabase) throw new Error("Storage client is not available.");
            const tenantId = getTenantId();
            if (!tenantId) throw new Error("Could not determine tenant ID for file upload.");

            const filePath = `${tenantId}/payment-proofs/${studentId}/${Date.now()}-${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(filePath);

            const proofUrl = data.publicUrl;

            const updatedInvoice = { ...invoice, status: 'pending-verification' as const };
            const newPayment = {
                id: `pay_manual_${Date.now()}`,
                invoiceId: invoice.id,
                studentId: studentId,
                amount: invoice.totalAmount - invoice.amountPaid,
                paymentDate: new Date().toISOString(),
                method: 'Bank Transfer' as const,
                reference,
                proofUrl: proofUrl,
                status: 'pending' as const,
            };

            await Promise.all([
                apiUpsertInvoice(updatedInvoice),
                apiUpsertPayment(newPayment)
            ]);
            
            onSuccess();
        } catch (err) {
            setError(`Failed to submit proof: ${err.message}`);
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