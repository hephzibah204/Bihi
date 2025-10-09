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
    COMPREHENSIVE_ENTRY: 'comprehensive-entry',
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
    BROADSHEET: 'broadsheet',
    ALUMNI: 'alumni',
    BLOG_ARTICLES: 'blog-articles',
    KB_ARTICLES: 'kb-articles',
    KNOWLEDGE_BASE: 'knowledge-base',
} as const;

export const CONTROLLABLE_FEATURES = [
    { key: ADMIN_VIEWS.STUDENTS, name: 'Student Management' },
    { key: ADMIN_VIEWS.TEACHERS, name: 'Teacher Management' },
    { key: ADMIN_VIEWS.SUBJECTS, name: 'Subject Management' },
    { key: ADMIN_VIEWS.RESULTS, name: 'Score & Result Entry' },
    { key: ADMIN_VIEWS.GENERAL_REMARKS, name: 'General Remarks' },
    { key: ADMIN_VIEWS.REPORT_CARDS, name: 'Report Card Generation' },
    { key: ADMIN_VIEWS.BROADSHEET, name: 'Broadsheet Analysis' },
    { key: ADMIN_VIEWS.PROMOTIONS, name: 'Student Promotions' },
    { key: ADMIN_VIEWS.ID_CARDS, name: 'ID Card Generation' },
    { key: ADMIN_VIEWS.TIMETABLE, name: 'Timetable Management' },
    { key: ADMIN_VIEWS.ATTENDANCE, name: 'Attendance Tracking' },
    { key: ADMIN_VIEWS.BEHAVIORAL, name: 'Behavioral Remarks' },
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
    MESSAGES: 'messages',
    RESOURCE_HUB: 'resource-hub',
    KNOWLEDGE_BASE: 'knowledge-base',
    MORE: 'more',
} as const;

export const TEACHER_CONTROLLABLE_FEATURES = [
    { key: TEACHER_VIEWS.MY_STUDENTS, name: 'View My Students' },
    { key: TEACHER_VIEWS.ENTER_SCORES, name: 'Enter Scores' },
    { key: TEACHER_VIEWS.MY_SCHEDULE, name: 'View Schedule' },
    { key: TEACHER_VIEWS.MESSAGES, name: 'Direct Messages' },
    { key: TEACHER_VIEWS.AI_TOOLS, name: 'AI Tools' },
];

export const STUDENT_VIEWS = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    TRANSCRIPT: 'transcript',
    ASSIGNMENTS: 'assignments',
    TIMETABLE: 'timetable',
    NOTIFICATIONS: 'notifications',
    PROFILE: 'profile',
    AI_TUTOR: 'ai-tutor',
    AI_TOOLS: 'ai-tools',
} as const;

export const STUDENT_CONTROLLABLE_FEATURES = [
    { key: STUDENT_VIEWS.RESULTS, name: 'View Report Card' },
    { key: STUDENT_VIEWS.TRANSCRIPT, name: 'View Score Transcript' },
    { key: STUDENT_VIEWS.ASSIGNMENTS, name: 'View Assignments' },
    { key: STUDENT_VIEWS.TIMETABLE, name: 'View Timetable' },
    { key: STUDENT_VIEWS.AI_TUTOR, name: 'Access Live AI Tutor' },
    { key: STUDENT_VIEWS.AI_TOOLS, name: 'Access AI Learning Tools' },
];


export const PARENT_VIEWS = {
    DASHBOARD: 'dashboard',
    RESULTS: 'results',
    ASSIGNMENTS: 'assignments',
    NOTIFICATIONS: 'notifications',
    ATTENDANCE: 'attendance',
    BEHAVIORAL: 'behavioral',
    MESSAGES: 'messages',
} as const;

export const PARENT_CONTROLLABLE_FEATURES = [
    { key: PARENT_VIEWS.RESULTS, name: "View Child's Results" },
    { key: PARENT_VIEWS.ASSIGNMENTS, name: "View Child's Assignments" },
    { key: PARENT_VIEWS.ATTENDANCE, name: "View Child's Attendance" },
    { key: PARENT_VIEWS.BEHAVIORAL, name: "View Child's Behavior Log" },
    { key: PARENT_VIEWS.MESSAGES, name: 'Message Teachers' },
];

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
} as const;