import React, { useEffect } from 'react';
import { Invoice, Payment, Student, SchoolSettings } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import SimpleReceipt from './SimpleReceipt'; 

interface BulkFinancialsPrintViewProps {
    type: 'invoice' | 'receipt';
    items: (Invoice | Payment)[];
    students: Map<string, Student>;
    invoices: Map<string, Invoice>;
    settings: SchoolSettings;
    onClose: () => void;
}

const BulkFinancialsPrintView: React.FC<BulkFinancialsPrintViewProps> = ({ type, items, students, invoices, settings, onClose }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const renderItem = (item) => {
        if (type === 'receipt') {
            const payment = item as Payment;
            const invoice = invoices.get(payment.invoiceId);
            const student = students.get(payment.studentId);
            if (!invoice || !student) return null;
            return <SimpleReceipt settings={settings} invoice={invoice} payment={payment} student={student} />;
        }
        // Add invoice template logic here if needed
        return null;
    };
    
    return (
        <div className="bg-gray-200">
            <div className="no-print p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-10">
                <button onClick={onClose} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back
                </button>
                <button onClick={() => window.print()} className="btn btn-primary">
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print
                </button>
            </div>
            <div className="printable-content">
                {items.map((item, index) => (
                    <div key={index} className="page-break my-4 mx-auto bg-white" style={{ width: '210mm' }}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkFinancialsPrintView;