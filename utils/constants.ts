// utils/constants.ts

export const USER_ROLES = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  BURSAR: 'Bursar',
  SUPER_ADMIN: 'SuperAdmin',
};

export const PLATFORM_ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    CONTENT_EDITOR: 'Content Editor',
    BLOG_AUTHOR: 'Blog Author',
};

export const APP_VIEWS = {
    DEMO: 'demo',
    SIGNUP: 'signup',
    SIGNIN: 'signin',
    RESULT_CHECKER: 'result-checker',
    BLOG: 'blog',
    ARTICLE: 'article',
    KB: 'kb',
    KB_ARTICLE: 'kb-article',
    ALUMNI: 'alumni',
};

export const ADMIN_VIEWS = {
    DASHBOARD: 'dashboard',
    STUDENTS: 'students',
    STAFF: 'staff',
    SUBJECTS: 'subjects',
    RESULTS: 'results',
    ATTENDANCE: 'attendance',
    PROMOTIONS: 'promotions',
    REPORT_CARDS: 'report-cards',
    TIMETABLE: 'timetable',
    COMMUNICATIONS: 'communications',
    BURSARY: 'bursary',
    ANALYTICS: 'analytics',
    AI_TOOLS: 'ai-tools',
    SETTINGS: 'settings',
    MORE: 'more',
    STUDENT_PROFILE: 'student-profile',
    COMPREHENSIVE_ENTRY: 'comprehensive-entry',
    ALUMNI: 'alumni',
    // Super Admin Views
    USERS: 'users',
    PAGES: 'pages',
    MENUS: 'menus',
    PLATFORM_SETTINGS: 'platform-settings',
    BLOG_ARTICLES: 'blog-articles',
    KB_ARTICLES: 'kb-articles',
};

export const TEACHER_VIEWS = {
    DASHBOARD: 'dashboard',
    MY_STUDENTS: 'my-students',
    ENTER_SCORES: 'enter-scores',
    MY_SCHEDULE: 'my-schedule',
    ASSIGNMENTS: 'assignments',
    AI_TOOLS: 'ai-tools',
    RESOURCE_HUB: 'resource-hub',
    MESSAGES: 'messages',
    MORE: 'more',
    MY_PAYSLIPS: 'my-payslips',
};

export const STUDENT_VIEWS = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    TRANSCRIPT: 'transcript',
    ASSIGNMENTS: 'assignments',
    TIMETABLE: 'timetable',
    PROFILE: 'profile',
    NOTIFICATIONS: 'notifications',
    AI_TUTOR: 'ai-tutor',
    AI_TOOLS: 'ai-tools',
};

export const PARENT_VIEWS = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    ASSIGNMENTS: 'assignments',
    MESSAGES: 'messages',
    ATTENDANCE: 'attendance',
    BEHAVIORAL: 'behavioral',
    NOTIFICATIONS: 'notifications',
    FEES: 'fees',
};

export const CONTROLLABLE_FEATURES = [
    { key: 'results', name: 'Results & Transcript' },
    { key: 'assignments', name: 'Assignments' },
    { key: 'timetable', name: 'Timetable' },
    { key: 'communications', name: 'Communications' },
    { key: 'bursary', name: 'Bursary / Finance' },
    { key: 'payroll', name: 'Payroll Management' },
    { key: 'analytics', name: 'Analytics' },
    { key: 'ai-tools', name: 'AI Tools' },
    { key: 'alumni', name: 'Alumni Portal' },
    { key: 'attendance', name: 'Attendance' },
    { key: 'behavioral', name: 'Behavioral Remarks' },
    { key: 'messages', name: 'Direct Messages' },
];

export const TEACHER_CONTROLLABLE_FEATURES = [
    { key: 'enter-scores', name: 'Enter Scores' },
    { key: 'assignments', name: 'Manage Assignments' },
    { key: 'resource-hub', name: 'Resource Hub' },
    { key: 'messages', name: 'Direct Messages' },
    { key: 'ai-tools', name: 'AI Tools' },
    { key: 'my-payslips', name: 'View Payslips' },
];

export const STUDENT_CONTROLLABLE_FEATURES = [
    { key: 'results', name: 'View Report Card' },
    { key: 'transcript', name: 'View Full Transcript' },
    { key: 'assignments', name: 'View Assignments' },
    { key: 'timetable', name: 'View Timetable' },
    { key: 'ai-tutor', name: 'Live AI Tutor' },
    { key: 'ai-tools', name: 'AI Learning Tools' },
];

export const PARENT_CONTROLLABLE_FEATURES = [
    { key: 'results', name: 'View Results' },
    { key: 'assignments', name: 'View Assignments' },
    { key: 'messages', name: 'Direct Messages' },
    { key: 'attendance', name: 'View Attendance' },
    { key: 'behavioral', name: 'View Behavioral Remarks' },
    { key: 'fees', name: 'School Fees' },
];