import React, { useState } from 'react';
import Modal from './Modal';
import { useAI } from '../hooks/useAI';
import { generateResponse as aiGenerateResponse } from '../services/geminiAIService';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import { Invoice, Student } from '../types';
import { apiSendMessage } from '../services/api';

interface AIDebtReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    invoice: Invoice;
}

const AIDebtReminderModal: React.FC<AIDebtReminderModalProps> = ({ isOpen, onClose, student, invoice }) => {
    const { generateResponse, status } = useAI();
    const [tone, setTone] = useState('formal');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedMessage('');
        try {
            const prompt = `
                Generate a debt reminder message for a parent.
                - Student Name: ${student.name}
                - Amount Due: ₦${(invoice.totalAmount - invoice.amountPaid).toLocaleString()}
                - Due Date: ${invoice.dueDate}
                - Tone: ${tone}
                - Message should be concise and suitable for SMS or email.
            `;
            const result = await aiGenerateResponse(prompt);
            setGeneratedMessage(String(result));
        } catch (error) {
            const msg = (error as any)?.message || String(error);
            setGeneratedMessage(`Error: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!generatedMessage || !student.parentEmail) {
            alert("No message generated or no parent email found.");
            return;
        }
        setIsSending(true);
        try {
            await apiSendMessage({
                channel: 'email',
                content: generatedMessage,
                recipients: [student.parentEmail]
            });
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Reminder sent successfully!' } }));
            onClose();
        } catch (error) {
            alert(`Failed to send message: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Generate Debt Reminder for ${student.name}`}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="label">Tone</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field">
                        <option value="formal">Formal</option>
                        <option value="friendly">Friendly</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <button onClick={handleGenerate} className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Generating...' : 'Generate Message'}
                </button>

                {generatedMessage && (
                    <div className="mt-4">
                        <label className="label">Generated Message</label>
                        <textarea
                            className="input-field w-full"
                            rows={6}
                            value={generatedMessage}
                            readOnly
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => navigator.clipboard.writeText(generatedMessage)} className="btn btn-secondary">Copy</button>
                            <button onClick={handleSend} className="btn btn-primary" disabled={isSending}>
                                {isSending ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : null}
                                {isSending ? 'Sending...' : 'Send Email'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AIDebtReminderModal;
