// types.ts

export type DashboardView = string;
export type TeacherView = string;
export type StudentView = string;
export type ParentView = string;
export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Bursar' | 'SuperAdmin';
export type PlatformRole = 'SuperAdmin' | 'Content Editor' | 'Blog Author';

export interface Student {
  id: string;
  name: string;
  class: string;
  admissionNo: string;
  gender: 'Male' | 'Female';
  dob?: string;
  photo?: string;
  parentId?: string;
  parentEmail?: string;
  status?: 'active' | 'graduated' | 'left' | 'alumni';
  graduationYear?: number;
  faceDescriptor?: number[];
}

export interface Teacher {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  role: UserRole;
  classTeacherOf?: string;
  baseSalary?: number;
  allowances?: { name: string; amount: number }[];
  deductions?: { name: string; amount: number }[];
  enableAutoTax?: boolean;
  enableAutoPension?: boolean;
}

export interface Parent {
    id: string;
    auth_id?: string;
    name: string;
    email: string;
}

export interface Subject {
  id: string;
  name: string;
  classes: string[];
}

export interface Score {
  id: string;
  studentId: string;
  subjectId: string;
  session: string;
  term: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  comment?: string;
}

export interface Remark {
    id: string;
    studentId: string;
    session: string;
    term: string;
    generalComment?: string;
    affectiveRatings?: Record<string, number>;
    psychomotorRatings?: Record<string, number>;
}

export interface BehavioralLogEntry {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  type: 'positive' | 'negative' | 'neutral';
  remark: string;
}

export interface Grading {
  grade: string;
  from: number;
  to: number;
  remark: string;
}

export interface ReportCardSkill {
    id: string;
    label: string;
}

export interface ReportCardSection {
    id: string;
    title: string;
    enabled: boolean;
}

export interface FeatureControls {
    teacher?: Record<string, boolean>;
    student?: Record<string, boolean>;
    parent?: Record<string, boolean>;
}

export interface SchoolSettings {
  id: number;
  tenant_id: string;
  schoolName: string;
  schoolAddress: string;
  schoolLogo?: string;
  schoolType: 'nursery_primary' | 'secondary' | 'all';
  session: string;
  term: 'First Term' | 'Second Term' | 'Third Term';
  maxCa1: number;
  maxCa2: number;
  maxExam: number;
  gradingSystem: Grading[];
  reportCardSettings: {
      principalName: string;
      schoolMotto: string;
      sections: ReportCardSection[];
      affectiveSkills: ReportCardSkill[];
      psychomotorSkills: ReportCardSkill[];
  };
  paystackPublicKey?: string;
  featureControls?: FeatureControls;
  // Fix: Add optional planId to allow it to be stored in school settings.
  planId?: string;
}

export interface Plan {
    id: string;
    name: string;
    description?: string;
    price_monthly: number;
    price_termly: number;
    price_yearly: number;
    features: {
        maxStudents: number;
        [key: string]: boolean | number;
    };
}

export interface Tenant {
    id: string;
    name: string;
    planId?: string;
    subscriptionStatus: 'trial' | 'active' | 'expired' | 'unsubscribed';
    trialEndDate?: string;
    subscriptionExpiryDate?: string;
}

export interface MenuItem {
    id: string;
    label: string;
    url: string;
}

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    school: string;
    quote: string;
    avatar: string;
}

export interface LandingPageContent {
    hero: { title: string; subtitle: string };
    problem: { title: string; points: string[]; extraText?: string };
    solution: { title: string; features: { icon: string; title: string; desc: string }[] };
    comparison: { title: string; features: { name: string; regular: string; reportsheet: string }[] };
    testimonials: { title: string; items: Testimonial[] };
    pricing: { title: string; subtitle: string };
    faq: { title: string; items: { q: string; a: string }[] };
    finalCta: { title: string; subtitle: string; tagline?: string };
    promoBanner?: { enabled: boolean; text: string; endDate: string };
}

export interface Assignment {
    id: string;
    class: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    type?: string;
    scoreInfo?: AssignmentScore;
}

export interface AssignmentScore {
    id: string;
    assignmentId: string;
    studentId: string;
    score: number;
    comment?: string;
    submittedAt: string;
}

export interface Conversation {
    id: string;
    otherParticipant: { id: string; name: string };
    lastMessage: { content: string; timestamp: string };
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface PlatformUser {
    id: string;
    email: string;
    role: PlatformRole;
    lastLogin: string;
}

export interface Page {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published';
    lastUpdated: string;
    metaTitle?: string;
    metaDescription?: string;
}

export interface InvoiceItem {
    id: string;
    description: string;
    amount: number;
}

export interface Invoice {
    id: string;
    studentId: string;
    class: string;
    session: string;
    term: string;
    issueDate: string;
    dueDate: string;
    items: InvoiceItem[];
    totalAmount: number;
    amountPaid: number;
    status: 'paid' | 'unpaid' | 'partially-paid' | 'pending-verification' | 'overdue';
}

export interface Payment {
    id: string;
    invoiceId: string;
    studentId: string;
    amount: number;
    paymentDate: string;
    method: 'Paystack' | 'Bank Transfer' | 'Cash';
    reference: string;
    proofUrl?: string;
    status: 'verified' | 'pending';
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: 'payroll' | 'utilities' | 'supplies' | 'other';
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
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    payslips: Payslip[];
}

export interface SharedLessonPlan {
  id: string;
  topic: string;
  class: string;
  subjectId: string;
  content: string;
  sharedByTeacherId: string;
  sharedByTeacherName: string;
  upvotes: number;
  createdAt: string;
}

export interface Discount {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    applicableTo: 'all' | string[]; // 'all' or array of class names
}