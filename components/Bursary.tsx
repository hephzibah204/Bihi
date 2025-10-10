import React, { useState, PropsWithChildren } from 'react';
import BursaryDashboard from './BursaryDashboard';
import BursaryFees from './BursaryFees';
import BursaryInvoice from './BursaryInvoice';
import BursaryDebtors from './BursaryDebtors';
import BursaryExpenses from './BursaryExpenses';
import BursaryReports from './BursaryReports';
import BursaryScratchCards from './BursaryScratchCards';
import PayrollDashboard from './PayrollDashboard';
import BursaryVerifyPayments from './BursaryVerifyPayments';
import BursaryDiscounts from './BursaryDiscounts';

const Bursary = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const TabButton = ({ view, children }: PropsWithChildren<{ view: string }>) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === view ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {children}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <BursaryDashboard />;
            case 'fees': return <BursaryFees />;
            case 'invoices': return <BursaryInvoice />;
            case 'debtors': return <BursaryDebtors />;
            case 'expenses': return <BursaryExpenses />;
            case 'verify': return <BursaryVerifyPayments />;
            case 'discounts': return <BursaryDiscounts />;
            case 'payroll': return <PayrollDashboard />;
            case 'reports': return <BursaryReports />;
            case 'scratch-cards': return <BursaryScratchCards />;
            default: return <BursaryDashboard />;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                <TabButton view="dashboard">Dashboard</TabButton>
                <TabButton view="fees">Fee Setup</TabButton>
                <TabButton view="invoices">Invoices</TabButton>
                <TabButton view="debtors">Debtors</TabButton>
                <TabButton view="verify">Verify Payments</TabButton>
                <TabButton view="expenses">Expenses</TabButton>
                <TabButton view="discounts">Discounts</TabButton>
                <TabButton view="payroll">Payroll</TabButton>
                <TabButton view="reports">Reports</TabButton>
                <TabButton view="scratch-cards">Scratch Cards</TabButton>
            </div>
            {renderContent()}
        </div>
    );
};

export default Bursary;
