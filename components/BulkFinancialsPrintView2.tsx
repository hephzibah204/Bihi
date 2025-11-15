import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Invoice, Payment, Student, SchoolSettings } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import SimpleReceipt from './SimpleReceipt';
import SimpleInvoice from './SimpleInvoice';
import SimplePaymentReminder from './SimplePaymentReminder';
import AnimatedCheckbox from './AnimatedCheckbox';

interface BulkFinancialsPrintViewProps {
    type: 'invoice' | 'receipt' | 'reminder';
    items: (Invoice | Payment)[];
    students: Map<string, Student>;
    invoices: Map<string, Invoice>;
    settings: SchoolSettings;
    onClose: () => void;
}

const BulkFinancialsPrintView2: React.FC<BulkFinancialsPrintViewProps> = ({ type, items, students, invoices, settings, onClose }) => {
    const [compact, setCompact] = useState(false);
    const [perPage, setPerPage] = useState<2 | 4 | 6 | 8>(2);
    const [autoDensity, setAutoDensity] = useState(true);
    const sampleRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only print if component is still mounted and visible
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                window.print();
            }
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (type !== 'reminder') return;
        if (!compact) return;
        if (!autoDensity) return;
        const h = sampleRef.current?.clientHeight || 0;
        let next: 2 | 4 | 6 | 8 = 8;
        if (h > 700) next = 2; else if (h > 520) next = 4; else if (h > 400) next = 6; else next = 8;
        setPerPage(next);
    }, [type, compact, autoDensity, items]);

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
        if (type === 'reminder') {
            const invoice = item as Invoice;
            const student = students.get(invoice.studentId);
            if (!invoice || !student) return null;
            return <SimplePaymentReminder settings={settings} invoice={invoice} student={student} compact={compact} />;
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

    const reminderPages = useMemo(() => {
        if (type !== 'reminder') return [] as (typeof items)[];
        const pages: (typeof items)[] = [] as any;
        const step = perPage as number;
        for (let i = 0; i < items.length; i += step) {
            pages.push(items.slice(i, i + step));
        }
        return pages;
    }, [items, perPage, type]);

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
                        <span>Paper Saver Mode</span>
                    </label>
                    {type === 'reminder' && compact && (
                        <div className="flex items-center gap-2">
                            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value) as any)} className="border rounded-md px-2 py-1 text-sm">
                                <option value={2}>2 per page</option>
                                <option value={4}>4 per page</option>
                                <option value={6}>6 per page</option>
                                <option value={8}>8 per page</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm">
                                <AnimatedCheckbox checked={autoDensity} onChange={(e) => setAutoDensity(e.target.checked)} />
                                <span>Auto</span>
                            </label>
                        </div>
                    )}
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
                {compact && type !== 'reminder' && pairedItems.map((pair, idx) => (
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
                {compact && type === 'reminder' && reminderPages.map((page, pidx) => {
                    const rows = Math.max(1, Math.floor((perPage as number) / 2));
                    const left = page.slice(0, rows);
                    const right = page.slice(rows, rows * 2);
                    return (
                        <div key={`rem-page-${pidx}`} className="page-break my-4 mx-auto bg-white" style={{ width: '210mm', padding: '6mm' }}>
                            <div className="flex gap-4">
                                <div style={{ width: '102mm' }}>
                                    {left.map((it, i) => (
                                        <div key={`l-${i}`} className="mb-4">
                                            {renderItem(it)}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ width: '102mm' }}>
                                    {right.map((it, i) => (
                                        <div key={`r-${i}`} className="mb-4">
                                            {renderItem(it)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {type === 'reminder' && compact && items[0] && (
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '102mm' }} ref={sampleRef}>
                        {renderItem(items[0])}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkFinancialsPrintView2;
