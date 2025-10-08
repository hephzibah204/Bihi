// types.ts

export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Bursar';
export type PlatformRole = 'SuperAdmin' | 'Content Editor' | 'Blog Author';

export type DashboardView = string;
export type TeacherView = string;
export type StudentView = string;
export type ParentView = string;

export interface Student {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    gender: 'Male' | 'Female';
    dob?: string;
    photo?: string;
    parentId?: string;
    parentEmail?: string;
    faceDescriptor?: number[];
    status?: 'active' | 'alumni';
    graduationYear?: number;
}

export interface Teacher {
    id: string;
    auth_id: string;
    name: string;
    email: string;
    role: UserRole;
    classTeacherOf?: string;
}

export interface Parent {
    id: string;
    name: string;
    email: string;
    auth_id?: string;
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
    teacherComment?: string;
    affectiveRatings?: Record<string, number>;
    psychomotorRatings?: Record<string, number>;
}

export interface BehavioralLogEntry {
    id: string;
    studentId: string;
    date: string;
    remark: string;
    type: 'positive' | 'negative' | 'neutral';
    teacherId: string;
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
    id: 'academics' | 'attendance' | 'affective' | 'psychomotor' | 'comment';
    title: string;
    enabled: boolean;
}

export interface ReportCardSettings {
    principalName: string;
    schoolMotto: string;
    sections: ReportCardSection[];
    affectiveSkills: ReportCardSkill[];
    psychomotorSkills: ReportCardSkill[];
}

export interface FeatureControlSettings {
  [featureKey: string]: boolean;
}

export interface SchoolSettings {
    schoolName: string;
    schoolAddress: string;
    schoolLogo: string;
    schoolType: 'nursery_primary' | 'secondary' | 'all';
    session: string;
    term: 'First Term' | 'Second Term' | 'Third Term';
    maxCa1: number;
    maxCa2: number;
    maxExam: number;
    gradingSystem: Grading[];
    paystackPublicKey?: string;
    planId?: string;
    reportCardSettings?: ReportCardSettings;
    featureControls?: {
        teacher: FeatureControlSettings;
        student: FeatureControlSettings;
        parent: FeatureControlSettings;
    };
}

export interface Assignment {
    id: string;
    class: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    type?: string; // To align with StudentAssignments
}

export interface AssignmentScore {
    id: string;
    assignmentId: string;
    studentId: string;
    score: number;
    comment?: string;
}

export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_termly: number;
    price_yearly: number;
    features: {
        maxStudents: number;
        [featureKey: string]: boolean | number;
    };
}

export interface Tenant {
    id: string; // subdomain
    name: string;
    planId?: string;
    subscriptionStatus: 'active' | 'trial' | 'expired' | 'unsubscribed';
    trialEndDate?: string | null;
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

export interface MenuItem {
    id: string;
    label: string;
    url: string;
}

export interface PlatformUser {
    id: string;
    email: string;
    role: PlatformRole;
    lastLogin: string;
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

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  otherParticipant: {
    id: string;
    name: string;
    role: UserRole | 'Parent';
  };
}

export interface Testimonial {
    id: string;
    quote: string;
    name: string;
    role: string;
    school: string;
    avatar: string;
}

export interface LandingPageContent {
    promoBanner: {
        enabled: boolean;
        text: string;
        endDate: string;
    };
    hero: {
        title: string;
        subtitle: string;
    };
    trustBar: {
        enabled: boolean;
        logos: { src: string; alt: string }[];
    };
    problem: {
        title: string;
        points: string[];
        // Fix: Added missing optional `extraText` property to align with its usage in LandingPage.tsx.
        extraText?: string;
    };
    solution: {
        title: string;
        features: {
            icon: string;
            title: string;
            desc: string;
        }[];
    };
    howItWorks: {
        title: string;
        steps: {
            title: string;
            desc: string;
        }[];
    };
    testimonials: {
        title: string;
        items: Testimonial[];
    };
    faq: {
        title: string;
        items: { q: string; a: string }[];
    };
    finalCta: {
        title: string;
        subtitle: string;
        // Fix: Added missing optional `tagline` property to align with its usage in LandingPage.tsx.
        tagline?: string;
    };
    // Fix: Added missing optional `pricing` property to align with its usage in LandingPage.tsx.
    pricing?: {
        title: string;
        subtitle: string;
    };
}
// Fix: Added missing type definitions for Fee, ScratchCard, and Announcement.
export interface Fee {
    id: string;
    description: string;
    amount: number;
    classes: string[];
}

export interface ScratchCard {
    id: string;
    pin: string;
    used: boolean;
    createdAt: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    recipients: string[];
    created_at: string;
}