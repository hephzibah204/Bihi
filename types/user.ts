// User and Authentication Types

export type UserRole =
  | 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Super Admin' | 'Bursar'
  | 'Editor' | 'Author' | 'Content Manager' | 'Moderator' | 'Support';

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  dob?: string;
  gender?: 'Male' | 'Female';
  photo?: string;
  address?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  siblings?: string[];
  status?: 'active' | 'graduated' | 'alumni';
  graduationYear?: number;
  faceDescriptor?: number[];
  created_at?: string;
}

export interface Teacher {
  id: string;
  auth_id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: UserRole;
  classTeacherOf?: string;
  baseSalary?: number;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  auth_id?: string;
  pendingChanges?: Partial<Parent>;
}

export interface PlatformUser {
  id: string;
  email: string;
  role: string;
  lastLogin: string;
}