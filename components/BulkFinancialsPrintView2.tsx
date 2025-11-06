import React, { useEffect, useMemo, useState } from 'react';
import { Invoice, Payment, Student, SchoolSettings } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import SimpleReceipt from './SimpleReceipt';
import SimpleInvoice from './SimpleInvoice';
import AnimatedCheckbox from './AnimatedCheckbox';

interface BulkFinancialsPrintViewProps {
    type: 'invoice' | 'receipt';
    items: (Invoice | Payment)[];
    students: Map<string, Student>;
    invoices: Map<string, Invoice>;
    settings: SchoolSettings;
    onClose: () => void;
}

const BulkFinancialsPrintView2: React.FC<BulkFinancialsPrintViewProps> = ({ type, items, students, invoices, settings, onClose }) => {
    const [compact, setCompact] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only print if component is still mounted and visible
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                window.print();
            }
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const renderItem = (item: Invoice | Payment) => {
        if (type === 'receipt') {
            const payment = item as Payment;
            const invoice = invoices.get(payment.invoiceId);
            const student = students.get(payment.studentId);
            if (!invoice || !student) return null;
            return <SimpleReceipt settings={settings} invoice={invoice} payment={payment} student={student} compact={compact} />;
        }
        if (type === 'invoice') {
            const invoice = item as Invoice;
            if (!invoice) return null;
            return <SimpleInvoice settings={settings} invoice={invoice} compact={compact} />;
        }
        return null;
    };

    const pairedItems = useMemo(() => {
        const pairs: (typeof items)[] = [] as any;
        for (let i = 0; i < items.length; i += 2) {
            pairs.push(items.slice(i, i + 2));
        }
        return pairs;
    }, [items]);

    return (
        <div className="bg-gray-200">
            <div className="no-print p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-10">
                <button onClick={onClose} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back
                </button>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <AnimatedCheckbox checked={compact} onChange={(e) => setCompact(e.target.checked)} />
                        <span>Paper Saver Mode (2 per page)</span>
                    </label>
                    <button onClick={() => window.print()} className="btn btn-primary">
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print
                    </button>
                </div>
            </div>
            <div className="printable-content">
                {!compact && items.map((item, index) => (
                    <div key={`single-${index}`} className="page-break my-4 mx-auto bg-white" style={{ width: '210mm' }}>
                        {renderItem(item)}
                    </div>
                ))}
                {compact && pairedItems.map((pair, idx) => (
                    <div key={`pair-${idx}`} className="page-break my-4 mx-auto bg-white" style={{ width: '210mm', padding: '6mm' }}>
                        <div className="flex gap-4">
                            <div style={{ width: '102mm' }}>
                                {pair[0] && renderItem(pair[0])}
                            </div>
                            <div style={{ width: '102mm' }}>
                                {pair[1] && renderItem(pair[1])}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkFinancialsPrintView2;