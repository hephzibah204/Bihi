import { USER_ROLES } from './constants';
import { SchoolSettings, Parent, Student } from '../types';

export const DEMO_TENANT_ID = 'demo';

// Fix: Explicitly type demoSchoolSettings to match the SchoolSettings interface and resolve type errors.
export const demoSchoolSettings: SchoolSettings = {
    schoolName: "Brightstar Academy (Demo)",
    schoolAddress: "123 Education Lane, Lagos",
    schoolLogo: "https://i.imgur.com/gKEBi1f.png",
    session: "2023/2024",
    term: "Second Term",
    paystackPublicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx",
    gradingSystem: [
        { grade: 'A', from: 75, to: 100, remark: 'Excellent' },
        { grade: 'B', from: 65, to: 74, remark: 'Very Good' },
        { grade: 'C', from: 50, to: 64, remark: 'Good' },
        { grade: 'D', from: 45, to: 49, remark: 'Fair' },
        { grade: 'E', from: 40, to: 44, remark: 'Weak' },
        { grade: 'F', from: 0, to: 39, remark: 'Fail' },
    ],
    schoolType: 'secondary',
    maxCa1: 20,
    maxCa2: 20,
    maxExam: 60,
};

export const demoSubjects = [
    { id: 'subj_1', name: 'Mathematics', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'subj_2', name: 'English Language', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'subj_3', name: 'Basic Science', classes: ['JSS 1', 'JSS 2'] },
    { id: 'subj_4', name: 'Basic Technology', classes: ['JSS 1', 'JSS 2'] },
    { id: 'subj_5', name: 'Social Studies', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'subj_6', name: 'Physics', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_7', name: 'Chemistry', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
];

export const demoTeachers = [
    { id: 'teacher_1', name: 'Mr. John Doe', email: 'johndoe@reportsheet.dev', role: USER_ROLES.ADMIN, classTeacherOf: 'JSS 1' },
    { id: 'teacher_2', name: 'Mrs. Jane Smith', email: 'janesmith@reportsheet.dev', role: USER_ROLES.TEACHER, classTeacherOf: 'JSS 2' },
    { id: 'teacher_3', name: 'Mr. Femi Adebayo', email: 'femi@reportsheet.dev', role: USER_ROLES.BURSAR, classTeacherOf: '' },
];

// Fix: Add and export demoParents
export const demoParents: Parent[] = [
    { id: 'parent_1', name: 'Mr. & Mrs. Adekunle', email: 'adekunle@family.com' },
    { id: 'parent_2', name: 'Dr. Chioma Okoro', email: 'chioma.okoro@example.com' },
];

// Fix: Rename demoStudentData to demoStudents and export it. Link students to parents.
export const demoStudents: Student[] = [
    { id: 'stud_1', name: 'Adekunle Gold', admissionNo: 'RS-001', class: 'JSS 1', gender: 'Male', dob: '2010-05-15', photo: 'https://i.pravatar.cc/150?u=stud_1', parentId: 'parent_1', parentEmail: 'adekunle@family.com' },
    { id: 'stud_2', name: 'Simisola Adekunle', admissionNo: 'RS-002', class: 'JSS 1', gender: 'Female', dob: '2010-08-22', photo: 'https://i.pravatar.cc/150?u=stud_2', parentId: 'parent_1', parentEmail: 'adekunle@family.com' },
    { id: 'stud_3', name: 'David Okoro', admissionNo: 'RS-003', class: 'JSS 2', gender: 'Male', dob: '2009-02-10', photo: 'https://i.pravatar.cc/150?u=stud_3', parentId: 'parent_2', parentEmail: 'chioma.okoro@example.com' },
];