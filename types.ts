// Fix: Removed self-import of types which was causing a declaration conflict.
// The types Student, Subject, Score, and Remark are defined in this file.

export const Term = {
    FIRST: 'First Term',
    SECOND: 'Second Term',
    THIRD: 'Third Term'
};

export type DashboardView = 
    'dashboard' | 
    'students' | 
    'teachers' |
    'subjects' | 
    'results' | 
    'report-cards' |
    'promotions' |
    'id-cards' |
    'timetable' |
    'attendance' |
    'behavioral' |
    'bursary' |
    'analytics' | 
    'ai-tools' |
    'settings' |
    'communications' |
    'billing' |
    'more';

export type TeacherView = 
    'dashboard' | 
    'my-students' |
    'enter-scores' |
    'my-schedule' |
    'ai-tools' |
    'more';

// Fix: Moved view-specific types here to break circular dependencies
export type StudentView = 'dashboard' | 'results' | 'timetable' | 'profile' | 'ai-tutor' | 'notifications';
export type ParentView = 'dashboard' | 'results' | 'attendance' | 'behavioral' | 'ai-assistant' | 'notifications';


export interface Score {
    studentId: string;
    subjectId: string;
    term: string;
    session: string;
    ca1?: number;
    ca2?: number;
    exam?: number;
    comment?: string;
}

export interface Student {
    id: string;
    name: string;
    class: string;
    admissionNo: string;
    gender: string;
    dob?: string;
    photo?: string;
    parentEmail?: string;
    faceDescriptor?: number[];
    status?: 'active' | 'alumni';
    graduationYear?: number;
}

export interface Subject {
    id: string;
    name: string;
    classes: string[];
}

export interface Remark {
    studentId: string;
    term: string;
    session: string;
    generalComment?: string;
}