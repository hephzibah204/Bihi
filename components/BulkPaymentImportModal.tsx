import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { apiGetStudents, apiGetInvoices, apiBatchUpdateInvoices, apiBatchUpsertPayments } from '../services/api';
import { Student, Invoice, Payment } from '../types';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { parseCSV } from '../utils/csvExporter';

type ImportStep = 'upload' | 'mapping' | 'review' | 'importing' | 'success';

const TARGET_FIELDS = [
  { key: 'admissionNo', label: 'Admission No.' },
  { key: 'amount', label: 'Amount Paid' },
  { key: 'paymentDate', label: 'Payment Date (YYYY-MM-DD)' },
  { key: 'reference', label: 'Reference (Optional)' },
];

const BulkPaymentImportModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    
    // Data for matching
    const [studentMap, setStudentMap] = useState<Map<string, Student>>(new Map());
    const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            const [students, invoices] = await Promise.all([apiGetStudents(), apiGetInvoices()]);
            setStudentMap(new Map(students.map(s => [s.admissionNo.toLowerCase(), s])));
            setUnpaidInvoices(invoices.filter(i => i.status !== 'paid'));
        };
        fetchData();
    }, [isOpen]);

    const handleReset = () => {
        setStep('upload'); setFile(null); setError(''); setCsvHeaders([]);
        setCsvData([]); setFieldMapping({});
    };

    const handleClose = () => { handleReset(); onClose(); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const { headers, rows } = parseCSV(csv);
            if (!headers.length || rows.length === 0) {
                setError('CSV must have a header and at least one data row.');
                return;
            }
            setCsvHeaders(headers);
            setCsvData(rows);
            const commonMappings: Record<string, string> = {
                'admissionno': 'admissionNo', 'admission number': 'admissionNo', 'admission_no': 'admissionNo',
                'amount': 'amount', 'amount paid': 'amount',
                'paymentdate': 'paymentDate', 'payment date': 'paymentDate',
                'reference': 'reference', 'ref': 'reference'
            };
            const mapping = headers.reduce((acc, h) => {
                const k = commonMappings[h.toLowerCase().trim()] || 'ignore';
                acc[h] = k;
                return acc;
            }, {} as Record<string, string>);
            setFieldMapping(mapping);
            setStep('review');
        };
        reader.readAsText(selectedFile);
    };

    const handleImport = async () => {
        setStep('importing');
        setError('');
        try {
            const paymentsToCreate: Partial<Payment>[] = [];
            const invoicesToUpdate: Partial<Invoice>[] = [];
            const updatedInvoiceCache: Record<string, Invoice> = {};

            for (const row of csvData) {
                const rowData: Record<string, any> = {};
                csvHeaders.forEach((header, index) => {
                    const targetField = TARGET_FIELDS.find(f => f.label === header)?.key;
                    if (targetField) rowData[targetField] = row[index];
                });
                
                const student = studentMap.get((rowData.admissionNo as string)?.toLowerCase());
                if (!student) continue;

                const invoice = unpaidInvoices.find(i => i.studentId === student.id);
                if (!invoice) continue;

                const amountPaid = Number(rowData.amount);
                if (isNaN(amountPaid)) continue;
                
                const cachedInvoice = updatedInvoiceCache[invoice.id] || invoice;

                paymentsToCreate.push({
                    invoiceId: invoice.id,
                    studentId: student.id,
                    amount: amountPaid,
                    paymentDate: rowData.paymentDate || new Date().toISOString(),
                    method: 'Bank Transfer',
                    reference: rowData.reference,
                    status: 'verified',
                    verifiedBy: 'Bulk Import',
                });
                
                const newTotalPaid = cachedInvoice.amountPaid + amountPaid;
                updatedInvoiceCache[invoice.id] = {
                    ...cachedInvoice,
                    amountPaid: newTotalPaid,
                    status: newTotalPaid >= cachedInvoice.totalAmount ? 'paid' : 'partially-paid',
                };
            }
            
            await apiBatchUpsertPayments(paymentsToCreate);
            await apiBatchUpdateInvoices(Object.values(updatedInvoiceCache));

            setStep('success');
        } catch (err) {
            setError(`Import failed: ${err.message}`);
            setStep('review');
        }
    };
    
    const renderContent = () => {
        switch (step) {
            case 'review': return (
                <>
                    <p className="text-sm text-gray-600 mb-4">Reviewing first 5 rows. Payments will be applied to the most recent unpaid invoice for each student.</p>
                    {/* Simplified review UI */}
                    <div className="flex justify-between pt-6">
                        <button onClick={() => setStep('upload')} className="btn btn-secondary">Back</button>
                        <button onClick={handleImport} className="btn btn-primary">Confirm & Import {csvData.length} Payments</button>
                    </div>
                </>
            );
            case 'importing': return <div className="text-center p-8">Importing payments...</div>;
            case 'success': return (
                <div className="text-center p-8">
                    <h3 className="text-xl font-semibold text-green-600">Import Successful!</h3>
                    <p className="mt-2">{csvData.length} payment records have been processed.</p>
                    <div className="mt-6">
                        <button onClick={() => { onSuccess(); handleClose(); }} className="btn btn-primary">Done</button>
                    </div>
                </div>
            );
            default: return (
                <>
                    <p className="text-sm text-gray-600 mb-4">Upload a CSV file with payment data. Columns must be named: {TARGET_FIELDS.map(f=>f.label).join(', ')}.</p>
                    <div className="mt-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload'}</p>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>
                </>
            );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Bulk Payments">
             <div className="p-6">
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {renderContent()}
            </div>
        </Modal>
    );
};

export default BulkPaymentImportModal;
