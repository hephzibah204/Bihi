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
    BROADSHEET: 'broadsheet',
    COMPREHENSIVE_ENTRY: 'comprehensive-entry',
    PROMOTIONS: 'promotions',
    ATTENDANCE: 'attendance',
    SETTINGS: 'settings',
    BURSARY: 'bursary',
    COMMUNICATIONS: 'communications',
    AI_TOOLS: 'ai-tools',
    // Individual AI Tools
    AI_CHAT: 'ai-chat',
    AI_ELABORATORY: 'ai-elaboratory',
    AI_LESSON_PLANNER: 'ai-lesson-planner',
    AI_PRACTICE_QUIZ: 'ai-practice-quiz',
    AI_COMMENT_GENERATOR: 'ai-comment-generator',
    AI_EARLY_INTERVENTION: 'ai-early-intervention',
    AI_LEARNING_PATHWAYS: 'ai-learning-pathways',
    AI_SUBJECT_RECOMMENDER: 'ai-subject-recommender',
    AI_RUBRIC_GENERATOR: 'ai-rubric-generator',
    AI_PARENT_MESSAGE_COMPOSER: 'ai-parent-message-composer',
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

export const TEACHER_VIEWS = {
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
    ATTENDANCE: 'attendance',
    MESSAGES: 'messages',
    NOTIFICATIONS: 'notifications',
    REPORT_CARDS: 'report-cards',
    STUDENT_PROFILE: 'student-profile',
    COMPREHENSIVE_ENTRY: 'comprehensive-entry',
    BROADSHEET: 'broadsheet',
} as const;

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
    AI_TOOLS: 'ai-tools',
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
    { 
        key: 'bursary', 
        name: 'Bursary / Finance',
        description: 'Financial management, fees, invoicing, and payment tracking',
        applicableRoles: ['admin', 'bursar', 'teacher'],
        category: 'Financial'
    },
    { 
        key: 'communications', 
        name: 'Communications (SMS/Email)',
        description: 'Send SMS and email notifications to parents and students',
        applicableRoles: ['admin', 'teacher'],
        category: 'Communication'
    },
    { 
        key: 'ai-tools', 
        name: 'AI Tools',
        description: 'AI-powered features like tutoring, lesson planning, and analytics',
        applicableRoles: ['admin', 'teacher', 'student', 'parent'],
        category: 'AI & Automation'
    },
    { 
        key: 'analytics', 
        name: 'Advanced Analytics',
        description: 'Detailed reports and insights on student performance and school metrics',
        applicableRoles: ['admin', 'teacher'],
        category: 'Analytics'
    },
    { 
        key: 'alumni', 
        name: 'Alumni Management',
        description: 'Track and manage alumni information and engagement',
        applicableRoles: ['admin'],
        category: 'Management'
    },
    { 
        key: 'id-cards', 
        name: 'ID Card Generator',
        description: 'Generate and print student and staff ID cards',
        applicableRoles: ['admin', 'teacher'],
        category: 'Utilities'
    },
    { 
        key: 'parent-portal', 
        name: 'Parent Portal Access',
        description: 'Allow parents to access student information, results, and communications',
        applicableRoles: ['parent'],
        category: 'Portal Access'
    },
    { 
        key: 'student-results', 
        name: 'Student Results Viewing',
        description: 'Allow students to view their academic results and progress',
        applicableRoles: ['student', 'parent'],
        category: 'Academic'
    },
    { 
        key: 'teacher-gradebook', 
        name: 'Teacher Gradebook',
        description: 'Grade entry, attendance tracking, and class management tools',
        applicableRoles: ['teacher'],
        category: 'Academic'
    },
    { 
        key: 'live-chat', 
        name: 'Live Chat Support',
        description: 'Real-time chat between teachers, parents, and students',
        applicableRoles: ['admin', 'teacher', 'parent', 'student'],
        category: 'Communication'
    }
];

export const PLATFORM_ROLES = {
    SUPER_ADMIN: 'Super Admin',
    BLOG_AUTHOR: 'Blog Author',
    SUPPORT: 'Support Staff',
};