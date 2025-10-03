export const APP_NAME = 'ReportSheet';

export const USER_ROLES = {
    ADMIN: 'Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
    BURSAR: 'Bursar',
} as const;

export const ADMIN_VIEWS = {
    DASHBOARD: 'dashboard',
    STUDENTS: 'students',
    TEACHERS: 'teachers',
    SUBJECTS: 'subjects',
    ASSIGNMENTS: 'assignments',
    RESULTS: 'results',
    REPORT_CARDS: 'report-cards',
    PROMOTIONS: 'promotions',
    ID_CARDS: 'id-cards',
    TIMETABLE: 'timetable',
    ATTENDANCE: 'attendance',
    BEHAVIORAL: 'behavioral',
    BURSARY: 'bursary',
    BILLING: 'billing',
    COMMUNICATIONS: 'communications',
    ANALYTICS: 'analytics',
    AI_TOOLS: 'ai-tools',
    SETTINGS: 'settings',
    MORE: 'more',
} as const;

export const TEACHER_VIEWS = {
    DASHBOARD: 'dashboard',
    MY_CLASS: 'my-class',
    MY_STUDENTS: 'my-students',
    ENTER_SCORES: 'enter-scores',
    MY_SCHEDULE: 'my-schedule',
    BEHAVIORAL_LOG: 'behavioral-log',
    AI_TOOLS: 'ai-tools',
    MORE: 'more',
} as const;

export const STUDENT_VIEWS = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    ASSIGNMENTS: 'assignments',
    TIMETABLE: 'timetable',
    NOTIFICATIONS: 'notifications',
    PROFILE: 'profile',
    AI_TUTOR: 'ai-tutor',
} as const;

export const PARENT_VIEWS = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    ASSIGNMENTS: 'assignments',
    NOTIFICATIONS: 'notifications',
    ATTENDANCE: 'attendance',
    BEHAVIORAL: 'behavioral',
} as const;

export const APP_VIEWS = {
    DEMO: 'demo',
    SIGNUP: 'signup',
    RESULT_CHECKER: 'result-checker',
    BLOG: 'blog',
    ARTICLE: 'article',
    KB: 'kb',
    KB_ARTICLE: 'kb-article',
    ALUMNI: 'alumni',
} as const;
