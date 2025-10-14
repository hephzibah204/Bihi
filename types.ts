// This file defines shared TypeScript types and interfaces for the application.

// General & User Types
export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Super Admin' | 'Bursar';

export type DashboardView = 
  | 'dashboard' | 'students' | 'student-profile' | 'subjects' | 'results' 
  | 'report-cards' | 'comprehensive-entry' | 'promotions' | 'attendance' | 'settings'
  | 'bursary' | 'communications' | 'ai-tools' | 'analytics' | 'alumni' | 'staff'
  | 'parents' | 'timetable' | 'id-cards' | 'behavioral-remarks' | 'general-remarks'
  | 'help' | 'resource-hub' | 'billing' | 'more' | 'events' | 'absence-management'
  | 'platform-settings' | 'users' | 'pages' | 'menus' | 'blog-articles' | 'kb-articles';
  
export type TeacherView = 
  | 'dashboard' | 'my-students' | 'enter-scores' | 'my-schedule' | 'ai-tools'
  | 'resource-hub' | 'my-payslips' | 'help' | 'more' | 'assignments' | 'behavioral';
  
export type StudentView = 
  | 'dashboard' | 'results' | 'assignments' | 'timetable' | 'ai-tools'
  | 'profile' | 'notifications' | 'transcript' | 'ai-tutor';
  
export type ParentView = 
  | 'dashboard' | 'results' | 'fees' | 'attendance' | 'behavioral'
  | 'assignments' | 'messages' | 'profile' | 'events' | 'report-absence';

// Data Models
export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  dob?: string;
  gender?: 'Male' | 'Female';
  photo?: string;
  parentId?: string;
  parentEmail?: string;
  status?: 'active' | 'graduated' | 'alumni';
  graduationYear?: number;
  faceDescriptor?: number[];
  created_at?: string;
}

export interface Teacher {
  id: string;
  auth_id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: UserRole;
  classTeacherOf?: string;
  baseSalary?: number;
}

export interface Parent {
    id: string;
    name: string;
    email: string;
    phone?: string;
    auth_id?: string;
    pendingChanges?: Partial<Parent>;
}

export interface Subject {
  id: string;
  name: string;
  classes: string[];
}

export interface Score {
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
    date: string;
    remark: string;
    type: 'positive' | 'negative' | 'neutral';
}

export interface AttendanceRecord {
    date: string;
    class: string;
    statuses: Record<string, 'present' | 'absent' | 'late'>;
}

export interface Assignment {
    id: string;
    class: string;
    title: string;
    description: string;
    subjectId: string;
    dueDate: string;
    maxScore: number;
    type?: string;
}

export interface AssignmentScore {
    id: string;
    assignmentId: string;
    studentId: string;
    score: number;
    comment?: string;
}

// Financial Types
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
    allowances: { name: string, amount: number }[];
    deductions: { name: string, amount: number }[];
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


// Platform & Tenant Types
export interface Tenant {
    id: string;
    name: string;
    planId?: string;
    subscriptionStatus?: 'trial' | 'active' | 'expired' | 'unsubscribed';
    trialEndDate?: string;
    subscriptionExpiryDate?: string;
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

export interface ReportCardSkill {
    id: string;
    label: string;
}

export interface ClassSection {
    id: string;
    name: string;
}

export interface ClassLevel {
    id: string;
    name: string;
    classes: { id: string; name: string }[];
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress?: string;
  schoolLogo?: string;
  schoolType?: string;
  session: string;
  term: string;
  gradingSystem: { grade: string; from: number; to: number; remark: string }[];
  maxCa1: number;
  maxCa2: number;
  maxExam: number;
  reportCardSettings: {
    principalName: string;
    schoolMotto?: string;
    sections: { id: string; title: string; enabled: boolean }[];
    affectiveSkills: ReportCardSkill[];
    psychomotorSkills: ReportCardSkill[];
  };
  features?: Record<string, boolean>;
  schoolStructure?: {
      levels: ClassLevel[];
      sections: ClassSection[];
  };
  budgetSettings?: {
      session: string;
      term: string;
      categories: Record<string, number>;
  };
  integrations?: {
    paystack_public_key?: string;
    paystack_secret_key?: string; // Stored securely, not sent to client
    sms_api_key?: string; // Stored securely, not sent to client
    sms_sender_id?: string;
  }
}

export interface PlatformUser {
    id: string;
    email: string;
    role: string;
    lastLogin: string;
}

// Communication Types
export interface CommunicationLog {
    id: string;
    type: 'announcement' | 'reminder' | 'direct';
    channel: 'sms' | 'email';
    content: string;
    recipients: string[] | 'all';
    sentAt: string;
}

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    type: 'sms' | 'email';
}

export interface ScheduledReminder {
    id: string;
    name: string;
    type: 'overdue_fees';
    templateId: string;
    days_after_due: number;
    enabled: boolean;
}

export interface Conversation {
    id: string;
    otherParticipant: { id: string; name: string; role: UserRole };
    lastMessage: { content: string; timestamp: string };
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    recipientId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

// CMS & Landing Page Types
export interface MenuItem {
  id: string;
  label: string;
  url: string;
}

export interface Testimonial {
    id: string;
    quote: string;
    avatar: string;
    name: string;
    role: string;
    school: string;
}

export interface LandingPageContent {
  hero: { title: string; subtitle: string };
  problem: { title: string; points: string[]; extraText?: string };
  solution: { title: string; features: { icon: string; title: string; desc: string }[] };
  testimonials: { title: string; items: Testimonial[] };
  pricing: { title: string; subtitle: string };
  comparison: { title: string; features: { name: string; regular: string; reportsheet: string }[] };
  faq: { title: string; items: { q: string; a: string }[] };
  finalCta: { title: string; subtitle: string; tagline?: string };
  promoBanner?: { enabled: boolean; text: string; endDate: string };
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

export interface SharedLessonPlan {
    id: string;
    topic: string;
    subjectId: string;
    class: string;
    content: string;
    sharedByTeacherId: string;
    sharedByTeacherName: string;
    createdAt: string;
    upvotes: number;
}

export interface Event {
    id: string;
    date: string;
    title: string;
}

export interface AbsenceReport {
    id: string;
    studentId: string;
    reportedByParentId: string;
    date: string;
    reason: 'Sickness' | 'Family Emergency' | 'Other';
    details?: string;
    status: 'Pending' | 'Acknowledged';
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    user: string;
    type: string;
    description: string;
}