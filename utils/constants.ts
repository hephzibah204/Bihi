export const APP_NAME = 'ReportSheet';

export const USER_ROLES = {
    ADMIN: 'Admin',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
    BURSAR: 'Bursar',
} as const;

export const PLATFORM_ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    CONTENT_EDITOR: 'Content Editor',
    BLOG_AUTHOR: 'Blog Author',
} as const;

export const ADMIN_VIEWS = {
    DASHBOARD: 'dashboard',
    STUDENTS: 'students',
    STUDENT_PROFILE: 'student-profile',
    TEACHERS: 'teachers',
    SUBJECTS: 'subjects',
    ASSIGNMENTS: 'assignments',
    RESULTS: 'results',
    GENERAL_REMARKS: 'general-remarks',
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
    PAGES: 'pages',
    MENUS: 'menus',
    USERS: 'users',
    PLATFORM_SETTINGS: 'platform-settings',
    ALUMNI: 'alumni',
} as const;

export const CONTROLLABLE_FEATURES = [
    { key: ADMIN_VIEWS.STUDENTS, name: 'Student Management' },
    { key: ADMIN_VIEWS.TEACHERS, name: 'Teacher Management' },
    { key: ADMIN_VIEWS.SUBJECTS, name: 'Subject Management' },
    { key: ADMIN_VIEWS.RESULTS, name: 'Score & Result Entry' },
    { key: ADMIN_VIEWS.GENERAL_REMARKS, name: 'General Remarks' },
    { key: ADMIN_VIEWS.REPORT_CARDS, name: 'Report Card Generation' },
    { key: ADMIN_VIEWS.PROMOTIONS, name: 'Student Promotions' },
    { key: ADMIN_VIEWS.ID_CARDS, name: 'ID Card Generation' },
    { key: ADMIN_VIEWS.TIMETABLE, name: 'Timetable Management' },
    { key: ADMIN_VIEWS.ATTENDANCE, name: 'Attendance Tracking' },
    { key: ADMIN_VIEWS.COMMUNICATIONS, name: 'Parent Communication' },
    { key: ADMIN_VIEWS.BURSARY, name: 'Bursary & Fee Management' },
    { key: ADMIN_VIEWS.ANALYTICS, name: 'Advanced Analytics' },
    { key: ADMIN_VIEWS.AI_TOOLS, name: 'AI Teacher Assistant' },
    { key: ADMIN_VIEWS.ASSIGNMENTS, name: 'Assignments' },
    { key: ADMIN_VIEWS.ALUMNI, name: 'Alumni Management' },
] as const;


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