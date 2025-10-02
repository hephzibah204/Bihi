// Fix: Added comprehensive type definitions for the application.

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
  'billing' |
  'communications' |
  'analytics' |
  'ai-tools' |
  'settings' |
  'more';

export type TeacherView = 
  'dashboard' | 
  'my-students' | 
  'enter-scores' | 
  'my-schedule' | 
  'ai-tools' |
  'more';

export type StudentView = 
  'dashboard' | 
  'results' | 
  'timetable' |
  'notifications' |
  'profile';

export type ParentView = 
  'dashboard' | 
  'results' |
  'notifications' |
  'attendance' | 
  'behavioral';

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  gender: 'Male' | 'Female';
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

export interface Remark {
  studentId: string;
  term: string;
  session: string;
  generalComment: string;
}
