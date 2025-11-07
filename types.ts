// This file defines shared TypeScript types and interfaces for the application.

// General & User Types
export type UserRole =
  | 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Super Admin' | 'Bursar'
  | 'Editor' | 'Author' | 'Content Manager' | 'Moderator' | 'Support';

// Feature Control Types
export interface ControllableFeature {
  key: string;
  name: string;
  description: string;
  applicableRoles: string[];
  category: string;
}

export type DashboardView = 
  | 'dashboard' | 'students' | 'student-profile' | 'subjects' | 'results' 
  | 'report-cards' | 'broadsheet' | 'comprehensive-entry' | 'promotions' | 'attendance' | 'settings'
  | 'bursary' | 'communications' | 'ai-tools' | 'analytics' | 'alumni' | 'staff'
  | 'parents' | 'timetable' | 'id-cards' | 'behavioral-remarks' | 'general-remarks'
  | 'help' | 'resource-hub' | 'billing' | 'more' | 'events' | 'absence-management'
  | 'platform-settings' | 'users' | 'pages' | 'menus' | 'blog-articles' | 'kb-articles';
  
export type TeacherView = 
  | 'dashboard' | 'my-students' | 'enter-scores' | 'my-schedule' | 'ai-tools'
  | 'resource-hub' | 'my-payslips' | 'help' | 'more' | 'assignments' | 'behavioral' | 'broadsheet';
  
export type StudentView = 
  | 'dashboard' | 'results' | 'assignments' | 'timetable' | 'ai-tools'
  | 'profile' | 'notifications' | 'transcript' | 'ai-tutor';
  
export type ParentView = 
  | 'dashboard' | 'results' | 'fees' | 'attendance' | 'behavioral'
  | 'assignments' | 'messages' | 'profile' | 'events' | 'report-absence';

