// utils/constants.ts
import { DashboardView, TeacherView, StudentView, ParentView, UserRole } from '../types';

export const APP_VIEWS = {
    DEMO: 'demo',
    SIGNUP: 'signup',
    SIGNIN: 'signin',
    RESULT_CHECKER: 'results',
    BLOG: 'blog',
    ARTICLE: 'article',
    KB: 'kb',
    KB_ARTICLE: 'kb-article',
    ALUMNI: 'alumni',
};

export const ADMIN_VIEWS: { [key: string]: DashboardView } = {
    DASHBOARD: 'dashboard',
    STUDENTS: 'students',
    STUDENT_PROFILE: 'student-profile',
    SUBJECTS: 'subjects',
    RESULTS: 'results',
    REPORT_CARDS: 'report-cards',
    COMPREHENSIVE_ENTRY: 'comprehensive-entry',
    PROMOTIONS: 'promotions',
    ATTENDANCE: 'attendance',
    SETTINGS: 'settings',
    BURSARY: 'bursary',
    COMMUNICATIONS: 'communications',
    AI_TOOLS: 'ai-tools',
    ANALYTICS: 'analytics',
    ALUMNI: 'alumni',
    STAFF: 'staff',
    PARENTS: 'parents',
    TIMETABLE: 'timetable',
    ID_CARDS: 'id-cards',
    BEHAVIORAL_REMARKS: 'behavioral-remarks',
    GENERAL_REMARKS: 'general-remarks',
    HELP: 'help',
    RESOURCE_HUB: 'resource-hub',
    BILLING: 'billing',
    MORE: 'more',
    EVENTS: 'events',
    ABSENCE_MANAGEMENT: 'absence-management',
    PLATFORM_SETTINGS: 'platform-settings',
    USERS: 'users',
    PAGES: 'pages',
    MENUS: 'menus',
    BLOG_ARTICLES: 'blog-articles',
    KB_ARTICLES: 'kb-articles',
};

export const TEACHER_VIEWS: { [key: string]: TeacherView } = {
    DASHBOARD: 'dashboard',
    MY_STUDENTS: 'my-students',
    ENTER_SCORES: 'enter-scores',
    MY_SCHEDULE: 'my-schedule',
    AI_TOOLS: 'ai-tools',
    RESOURCE_HUB: 'resource-hub',
    MY_PAYSLIPS: 'my-payslips',
    HELP: 'help',
    MORE: 'more',
    ASSIGNMENTS: 'assignments',
    BEHAVIORAL: 'behavioral',
};

export const STUDENT_VIEWS: { [key: string]: StudentView } = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    ASSIGNMENTS: 'assignments',
    TIMETABLE: 'timetable',
    AI_TOOLS: 'ai-tools',
    PROFILE: 'profile',
    NOTIFICATIONS: 'notifications',
    TRANSCRIPT: 'transcript',
    AI_TUTOR: 'ai-tutor',
};

export const PARENT_VIEWS: { [key: string]: ParentView } = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    FEES: 'fees',
    ATTENDANCE: 'attendance',
    BEHAVIORAL: 'behavioral',
    ASSIGNMENTS: 'assignments',
    MESSAGES: 'messages',
    PROFILE: 'profile',
    EVENTS: 'events',
    REPORT_ABSENCE: 'report-absence',
};

export const USER_ROLES: { [key: string]: UserRole } = {
    ADMIN: 'Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
    SUPER_ADMIN: 'Super Admin',
    BURSAR: 'Bursar',
};

export const CONTROLLABLE_FEATURES = [
    { key: 'bursary', name: 'Bursary / Finance' },
    { key: 'communications', name: 'Communications (SMS/Email)' },
    { key: 'ai-tools', name: 'AI Tools' },
    { key: 'analytics', name: 'Advanced Analytics' },
    { key: 'alumni', name: 'Alumni Management' },
    { key: 'id-cards', name: 'ID Card Generator' },
];

export const PLATFORM_ROLES = {
    SUPER_ADMIN: 'Super Admin',
    BLOG_AUTHOR: 'Blog Author',
    SUPPORT: 'Support Staff',
};