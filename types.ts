import { Student as StudentType } from './types';
import { Teacher as TeacherType } from './components/Teachers';
import { Subject as SubjectType } from './types';

export interface Student {
  id: string;
  name: string;
  class: string;
  admissionNo: string;
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
  name:string;
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

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolLogo: string;
  session: string;
  term: string;
  paystackPublicKey: string;
  gradingSystem: { grade: string; from: number; to: number; remark: string }[];
  schoolType?: 'nursery_primary' | 'secondary' | 'all';
  planId?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_termly: number;
  price_yearly: number;
  features: {
    [key: string]: boolean | number;
    hasAI: boolean;
    hasAnalytics: boolean;
    maxStudents: number;
  }
}

export interface Tenant {
    id: string;
    name: string;
    planId: string | null;
}


export type DashboardView =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'subjects'
  | 'results'
  | 'report-cards'
  | 'promotions'
  | 'id-cards'
  | 'timetable'
  | 'attendance'
  | 'behavioral'
  | 'bursary'
  | 'billing'
  | 'communications'
  | 'analytics'
  | 'ai-tools'
  | 'settings'
  | 'more';

export type TeacherView =
  | 'dashboard'
  | 'my-students'
  | 'enter-scores'
  | 'my-schedule'
  | 'ai-tools'
  | 'more';

export type StudentView =
  | 'dashboard'
  | 'results'
  | 'timetable'
  | 'notifications'
  | 'profile';

export type ParentView =
  | 'dashboard'
  | 'results'
  | 'notifications'
  | 'attendance'
  | 'behavioral';
