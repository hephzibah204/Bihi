// Financial and Billing Types

export interface Invoice {
  id: string;
  studentId: string;
  class: string;
  session: string;
  term: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  status: 'paid' | 'partially-paid' | 'unpaid' | 'overdue' | 'pending-verification';
  items: { description: string; amount: number }[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  method: 'Cash' | 'Bank Transfer' | 'Card';
  reference?: string;
  status: 'pending' | 'verified' | 'failed';
  proofUrl?: string;
  verifiedBy?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: 'Operational' | 'Maintenance' | 'Supplies' | 'Utilities' | 'Other' | 'payroll';
  amount: number;
}

export interface Income {
  id: string;
  date: string;
  description: string;
  category: 'Donation' | 'Grant' | 'Fundraising' | 'Other';
  amount: number;
}

export interface FeeStructure {
  id: string;
  name: string;
  session: string;
  term: string;
  applicableClasses: string[];
  items: { description: string; amount: number }[];
  totalAmount: number;
}

export interface Payslip {
  teacherId: string;
  teacherName: string;
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  runDate: string;
  totalNet: number;
  payslips: Payslip[];
}