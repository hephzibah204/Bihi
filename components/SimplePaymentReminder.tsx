import React from 'react';
import { SchoolSettings, Invoice } from '../types';
import { Student } from '../types';

interface SimplePaymentReminderProps {
  settings: SchoolSettings;
  invoice: Invoice;
  student: Student;
  compact?: boolean;
}

const SimplePaymentReminder: React.FC<SimplePaymentReminderProps> = ({ settings, invoice, student, compact }) => {
  const outstanding = Math.max(0, (invoice.totalAmount || 0) - (invoice.amountPaid || 0));
  const width = compact ? '105mm' : '210mm';
  return (
    <div className="p-6 bg-white border border-gray-300 font-sans text-sm" style={{ width }}>
      <div className="flex justify-between items-start pb-4 border-b">
        <div>
          <div className="text-xl font-bold">{settings.schoolName}</div>
          <div className="text-gray-600 text-xs">{settings.schoolAddress}</div>
        </div>
        <img src={settings.schoolLogo || 'https://i.imgur.com/gKEBi1f.png'} alt="School Logo" className="w-16 h-16 rounded-full" />
      </div>
      <div className="text-center my-4">
        <div className="text-lg font-semibold uppercase">Payment Reminder</div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <div><span className="font-semibold">To:</span> {student.name}</div>
          <div><span className="font-semibold">Class:</span> {student.class}</div>
          <div><span className="font-semibold">Invoice No:</span> {invoice.id}</div>
        </div>
        <div className="text-right">
          <div><span className="font-semibold">Session:</span> {invoice.session}</div>
          <div><span className="font-semibold">Term:</span> {invoice.term}</div>
          <div><span className="font-semibold">Due Date:</span> {invoice.dueDate}</div>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <p>
          This is a friendly reminder that school fees for the above invoice remain outstanding.
          The total billed amount is ₦{invoice.totalAmount.toLocaleString()} and payments received so far total ₦{invoice.amountPaid.toLocaleString()}.
        </p>
        <p className="font-semibold">Outstanding Balance: ₦{outstanding.toLocaleString()}</p>
        <p>
          Kindly settle the outstanding balance on or before the due date to avoid any disruption to academic activities.
          If payment has already been made, please disregard this notice.
        </p>
      </div>
      {settings?.integrations?.manual_bank_name && (
        <div className="mt-6 pt-4 border-t text-xs text-gray-700">
          <div className="font-semibold mb-1">School Bank Details</div>
          <div>Bank: {settings.integrations.manual_bank_name}</div>
          {settings.integrations.manual_bank_account_name && (<div>Account Name: {settings.integrations.manual_bank_account_name}</div>)}
          {settings.integrations.manual_bank_account_number && (<div>Account Number: {settings.integrations.manual_bank_account_number}</div>)}
          {settings.integrations.manual_payment_instructions && (<div className="mt-1">{settings.integrations.manual_payment_instructions}</div>)}
        </div>
      )}
      <div className="mt-6 text-xs text-center text-gray-600">
        <div>{settings.schoolMotto || ''}</div>
        {settings.reportCardSettings?.principalName && (
          <div>Principal: {settings.reportCardSettings.principalName}</div>
        )}
      </div>
    </div>
  );
};

export default SimplePaymentReminder;