// Data Models
export interface ClassHistoryItem {
  session: string;
  term: string;
  class: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  classHistory?: ClassHistoryItem[]; // optional historical records to make report viewer promotion-aware
  dob?: string;
  gender?: 'Male' | 'Female';
  photo?: string;
  address?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  siblings?: string[];
  status?: 'active' | 'graduated' | 'alumni' | 'inactive' | 'transferred';
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
  subjects?: string[];
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
  title?: string;
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
    // Ratings by skill id (1-5)
    affectiveRatings?: Record<string, number>;
    psychomotorRatings?: Record<string, number>;
    cognitiveRatings?: Record<string, number>;
    // Per-student toggles to include sections in the report
    useAffective?: boolean;
    usePsychomotor?: boolean;
    useCognitive?: boolean;
    // Per-student custom skills (in addition to defaults from settings)
    customAffectiveSkills?: ReportCardSkill[];
    customPsychomotorSkills?: ReportCardSkill[];
    customCognitiveSkills?: ReportCardSkill[];
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
  amount?: number;
  balanceRemaining?: number;
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
    createdAt?: string;
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
    // Optional metrics populated in admin analytics contexts
    userCount?: number;
    monthlyRevenue?: number;
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
  // Timetable configuration
  timetable?: {
    startTime?: string; // e.g., '08:00'
    periodMinutes?: number; // default 40
    maxTeachingPeriods?: number; // default 8
    fridayMaxTeachingPeriods?: number; // default 6
    breakCount?: 0 | 1 | 2; // default 1
    firstBreakAfter?: number; // period index after which to insert first break (e.g., 3)
    firstBreakMinutes?: number; // default 15
    secondBreakAfter?: number; // optional, default 6
    secondBreakMinutes?: number; // default 15
    workDays?: string[]; // default Mon-Fri
  };
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
    // Optional: Next term date shown in Classic footer
    nextTermBeginsDate?: string;
    sections: { id: string; title: string; enabled: boolean }[];
    affectiveSkills: ReportCardSkill[];
    psychomotorSkills: ReportCardSkill[];
    cognitiveSkills?: ReportCardSkill[];
    // Classic template configuration (visibility, layout, theme)
    classicOptions?: {
      showLogo?: boolean;
      showStudentPhoto?: boolean;
      showAttendance?: boolean;
      showAffective?: boolean;
      showPsychomotor?: boolean;
      showGradeScale?: boolean;
      showPerformance?: boolean;
      showGradeAnalysis?: boolean;
      showRatingIndices?: boolean;
      summariesLocation?: 'above_subjects' | 'below_subjects';
    };
    classicTheme?: {
      headerColor?: string;    // e.g. '#4f81bd'
      bandColor?: string;      // e.g. '#d9e1f2'
      borderWidth?: number;    // e.g. 1
      textScale?: number;      // multiplier, e.g. 1.0
    };
    // Custom header title text, default falls back to "{term} Term Pupil's Performance Report"
    classicHeaderTitle?: string;
  };
  features?: Record<string, boolean>;
  roleBasedFeatures?: {
    admin?: Record<string, boolean>;
    teacher?: Record<string, boolean>;
    student?: Record<string, boolean>;
    parent?: Record<string, boolean>;
    bursar?: Record<string, boolean>;
  };
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
    // Payment Gateways
    paystack_public_key?: string;
    paystack_secret_key?: string; // Stored securely, not sent to client
    flutterwave_public_key?: string;
    flutterwave_secret_key?: string; // Stored securely, not sent to client
    flutterwave_encryption_key?: string; // Stored securely, not sent to client

    // Manual Bank Payments
    manual_bank_name?: string;
    manual_bank_account_name?: string;
    manual_bank_account_number?: string;
    manual_payment_instructions?: string;
    
    // AI Services
    gemini_api_key?: string; // Stored securely, overrides sitewide key if set
    openai_api_key?: string; // Stored securely, not sent to client
    
    // WhatsApp Business
    whatsapp_business_token?: string; // Stored securely, not sent to client
    whatsapp_phone_number_id?: string;
    whatsapp_webhook_verify_token?: string; // Stored securely, not sent to client
    
    // Nigerian SMS Gateways
    sms_provider?: 'termii' | 'smartsmssolutions' | 'bulk-sms-nigeria' | 'nigeriabulksms' | 'custom';
    sms_api_key?: string; // Stored securely, not sent to client
    sms_sender_id?: string;
    sms_api_url?: string; // For custom SMS providers
    
    // Termii SMS Gateway
    termii_api_key?: string; // Stored securely, not sent to client
    termii_sender_id?: string;
    
    // Smart SMS Solutions
    smartsms_username?: string;
    smartsms_password?: string; // Stored securely, not sent to client
    smartsms_sender?: string;
    
    // Bulk SMS Nigeria
    bulksms_username?: string;
    bulksms_password?: string; // Stored securely, not sent to client
    bulksms_api_token?: string; // Optional token-based API
    bulksms_sender?: string;
    
    // Nigeria Bulk SMS
    nigeriabulksms_username?: string;
    nigeriabulksms_password?: string; // Stored securely, not sent to client
    nigeriabulksms_sender?: string;
    
    // Email Services
    sendgrid_api_key?: string; // Stored securely, not sent to client
    sendgrid_from_email?: string;
    sendgrid_from_name?: string;
    mailgun_api_key?: string; // Stored securely, not sent to client
    mailgun_domain?: string;
    mailgun_from_email?: string;
    
    // Cloud Storage
    cloudinary_cloud_name?: string;
    cloudinary_api_key?: string;
    cloudinary_api_secret?: string; // Stored securely, not sent to client
    
    // Analytics
    google_analytics_id?: string;
    mixpanel_token?: string;
    
    // Push Notifications
    firebase_server_key?: string; // Stored securely, not sent to client
    onesignal_app_id?: string;
    onesignal_api_key?: string; // Stored securely, not sent to client
    
    // Social Media
    facebook_app_id?: string;
    facebook_app_secret?: string; // Stored securely, not sent to client
    twitter_api_key?: string; // Stored securely, not sent to client
    twitter_api_secret?: string; // Stored securely, not sent to client
    
    // Other Useful APIs
    google_maps_api_key?: string; // Stored securely, not sent to client
    recaptcha_site_key?: string;
    recaptcha_secret_key?: string; // Stored securely, not sent to client
  }
}

export interface PlatformUser {
    id: string;
    email: string;
    role: string;
    lastLogin: string;
}

// Platform permissions
export type PermissionKey =
  | 'manage_tenants'
  | 'manage_users'
  | 'manage_platform_settings'
  | 'manage_payments'
  | 'manage_integrations'
  | 'manage_security'
  | 'manage_plugins'
  | 'manage_content'
  | 'publish_content'
  | 'send_broadcasts'
  | 'view_reports';

export type RolePermissions = Partial<Record<UserRole, Partial<Record<PermissionKey, boolean>>>>;

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
    // Optional subject line for email templates
    subject?: string;
}

export interface ScheduledReminder {
    id: string;
    name: string;
    type: 'overdue_fees';
    templateId: string;
    days_after_due: number;
    enabled: boolean;
}

// Scheduled email/newsletter campaigns with a specific send date/time
export interface ScheduledCampaign {
    id: string;
    name: string;
    templateId: string;
    channel: 'email';
    target: 'all' | 'class';
    className?: string;
    sendAt: string; // ISO datetime
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