import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Student, Score, Invoice } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import { apiSendMessage } from '../services/api';

interface SendSummarySmsModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    scores: Score[];
    invoices: Invoice[];
}

const SendSummarySmsModal: React.FC<SendSummarySmsModalProps> = ({ isOpen, onClose, student, scores, invoices }) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const generateSummary = () => {
            const latestScores = scores
                .filter(s => s.studentId === student.id)
                .slice(-5); // Get last 5 subjects for brevity
            
            const academicSummary = latestScores.length > 0
                ? `Recent scores: ${latestScores.map(s => `${s.subjectId.substring(0,3)}:${(s.ca1||0)+(s.ca2||0)+(s.exam||0)}`).join(', ')}.`
                : 'Academic records can be viewed on the portal.';
            
            const outstandingInvoice = invoices.find(i => i.studentId === student.id && i.status !== 'paid');
            const financialSummary = outstandingInvoice
                ? `Outstanding fees: NGN${(outstandingInvoice.totalAmount - outstandingInvoice.amountPaid).toLocaleString()}.`
                : 'Fees are up to date.';

            setMessage(`Dear Parent of ${student.name} (${student.class}), Summary: ${academicSummary} ${financialSummary} Thank you, School Admin.`);
        };

        generateSummary();
    }, [isOpen, student, scores, invoices]);

    const handleSend = async () => {
        if (!message || !student.parentEmail) { // Using parentEmail which is often phone for SMS in Nigeria
            alert("No message or parent contact info found.");
            return;
        }
        setLoading(true);
        try {
            await apiSendMessage({
                channel: 'sms',
                content: message,
                recipients: [student.parentEmail]
            });
            alert("SMS sent successfully!");
            onClose();
        } catch (error) {
            alert(`Failed to send SMS: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send SMS Summary to ${student.name}'s Parent`}>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">Preview the SMS message below. Character count: {message.length}</p>
                <textarea
                    className="input-field w-full"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex justify-end">
                    <button onClick={handleSend} className="btn btn-primary" disabled={loading}>
                        {loading && <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />}
                        {loading ? 'Sending...' : 'Send SMS'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SendSummarySmsModal;