import React from 'react';
import { DashboardView } from '../types';
import { ADMIN_VIEWS } from '../utils/constants';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import PrinterIcon from './icons/PrinterIcon';

interface PrintCenterProps {
  setActiveView: (view: DashboardView) => void;
}

const Card = ({ title, desc, icon, onClick }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} className="p-5 bg-white rounded-xl shadow-sm border border-gray-200 text-left hover:shadow-md transition">
    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="mt-3 font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-gray-600">{desc}</p>
  </button>
);

const PrintCenter: React.FC<PrintCenterProps> = ({ setActiveView }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Print Center</h1>
        <p className="text-sm text-gray-600 mt-1">Quick access to bulk printing tools.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          title="Report Cards"
          desc="Generate and print student report cards (per class)."
          icon={<DocumentArrowDownIcon className="w-6 h-6" />}
          onClick={() => setActiveView(ADMIN_VIEWS.REPORT_CARDS as DashboardView)}
        />
        <Card
          title="ID Cards"
          desc="Bulk print student and staff ID cards."
          icon={<IdentificationIcon className="w-6 h-6" />}
          onClick={() => setActiveView(ADMIN_VIEWS.ID_CARDS as DashboardView)}
        />
        <Card
          title="Finance (Receipts/Invoices)"
          desc="Bulk print bursary documents like receipts and invoices."
          icon={<PrinterIcon className="w-6 h-6" />}
          onClick={() => { try { localStorage.setItem('bursaryInitialTab', 'print-center'); } catch {} setActiveView(ADMIN_VIEWS.BURSARY as DashboardView); }}
        />
      </div>
    </div>
  );
};

export default PrintCenter;
