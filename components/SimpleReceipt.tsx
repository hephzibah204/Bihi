import React from 'react';
import { SchoolSettings, Invoice, Payment, Student } from '../types';
import { formatDate } from '../utils/dateHelpers';

interface SimpleReceiptProps {
    settings: SchoolSettings;
    invoice: Invoice;
    payment: Payment;
    student: Student;
    compact?: boolean;
}

const SimpleReceipt: React.FC<SimpleReceiptProps> = ({ settings, invoice, payment, student, compact }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
    const amountDue = invoice.totalAmount - (invoice.amountPaid - payment.amount);
    const balance = amountDue - payment.amount;

    return (
        <div className="p-6 bg-white border border-gray-300 font-sans text-sm" style={{ width: compact ? '105mm' : '210mm' }}>
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-xl font-bold">{settings.schoolName}</h1>
                    <p className="text-gray-600 text-xs">{settings.schoolAddress}</p>
                </div>
                <img src={settings.schoolLogo || defaultLogo} alt="School Logo" className="w-16 h-16 rounded-full"/>
            </header>
            <div className="text-center my-4">
                <h2 className="text-lg font-semibold uppercase">Payment Receipt</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                    <p><strong>Billed To:</strong> {student.name}</p>
                    <p><strong>Class:</strong> {student.class}</p>
                    <p><strong>Invoice No:</strong> {invoice.id}</p>
                </div>
                <div className="text-right">
                    <p><strong>Receipt No:</strong> {payment.id}</p>
                    <p><strong>Date Paid:</strong> {formatDate(payment.paymentDate)}</p>
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-right">Amount (₦)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="p-2 border-b">Payment for {invoice.term} {invoice.session} Fees</td>
                        <td className="p-2 border-b text-right">{payment.amount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
             <div className="mt-4 flex justify-end">
                 <div className="w-1/2 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Amount Due Before Payment:</span> <span>{amountDue.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold"><span>Amount Paid:</span> <span>{payment.amount.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Balance Due:</span> <span>{balance.toLocaleString()}</span></div>
                 </div>
            </div>

            {/* Optional bank details footer */}
            {settings?.integrations && (settings.integrations.manual_bank_name || settings.integrations.manual_bank_account_number || settings.integrations.manual_bank_account_name) && (
                <div className="mt-6 pt-4 border-t text-xs text-gray-700">
                    <div className="font-semibold mb-1">School Bank Details</div>
                    <div className="grid grid-cols-1 gap-1">
                        {settings.integrations.manual_bank_name && (
                            <div>Bank: {settings.integrations.manual_bank_name}</div>
                        )}
                        {settings.integrations.manual_bank_account_name && (
                            <div>Account Name: {settings.integrations.manual_bank_account_name}</div>
                        )}
                        {settings.integrations.manual_bank_account_number && (
                            <div>Account Number: {settings.integrations.manual_bank_account_number}</div>
                        )}
                    </div>
                    {settings.integrations.manual_payment_instructions && (
                        <div className="mt-1">{settings.integrations.manual_payment_instructions}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimpleReceipt;