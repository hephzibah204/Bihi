// Fix: Added content to types.ts to make it a valid module and define all necessary types.
import { ADMIN_VIEWS, TEACHER_VIEWS, STUDENT_VIEWS, PARENT_VIEWS, USER_ROLES } from './utils/constants';

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export type DashboardView = typeof ADMIN_VIEWS[keyof typeof ADMIN_VIEWS];
export type TeacherView = typeof TEACHER_VIEWS[keyof typeof TEACHER_VIEWS];
export type StudentView = typeof STUDENT_VIEWS[keyof typeof STUDENT_VIEWS];
export type ParentView = typeof PARENT_VIEWS[keyof typeof PARENT_VIEWS];

// Fix: Add Parent interface
export interface Parent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  gender: 'Male' | 'Female';
  dob: string; // YYYY-MM-DD
  photo: string;
  // Fix: Add parent-related optional fields
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentAddress?: string;
  faceDescriptor?: number[];
  status?: 'active' | 'alumni';
  graduationYear?: number;
}

export interface Teacher {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  role: UserRole;
  classTeacherOf?: string;
  photo?: string;
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
  generalComment: string;
}

export interface Grading {
  grade: string;
  from: number;
  to: number;
  remark: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolLogo: string;
  session: string;
  term: string;
  paystackPublicKey: string;
  gradingSystem: Grading[];
  schoolType: 'nursery_primary' | 'secondary' | 'all';
  maxCa1: number;
  maxCa2: number;
  maxExam: number;
  planId?: string;
}

export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_termly: number;
    price_yearly: number;
    features: {
        maxStudents: number;
        hasAI: boolean;
        hasAnalytics: boolean;
        [key: string]: any;
    };
}

export interface BehavioralLogEntry {
    id: string;
    studentId: string;
    teacherId: string;
    date: string;
    type: 'positive' | 'negative' | 'neutral';
    remark: string;
}

export interface Assignment {
    id: string;
    title: string;
    description?: string;
    class: string;
    subjectId: string;
    topic?: string;
    type: 'Homework' | 'Classwork';
    dueDate: string;
    maxScore: number;
    contributesToCA: boolean;
}

export interface AssignmentScore {
    id: string;
    assignmentId: string;
    studentId: string;
    score?: number;
    submitted: boolean;
    comment?: string;
}