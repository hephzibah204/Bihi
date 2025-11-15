import React, { useState, useEffect, useMemo } from 'react';
import { apiGetInvoices, apiUpsertInvoice, apiGetStudents, apiGetScores } from '../services/api';
import { Invoice, Student, Score } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { formatDate } from '../utils/dateHelpers';
import RecordPaymentModal from './RecordPaymentModal';
import UploadProofModal from './UploadProofModal';
import BulkPaymentImportModal from './BulkPaymentImportModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import AIDebtReminderModal from './AIDebtReminderModal';
import SendSummarySmsModal from './SendSummarySmsModal';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';
import FileUpload from './FileUpload';
import FileList from './FileList';
import { getTenantId } from '../services/api';

const BursaryInvoice = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isRecordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
    const [isUploadProofModalOpen, setUploadProofModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isAIReminderModalOpen, setAIReminderModalOpen] = useState(false);
    const [isSmsModalOpen, setSmsModalOpen] = useState(false);
    const [isAttachmentsOpen, setAttachmentsOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const fetchData = async () => {
        setLoading(true);
        const [invoicesData, studentsData, scoresData] = await Promise.all([apiGetInvoices(), apiGetStudents(), apiGetScores()]);
        setInvoices(invoicesData.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()));
        setStudents(studentsData);
        setScores(scoresData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleCreateInvoice = async (invoiceData: Partial<Invoice>) => {
        const newInvoice = {
            id: `inv_${Date.now()}`,
            amountPaid: 0,
            status: 'unpaid' as const,
            ...invoiceData,
        };
        await apiUpsertInvoice(newInvoice);
        fetchData();
        setCreateModalOpen(false);
    };

    const getStatusChip = (status: Invoice['status']) => {
        const classMap = {
            paid: 'bg-green-100 text-green-800',
            'partially-paid': 'bg-yellow-100 text-yellow-800',
            unpaid: 'bg-red-100 text-red-800',
            overdue: 'bg-red-200 text-red-900',
            'pending-verification': 'bg-blue-100 text-blue-800',
        };
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classMap[status]}`}>{status.replace('-', ' ')}</span>;
    };

    const renderContent = () => {
        if (loading) return <TableSkeleton cols={4} />;
        if (invoices.length === 0) {
            return <EmptyState message="No invoices have been created yet." actionText="Create First Invoice" onAction={() => setCreateModalOpen(true)} />;
        }
        return (
            <div className="table-container">
                <table className="table">
                    <thead><tr><th className="th">Student</th><th className="th">Term</th><th className="th">Amount (₦)</th><th className="th">Status</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody>
                        {invoices.map(invoice => {
                            const student = studentMap.get(invoice.studentId);
                            return (
                                <tr key={invoice.id}>
                                    <td className="td font-medium">{student?.name || 'N/A'}</td>
                                    <td className="td">{invoice.term} {invoice.session}</td>
                                    <td className="td font-mono">{invoice.totalAmount.toLocaleString()}</td>
                                    <td className="td">{getStatusChip(invoice.status)}</td>
                                    <td className="td text-right space-x-1">
                                         <button onClick={() => { setSelectedInvoice(invoice); setRecordPaymentModalOpen(true); }} className="btn btn-secondary text-xs">Record Payment</button>
                                         <button onClick={() => { setSelectedInvoice(invoice); setSmsModalOpen(true); }} className="btn btn-secondary text-xs">Send SMS</button>
                                         <button onClick={() => { setSelectedInvoice(invoice); setAIReminderModalOpen(true); }} className="btn btn-secondary text-xs">AI Reminder</button>
                                         <button onClick={() => { setSelectedInvoice(invoice); setAttachmentsOpen(true); }} className="btn btn-secondary text-xs">Attachments</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end gap-2 mb-4">
                 <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary"><ArrowUpTrayIcon className="w-5 h-5 mr-2" /> Import Payments</button>
                <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Create Invoice</button>
            </div>
            
            {renderContent()}

            {isCreateModalOpen && <CreateInvoiceModal students={students} onClose={() => setCreateModalOpen(false)} onSave={handleCreateInvoice} />}
            
            {isRecordPaymentModalOpen && selectedInvoice && (
                <RecordPaymentModal 
                    isOpen={isRecordPaymentModalOpen}
                    onClose={() => setRecordPaymentModalOpen(false)}
                    invoice={selectedInvoice}
                    student={studentMap.get(selectedInvoice.studentId)}
                    onSuccess={() => { setRecordPaymentModalOpen(false); fetchData(); }}
                />
            )}
            
            {isImportModalOpen && <BulkPaymentImportModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={fetchData} />}

            {isSmsModalOpen && selectedInvoice && (
                <SendSummarySmsModal
                    isOpen={isSmsModalOpen}
                    onClose={() => setSmsModalOpen(false)}
                    student={studentMap.get(selectedInvoice.studentId)}
                    scores={scores}
                    invoices={invoices}
                />
            )}
            {isAIReminderModalOpen && selectedInvoice && (
                <AIDebtReminderModal
                    isOpen={isAIReminderModalOpen}
                    onClose={() => setAIReminderModalOpen(false)}
                    student={studentMap.get(selectedInvoice.studentId)}
                    invoice={selectedInvoice}
                />
            )}

            {isAttachmentsOpen && selectedInvoice && (
                <Modal isOpen={true} onClose={() => setAttachmentsOpen(false)} title="Invoice Attachments">
                    <div className="p-6 space-y-4">
                        <FileUpload tenantId={getTenantId() || ''} linkedType="invoice" linkedId={String(selectedInvoice.id)} category="invoice_attachment" label="Upload Attachment" />
                        <FileList tenantId={getTenantId() || ''} linkedType="invoice" linkedId={String(selectedInvoice.id)} title="Files" />
                    </div>
                </Modal>
            )}
        </div>
    );
};

const CreateInvoiceModal = ({ students, onClose, onSave }) => {
    const [formData, setFormData] = useState({ studentId: '', class: '', session: '2023/2024', term: 'First Term', issueDate: new Date().toISOString().split('T')[0], dueDate: '', totalAmount: 0, items: [{description: 'School Fees', amount: 0}] });

    const handleChange = e => {
        const { name, value } = e.target;
        if (name === 'studentId') {
            const student = students.find(s => s.id === value);
            setFormData(prev => ({ ...prev, [name]: value, class: student?.class || '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        const totalAmount = newItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        setFormData(prev => ({...prev, items: newItems, totalAmount }));
    };

    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Create New Invoice">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Student</label><select name="studentId" value={formData.studentId} onChange={handleChange} className="input-field" required><option value="">-- Select Student --</option>{students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select></div>
                <div><label className="label">Amount</label><input type="number" value={formData.items[0].amount} onChange={e => handleItemChange(0, 'amount', e.target.value)} className="input-field" required /></div>
                <div><label className="label">Due Date</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input-field" required /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Create Invoice</button></div>
            </form>
        </Modal>
    )
}

export default BursaryInvoice;
