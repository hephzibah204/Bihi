import React from 'react';
import { SchoolSettings, Payslip } from '../types';
import { formatDate } from '../utils/dateHelpers';

interface PayslipTemplateProps {
    schoolSettings: SchoolSettings;
    payslip: Payslip;
    payPeriod: string;
}

const PayslipTemplate: React.FC<PayslipTemplateProps> = ({ schoolSettings, payslip, payPeriod }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";

    return (
        <div className="report-card-layout p-8 bg-white font-sans text-sm" style={{ width: '210mm', minHeight: '148.5mm' }}>
            <header className="flex justify-between items-start pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold">{schoolSettings.schoolName}</h1>
                    <p className="text-gray-600">{schoolSettings.schoolAddress}</p>
                </div>
                <img src={schoolSettings.schoolLogo || defaultLogo} alt="School Logo" className="w-20 h-20 rounded-full"/>
            </header>
            <div className="text-center my-4">
                <h2 className="text-xl font-semibold">Employee Payslip</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                    <p><strong>Employee:</strong> {payslip.teacherName}</p>
                    <p><strong>Pay Period:</strong> {payPeriod}</p>
                </div>
                <div>
                    <p><strong>Payment Date:</strong> {formatDate(new Date().toISOString())}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-lg border-b pb-1 mb-2">Earnings</h3>
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>Base Salary</span><span>{payslip.baseSalary.toLocaleString()}</span></div>
                        {payslip.allowances.map(allowance => (
                            <div key={allowance.name} className="flex justify-between">
                                <span>{allowance.name}</span><span>{allowance.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg border-b pb-1 mb-2">Deductions</h3>
                     <div className="space-y-1">
                        {payslip.deductions.map(deduction => (
                            <div key={deduction.name} className="flex justify-between">
                                <span>{deduction.name}</span><span>({deduction.amount.toLocaleString()})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 border-t-2 pt-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Gross Pay</p>
                        <p className="font-bold text-lg">₦{payslip.grossPay.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Total Deductions</p>
                        <p className="font-bold text-lg">₦{payslip.totalDeductions.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-green-100 text-green-800 rounded">
                        <p className="text-sm font-semibold">Net Pay</p>
                        <p className="font-extrabold text-2xl">₦{payslip.netPay.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayslipTemplate;