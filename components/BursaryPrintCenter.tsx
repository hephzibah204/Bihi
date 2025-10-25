import React from 'react';

const BursaryPrintCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Print Center</h1>
        <p className="text-sm text-gray-600 mt-1">
          Bulk print receipts, invoices, and payment reminders.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-gray-600">
          This module is under active development. For now, you can:
        </div>
        <ul className="list-disc list-inside mt-3 text-gray-700 space-y-1">
          <li>Filter students by class/session</li>
          <li>Select document type (receipt, invoice, reminder)</li>
          <li>Preview selected documents</li>
          <li>Export to PDF for printing</li>
        </ul>
        <div className="mt-4">
          <button className="btn btn-primary" disabled>
            Coming soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default BursaryPrintCenter;