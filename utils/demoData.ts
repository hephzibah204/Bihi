import { Tenant, Student, Subject, SchoolSettings, Score, Teacher, Parent, Invoice, FeeStructure, BehavioralLogEntry, Remark, AttendanceRecord, Assignment, AssignmentScore, Expense, Income } from '../types';

export const DEMO_TENANT_ID = 'demo';

export const CORE_DEMO_DATA = {
    students: [
        { id: 'stud_1', name: 'Adekunle Gold', admissionNo: 'JSS1-001', class: 'JSS 1A', gender: 'Male', dob: '2010-05-15', parentId: 'parent_1', parentEmail: 'parent1@example.com', photo: 'https://i.imgur.com/gKEBi1f.png', status: 'active', created_at: new Date().toISOString() },
        { id: 'stud_2', name: 'Bisiola Adebayo', admissionNo: 'JSS1-002', class: 'JSS 1A', gender: 'Female', dob: '2010-08-22', parentId: 'parent_2', parentEmail: 'parent2@example.com', photo: 'https://i.imgur.com/gKEBi1f.png', status: 'active' },
        { id: 'stud_3', name: 'Chinedu Okoro', admissionNo: 'SSS2-001', class: 'SSS 2A', gender: 'Male', dob: '2007-03-10', parentId: 'parent_3', parentEmail: 'parent3@example.com', photo: 'https://i.imgur.com/gKEBi1f.png', status: 'active' },
        { id: 'stud_4', name: 'Damilola Fashola', admissionNo: 'SSS2-002', class: 'SSS 2A', gender: 'Female', dob: '2007-11-01', parentId: 'parent_4', parentEmail: 'parent4@example.com', photo: 'https://i.imgur.com/gKEBi1f.png', status: 'active' },
        { id: 'stud_5', name: 'Emeka Nwosu', admissionNo: 'PRI4-001', class: 'Primary 4A', gender: 'Male', dob: '2013-01-20', parentId: 'parent_5', parentEmail: 'parent5@example.com', photo: 'https://i.imgur.com/gKEBi1f.png', status: 'active' },
        { id: 'stud_6', name: 'Fatima Bello', admissionNo: 'NUR1-001', class: 'Nursery 1A', gender: 'Female', dob: '2018-06-18', parentId: 'parent_6', parentEmail: 'parent6@example.com', photo: 'https://i.imgur.com/gKEBi1f.png', status: 'active' },
    ] as Student[],
    parents: [
        { id: 'parent_1', name: 'Mr. & Mrs. Gold', email: 'parent1@example.com', phone: '08012345671' },
        { id: 'parent_2', name: 'Mrs. Adebayo', email: 'parent2@example.com', phone: '08012345672' },
        { id: 'parent_3', name: 'Mr. Okoro', email: 'parent3@example.com', phone: '08012345673' },
        { id: 'parent_4', name: 'Mr. & Mrs. Fashola', email: 'parent4@example.com', phone: '08012345674' },
        { id: 'parent_5', name: 'Ms. Nwosu', email: 'parent5@example.com', phone: '08012345675' },
        { id: 'parent_6', name: 'Alhaji Bello', email: 'parent6@example.com', phone: '08012345676' },
    ] as Parent[],
    subjects: [
        { id: 'subj_1', name: 'Mathematics', classes: ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B', 'Primary 4A', 'Primary 5A'] },
        { id: 'subj_2', name: 'English Language', classes: ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B', 'Primary 4A', 'Primary 5A', 'Nursery 1A'] },
        { id: 'subj_3', name: 'Physics', classes: ['SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B'] },
        { id: 'subj_4', name: 'Basic Science', classes: ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B'] },
        { id: 'subj_5', name: 'Number Work', classes: ['Nursery 1A'] },
        { id: 'subj_6', name: 'Elementary Science', classes: ['Primary 4A', 'Primary 5A'] },
        { id: 'subj_7', name: 'Chemistry', classes: ['SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B'] },
        { id: 'subj_8', name: 'Biology', classes: ['SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B'] },
        { id: 'subj_9', name: 'Civic Education', classes: ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B', 'SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B'] },
        { id: 'subj_10', name: 'Social Studies', classes: ['JSS 1A', 'JSS 1B', 'JSS 2A', 'JSS 2B'] },
        { id: 'subj_11', name: 'Basic Technology', classes: ['JSS 1A', 'JSS 1B'] },
        { id: 'subj_12', name: 'Agricultural Science', classes: ['JSS 1A', 'JSS 1B'] },
        { id: 'subj_13', name: 'Computer Studies', classes: ['JSS 1A', 'JSS 1B'] },
        { id: 'subj_14', name: 'Home Economics', classes: ['JSS 1A', 'JSS 1B'] },
        { id: 'subj_15', name: 'Christian Religious Studies', classes: ['JSS 1A', 'JSS 1B'] },
    ] as Subject[],
    scores: [
        // Adekunle Gold - excelling
        { studentId: 'stud_1', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 18, ca2: 19, exam: 55 },
        { studentId: 'stud_1', subjectId: 'subj_2', session: '2023/2024', term: 'First Term', ca1: 20, ca2: 18, exam: 58 },
        { studentId: 'stud_1', subjectId: 'subj_4', session: '2023/2024', term: 'First Term', ca1: 17, ca2: 19, exam: 50 },
        // Bisiola Adebayo - failing
        { studentId: 'stud_2', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 5, ca2: 8, exam: 22 },
        { studentId: 'stud_2', subjectId: 'subj_2', session: '2023/2024', term: 'First Term', ca1: 10, ca2: 12, exam: 30 },
        { studentId: 'stud_2', subjectId: 'subj_4', session: '2023/2024', term: 'First Term', ca1: 8, ca2: 7, exam: 25 },
        // Chinedu Okoro - average
        { studentId: 'stud_3', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 15, ca2: 14, exam: 40 },
        { studentId: 'stud_3', subjectId: 'subj_3', session: '2023/2024', term: 'First Term', ca1: 16, ca2: 15, exam: 45 },
    ] as Score[],
    teachers: [
        { id: 'teacher_1', auth_id: 'auth_admin', tenant_id: DEMO_TENANT_ID, name: 'Mrs. Adebayo (Admin)', email: 'admin@demo.com', role: 'Admin', classTeacherOf: 'SSS 2A' },
        { id: 'teacher_2', auth_id: 'auth_teacher', tenant_id: DEMO_TENANT_ID, name: 'Mr. Chukwuma', email: 'teacher@demo.com', role: 'Teacher', classTeacherOf: 'JSS 1A' },
    ] as Teacher[],
    invoices: [
        { id: 'inv_1', studentId: 'stud_1', class: 'JSS 1A', session: '2023/2024', term: 'First Term', issueDate: '2023-09-01', dueDate: '2023-09-30', totalAmount: 75000, amountPaid: 75000, status: 'paid', items: [{ description: 'School Fees', amount: 75000 }] },
        { id: 'inv_2', studentId: 'stud_2', class: 'JSS 1A', session: '2023/2024', term: 'First Term', issueDate: '2023-09-01', dueDate: '2023-09-30', totalAmount: 75000, amountPaid: 0, status: 'unpaid', items: [{ description: 'School Fees', amount: 75000 }] },
        { id: 'inv_3', studentId: 'stud_3', class: 'SSS 2A', session: '2023/2024', term: 'First Term', issueDate: '2023-09-01', dueDate: '2023-09-30', totalAmount: 100000, amountPaid: 50000, status: 'partially-paid', items: [{ description: 'School Fees', amount: 100000 }] },
    ] as Invoice[],
    remarks: [] as Remark[],
    behavioralRecords: [] as BehavioralLogEntry[],
    attendance: [] as AttendanceRecord[],
    expenses: [] as Expense[],
    income: [] as Income[],
    assignments: [] as Assignment[],
    assignment_scores: [] as AssignmentScore[],
    settings: {
        schoolName: 'Brightstar Demo Academy',
        schoolAddress: '123 Innovation Drive, Lagos, Nigeria',
        schoolType: 'all',
        session: '2023/2024',
        term: 'First Term',
        gradingSystem: [
            { grade: 'A', from: 75, to: 100, remark: 'Excellent' }, { grade: 'B', from: 65, to: 74, remark: 'Very Good' },
            { grade: 'C', from: 50, to: 64, remark: 'Good' }, { grade: 'D', from: 45, to: 49, remark: 'Fair' },
            { grade: 'E', from: 40, to: 44, remark: 'Weak' }, { grade: 'F', from: 0, to: 39, remark: 'Fail' },
        ],
        maxCa1: 20, maxCa2: 20, maxExam: 60,
        reportCardSettings: {
            principalName: 'Dr. Evelyn Magnus', schoolMotto: 'Excellence and Integrity',
            sections: [], affectiveSkills: [], psychomotorSkills: [],
        },
        schoolStructure: {
            levels: [
                { id: 'level_nur', name: 'Nursery', classes: [{id: 'c1', name: '1'}, {id: 'c2', name: '2'}] },
                { id: 'level_pri', name: 'Primary', classes: [{id: 'c3', name: '1'}, {id: 'c4', name: '2'}, {id: 'c5', name: '3'}, {id: 'c6', name: '4'}, {id: 'c7', name: '5'}, {id: 'c8', name: '6'}] },
                { id: 'level_jss', name: 'JSS', classes: [{id: 'c9', name: '1'}, {id: 'c10', name: '2'}, {id: 'c11', name: '3'}] },
                { id: 'level_sss', name: 'SSS', classes: [{id: 'c12', name: '1'}, {id: 'c13', name: '2'}, {id: 'c14', name: '3'}] },
            ],
            sections: [{id: 'sec_a', name: 'A'}, {id: 'sec_b', name: 'B'}]
        }
    } as SchoolSettings,
    // Demo timetable seeded for key classes used across components
    timetable: {
        'JSS 1A': {
            'Monday': {
                '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_2' }, // Math
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' }, // English
                '10:00 - 11:00': { subjectId: 'subj_4', teacherId: 'teacher_2' }, // Basic Science
                '11:00 - 12:00': { subjectId: 'subj_9', teacherId: 'teacher_2' }, // Civic Education
                '1:00 - 2:00': { subjectId: 'subj_11', teacherId: 'teacher_2' }, // Basic Technology
            },
            'Tuesday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_12', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_13', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_14', teacherId: 'teacher_2' },
            },
            'Wednesday': {
                '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_10', teacherId: 'teacher_2' }, // Social Studies
                '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_9', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_4', teacherId: 'teacher_2' },
            },
            'Thursday': {
                '8:00 - 9:00': { subjectId: 'subj_13', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_12', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_11', teacherId: 'teacher_2' },
            },
            'Friday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_10', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_9', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_4', teacherId: 'teacher_2' },
            },
        },
        'SSS 2A': {
            'Monday': {
                '8:00 - 9:00': { subjectId: 'subj_3', teacherId: 'teacher_1' }, // Physics
                '9:00 - 10:00': { subjectId: 'subj_7', teacherId: 'teacher_1' }, // Chemistry
                '10:00 - 11:00': { subjectId: 'subj_8', teacherId: 'teacher_1' }, // Biology
                '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
            },
            'Tuesday': {
                '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
            },
            'Wednesday': {
                '8:00 - 9:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
            },
            'Thursday': {
                '8:00 - 9:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
            },
            'Friday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
            },
        },
        // Added demo timetables for Primary 4A and Nursery 1A to improve coverage
        'Primary 4A': {
            'Monday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_2' }, // English
                '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_2' }, // Mathematics
                '10:00 - 11:00': { subjectId: 'subj_6', teacherId: 'teacher_2' }, // Elementary Science
                '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
            },
            'Tuesday': {
                '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
            },
            'Wednesday': {
                '8:00 - 9:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
            },
            'Thursday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
            },
            'Friday': {
                '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
                '10:00 - 11:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
                '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
            },
        },
        'Nursery 1A': {
            'Monday': {
                '8:00 - 9:00': { subjectId: 'subj_5', teacherId: 'teacher_1' }, // Number Work
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_1' }, // English
                '10:00 - 11:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
            },
            'Tuesday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
            },
            'Wednesday': {
                '8:00 - 9:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
            },
            'Thursday': {
                '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
            },
            'Friday': {
                '8:00 - 9:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '10:00 - 11:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
                '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
                '1:00 - 2:00': { subjectId: 'subj_5', teacherId: 'teacher_1' },
            },
        },
    }
};

// Extend demo timetables for additional classes (including Saturday)
CORE_DEMO_DATA.timetable['Primary 5A'] = {
  'Monday': {
    '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '10:00 - 11:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
    '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '1:00 - 2:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
  },
  'Tuesday': {
    '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '10:00 - 11:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
    '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
  },
  'Wednesday': {
    '8:00 - 9:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
    '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '11:00 - 12:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
    '1:00 - 2:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
  },
  'Thursday': {
    '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '9:00 - 10:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
    '10:00 - 11:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '1:00 - 2:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
  },
  'Friday': {
    '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '9:00 - 10:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
    '10:00 - 11:00': { subjectId: 'subj_6', teacherId: 'teacher_2' },
    '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
  },
  'Saturday': {
    '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_2' },
    '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_2' },
  },
};

CORE_DEMO_DATA.timetable['SSS 1B'] = {
  'Monday': {
    '8:00 - 9:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
    '9:00 - 10:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
    '10:00 - 11:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
    '11:00 - 12:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
    '1:00 - 2:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
  },
  'Tuesday': {
    '8:00 - 9:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
    '9:00 - 10:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
    '10:00 - 11:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
    '11:00 - 12:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
    '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
  },
  'Wednesday': {
    '8:00 - 9:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
    '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
    '10:00 - 11:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
    '11:00 - 12:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
    '1:00 - 2:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
  },
  'Thursday': {
    '8:00 - 9:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
    '9:00 - 10:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
    '10:00 - 11:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
    '11:00 - 12:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
    '1:00 - 2:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
  },
  'Friday': {
    '8:00 - 9:00': { subjectId: 'subj_2', teacherId: 'teacher_1' },
    '9:00 - 10:00': { subjectId: 'subj_1', teacherId: 'teacher_1' },
    '10:00 - 11:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
    '11:00 - 12:00': { subjectId: 'subj_8', teacherId: 'teacher_1' },
    '1:00 - 2:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
  },
  'Saturday': {
    '9:00 - 10:00': { subjectId: 'subj_3', teacherId: 'teacher_1' },
    '10:00 - 11:00': { subjectId: 'subj_7', teacherId: 'teacher_1' },
  },
};

// --- Assignments Demo Data ---
// Provides sample assignments across demo classes for both teacher and student views
CORE_DEMO_DATA.assignments = [
    {
        id: 'asg_jss1_math_worksheet',
        class: 'JSS 1A',
        title: 'Mathematics Worksheet: Fractions & Decimals',
        description: 'Solve 10 problems on adding fractions and converting decimals. Show working.',
        subjectId: 'subj_1',
        dueDate: '2025-11-05',
        maxScore: 20,
        type: 'Homework'
    },
    {
        id: 'asg_jss1_basic_science_quiz',
        class: 'JSS 1A',
        title: 'Basic Science Quiz: States of Matter',
        description: 'Short quiz covering solids, liquids, and gases. Multiple choice.',
        subjectId: 'subj_4',
        dueDate: '2025-10-25',
        maxScore: 10,
        type: 'Quiz'
    },
    {
        id: 'asg_sss2_physics_lab',
        class: 'SSS 2A',
        title: 'Physics Lab Report: Projectile Motion',
        description: 'Conduct the projectile motion experiment and submit a detailed lab report with calculations and graphs.',
        subjectId: 'subj_3',
        dueDate: '2025-10-28',
        maxScore: 30,
        type: 'Lab Report'
    },
    {
        id: 'asg_pri4_english_spelling',
        class: 'Primary 4A',
        title: 'English Spelling Quiz: Week 6',
        description: 'Spell 15 new vocabulary words correctly. Practice before the quiz.',
        subjectId: 'subj_2',
        dueDate: '2025-11-02',
        maxScore: 15,
        type: 'Quiz'
    },
    {
        id: 'asg_nur1_counting_practice',
        class: 'Nursery 1A',
        title: 'Number Work: Counting to 20',
        description: 'Practice counting from 1 to 20 and circle the correct number of objects.',
        subjectId: 'subj_5',
        dueDate: '2025-10-30',
        maxScore: 10,
        type: 'Classwork'
    }
] as any;

// Add varied assignments with staggered due dates
CORE_DEMO_DATA.assignments.push(
  {
    id: 'asg_sss1b_bio_field_project',
    class: 'SSS 1B',
    title: 'Biology Field Project: Ecosystem Survey',
    description: 'Conduct a local ecosystem survey, record observations, and submit a project report with photos.',
    subjectId: 'subj_8',
    dueDate: '2025-11-08',
    maxScore: 25,
    type: 'Project'
  },
  {
    id: 'asg_pri5_math_mental_oral',
    class: 'Primary 5A',
    title: 'Mathematics Mental Drill: Oral Session',
    description: 'Oral mental arithmetic round on addition, subtraction, and multiplication.',
    subjectId: 'subj_1',
    dueDate: '2025-11-03',
    maxScore: 10,
    type: 'Oral Presentation'
  },
  {
    id: 'asg_jss1_civic_debate',
    class: 'JSS 1A',
    title: 'Civic Education Debate: Rights & Responsibilities',
    description: 'Class debate on student rights and responsibilities. Points awarded for clarity and teamwork.',
    subjectId: 'subj_9',
    dueDate: '2025-11-06',
    maxScore: 20,
    type: 'Classwork'
  },
  {
    id: 'asg_sss2_chem_midterm',
    class: 'SSS 2A',
    title: 'Chemistry Midterm Assessment',
    description: 'Structured midterm covering stoichiometry, acids/bases, and bonding.',
    subjectId: 'subj_7',
    dueDate: '2025-11-10',
    maxScore: 40,
    type: 'Midterm'
  },
  {
    id: 'asg_pri4_computer_poster',
    class: 'Primary 4A',
    title: 'Computer Studies: Safety Poster',
    description: 'Create a poster showing smart computer usage and internet safety tips.',
    subjectId: 'subj_13',
    dueDate: '2025-11-04',
    maxScore: 15,
    type: 'Project'
  },
  {
    id: 'asg_nur1_phonics_oral',
    class: 'Nursery 1A',
    title: 'Phonics Oral Presentation: Letter Sounds',
    description: 'Recite letter sounds A–Z in class. Gentle scoring for participation and confidence.',
    subjectId: 'subj_2',
    dueDate: '2025-11-07',
    maxScore: 10,
    type: 'Oral Presentation'
  }
);

CORE_DEMO_DATA.assignment_scores = [
    // JSS 1A: graded quiz
    { id: 'asgscore_asg_jss1_basic_science_quiz_stud_1', assignmentId: 'asg_jss1_basic_science_quiz', studentId: 'stud_1', score: 9, comment: 'Great understanding of basic concepts.' },
    { id: 'asgscore_asg_jss1_basic_science_quiz_stud_2', assignmentId: 'asg_jss1_basic_science_quiz', studentId: 'stud_2', score: 6, comment: 'Study states of matter again and practice more.' },
    // SSS 2A: graded lab report
    { id: 'asgscore_asg_sss2_physics_lab_stud_3', assignmentId: 'asg_sss2_physics_lab', studentId: 'stud_3', score: 24, comment: 'Accurate calculations, improve on discussion section.' },
    { id: 'asgscore_asg_sss2_physics_lab_stud_4', assignmentId: 'asg_sss2_physics_lab', studentId: 'stud_4', score: 27, comment: 'Well-structured report and clear graphs.' },
    // Primary 4A: upcoming spelling quiz (no scores yet)
    // Nursery 1A: upcoming classwork (no scores yet)
] as any;

// Pre-populate more assignment scores for visibility across dashboards
CORE_DEMO_DATA.assignment_scores.push(
  // JSS 1A civic debate
  { id: 'asgscore_asg_jss1_civic_debate_stud_1', assignmentId: 'asg_jss1_civic_debate', studentId: 'stud_1', score: 18, comment: 'Strong points and teamwork.' },
  { id: 'asgscore_asg_jss1_civic_debate_stud_2', assignmentId: 'asg_jss1_civic_debate', studentId: 'stud_2', score: 12, comment: 'Good effort; work on clarity.' },
  // SSS 2A chemistry midterm
  { id: 'asgscore_asg_sss2_chem_midterm_stud_3', assignmentId: 'asg_sss2_chem_midterm', studentId: 'stud_3', score: 30, comment: 'Solid stoichiometry; missed a few acid/base questions.' },
  { id: 'asgscore_asg_sss2_chem_midterm_stud_4', assignmentId: 'asg_sss2_chem_midterm', studentId: 'stud_4', score: 34, comment: 'Excellent bonding section; minor arithmetic errors.' },
  // Primary 4A computer poster
  { id: 'asgscore_asg_pri4_computer_poster_stud_5', assignmentId: 'asg_pri4_computer_poster', studentId: 'stud_5', score: 13, comment: 'Creative poster and clear tips.' },
  // Nursery 1A phonics oral
  { id: 'asgscore_asg_nur1_phonics_oral_stud_6', assignmentId: 'asg_nur1_phonics_oral', studentId: 'stud_6', score: 9, comment: 'Confident recitation; few hesitations.' }
);

// --- Detailed Student Generator for Performance Testing ---

const firstNamesMale = ["Ade", "Bayo", "Chidi", "Dike", "Emeka", "Femi", "Gozie", "Haruna", "Ike", "Jide", "Kola", "Lanre", "Musa", "Nnamdi", "Obi", "Paul", "Quadri", "Rotimi", "Segun", "Tunde"];
const firstNamesFemale = ["Ada", "Bisi", "Chidinma", "Dolapo", "Ezinne", "Funke", "Gift", "Habiba", "Ify", "Jumoke", "Kemi", "Lola", "Mercy", "Ngozi", "Ola", "Peace", "Queen", "Risi", "Sade", "Titi"];
const lastNames = ["Okafor", "Adekunle", "Bello", "Okoro", "Popoola", "Nwachukwu", "Abubakar", "Lawal", "Ugwu", "Ojo", "Sowore", "Bankole", "David", "Eze", "Mohammed"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDetailedStudentData = (count: number, subjects: Subject[], settings: SchoolSettings) => {
    const data: { students: Student[], parents: Parent[], scores: Score[], invoices: Invoice[], remarks: Remark[] } = {
        students: [], parents: [], scores: [], invoices: [], remarks: []
    };

    const performanceProfiles = ['excellent', 'good', 'average', 'poor'];
    const classNames = ['JSS 1B', 'JSS 2A', 'JSS 2B', 'JSS 3A', 'SSS 1A', 'SSS 1B', 'SSS 2A', 'SSS 2B', 'Primary 5A'];

    for (let i = 0; i < count; i++) {
        const gender = getRandom(['Male', 'Female']);
        const firstName = gender === 'Male' ? getRandom(firstNamesMale) : getRandom(firstNamesFemale);
        const lastName = getRandom(lastNames);
        const name = `${firstName} ${lastName}`;
        const studentClass = getRandom(classNames);

        const studentId = `perf_stud_${i}`;
        const parentId = `perf_parent_${i}`;
        
        data.students.push({
            id: studentId, name, admissionNo: `PERF-${i.toString().padStart(3, '0')}`,
            class: studentClass, gender, parentId, parentEmail: `parent.perf${i}@example.com`,
            status: 'active', created_at: new Date().toISOString()
        });

        data.parents.push({ id: parentId, name: `Mr. & Mrs. ${lastName}`, email: `parent.perf${i}@example.com` });

        const profile = getRandom(performanceProfiles);
        const subjectsForClass = subjects.filter(s => s.classes.includes(studentClass));
        let totalScoreSum = 0;
        let subjectCount = 0;

        subjectsForClass.forEach(subject => {
            let min, max;
            switch(profile) {
                case 'excellent': min = 75; max = 98; break;
                case 'good': min = 60; max = 74; break;
                case 'average': min = 45; max = 59; break;
                case 'poor': min = 20; max = 44; break;
                default: min = 50; max = 65;
            }
            const total = getRandomInt(min, max);
            const totalMax = settings.maxCa1 + settings.maxCa2 + settings.maxExam;
            const ca1 = Math.round((total / totalMax) * settings.maxCa1) + getRandomInt(-2, 2);
            const ca2 = Math.round((total / totalMax) * settings.maxCa2) + getRandomInt(-2, 2);
            const exam = total - ca1 - ca2;
            
            totalScoreSum += total;
            subjectCount++;

            data.scores.push({
                studentId, subjectId: subject.id, session: settings.session, term: settings.term,
                ca1: Math.max(0, Math.min(settings.maxCa1, ca1)),
                ca2: Math.max(0, Math.min(settings.maxCa2, ca2)),
                exam: Math.max(0, Math.min(settings.maxExam, exam)),
            });
        });

        let generalComment = '';
        const avg = subjectCount > 0 ? totalScoreSum / subjectCount : 0;
        if (avg >= 75) generalComment = `${firstName} is an exceptional student with outstanding results. Keep up the brilliant work.`;
        else if (avg >= 60) generalComment = `${firstName} has a good grasp of concepts and performs well. A little more focus will yield excellent results.`;
        else if (avg >= 45) generalComment = `${firstName}'s performance is average. There is room for improvement with more dedication and practice.`;
        else generalComment = `There are significant concerns about ${firstName}'s academic performance. Urgent attention is required.`;
        
        data.remarks.push({ studentId, session: settings.session, term: settings.term, generalComment });

        const invoiceStatus = getRandom(['paid', 'partially-paid', 'unpaid']);
        const totalAmount = studentClass.startsWith('SSS') ? 100000 : 75000;
        let amountPaid = 0;
        if (invoiceStatus === 'paid') amountPaid = totalAmount;
        if (invoiceStatus === 'partially-paid') amountPaid = totalAmount / 2;
        
        data.invoices.push({
            id: `inv_perf_${i}`, studentId, class: studentClass, session: settings.session, term: settings.term,
            issueDate: '2023-09-01', dueDate: '2023-09-30', totalAmount, amountPaid,
            status: invoiceStatus as Invoice['status'], items: [{ description: 'School Fees', amount: totalAmount }]
        });
    }
    return data;
};

// Generate and merge detailed data for performance testing
const detailedDummyData = generateDetailedStudentData(94, CORE_DEMO_DATA.subjects, CORE_DEMO_DATA.settings);

CORE_DEMO_DATA.students.push(...detailedDummyData.students);
CORE_DEMO_DATA.parents.push(...detailedDummyData.parents);
CORE_DEMO_DATA.scores.push(...detailedDummyData.scores);
CORE_DEMO_DATA.invoices.push(...detailedDummyData.invoices);
CORE_DEMO_DATA.remarks.push(...detailedDummyData.remarks);

// --- Explicit JSS 1A demo seeding ---
const addJss1ADemoStudents = (count: number) => {
  const subjectsForJss1A = CORE_DEMO_DATA.subjects.filter(s => s.classes.includes('JSS 1A'));
  const settings = CORE_DEMO_DATA.settings;
  const totalMax = settings.maxCa1 + settings.maxCa2 + settings.maxExam;

  for (let i = 1; i <= count; i++) {
    const gender = getRandom(['Male', 'Female']);
    const firstName = gender === 'Male' ? getRandom(firstNamesMale) : getRandom(firstNamesFemale);
    const lastName = getRandom(lastNames);
    const name = `${firstName} ${lastName}`;

    const studentId = `jss1a_stud_${i}`;
    const parentId = `jss1a_parent_${i}`;

    CORE_DEMO_DATA.students.push({
      id: studentId,
      name,
      admissionNo: `JSS1A-${i.toString().padStart(3, '0')}`,
      class: 'JSS 1A',
      gender,
      parentId,
      parentEmail: `parent.jss1a${i}@example.com`,
      status: 'active',
      created_at: new Date().toISOString()
    });

    CORE_DEMO_DATA.parents.push({ id: parentId, name: `Mr. & Mrs. ${lastName}`, email: `parent.jss1a${i}@example.com` });

    let totalScoreSum = 0;
    let subjectCount = 0;

    subjectsForJss1A.forEach(subject => {
      const desiredTotal = getRandomInt(40, 95);
      let ca1 = Math.round((desiredTotal / totalMax) * settings.maxCa1) + getRandomInt(-2, 2);
      let ca2 = Math.round((desiredTotal / totalMax) * settings.maxCa2) + getRandomInt(-2, 2);
      let exam = desiredTotal - ca1 - ca2;

      ca1 = Math.max(0, Math.min(settings.maxCa1, ca1));
      ca2 = Math.max(0, Math.min(settings.maxCa2, ca2));
      exam = Math.max(0, Math.min(settings.maxExam, exam));

      const total = ca1 + ca2 + exam;
      totalScoreSum += total;
      subjectCount++;

      CORE_DEMO_DATA.scores.push({
        studentId,
        subjectId: subject.id,
        session: settings.session,
        term: settings.term,
        ca1,
        ca2,
        exam
      });
    });

    const avg = subjectCount > 0 ? Math.round(totalScoreSum / subjectCount) : 0;
    let generalComment = '';
    if (avg >= 75) generalComment = `${firstName} demonstrates excellent performance and leadership in class.`;
    else if (avg >= 60) generalComment = `${firstName} has good understanding; continued effort will yield excellent results.`;
    else if (avg >= 45) generalComment = `${firstName} is making steady progress; more practice recommended.`;
    else generalComment = `${firstName} needs significant improvement; targeted support advised.`;

    CORE_DEMO_DATA.remarks.push({ studentId, session: settings.session, term: settings.term, generalComment });
  }
};

addJss1ADemoStudents(20);

// Backfill missing scores for all JSS 1A students
const backfillJss1AScores = () => {
  const settings = CORE_DEMO_DATA.settings;
  const session = settings.session;
  const term = settings.term;
  const subjectsForJss1A = CORE_DEMO_DATA.subjects.filter(s => s.classes.includes('JSS 1A'));
  const totalMax = settings.maxCa1 + settings.maxCa2 + settings.maxExam;
  const jss1AStudents = CORE_DEMO_DATA.students.filter(s => s.class === 'JSS 1A');

  jss1AStudents.forEach(student => {
    subjectsForJss1A.forEach(subject => {
      const exists = CORE_DEMO_DATA.scores.some(sc =>
        sc.studentId === student.id &&
        sc.subjectId === subject.id &&
        sc.session === session &&
        sc.term === term
      );
      if (!exists) {
        const desiredTotal = getRandomInt(35, 92);
        let ca1 = Math.round((desiredTotal / totalMax) * settings.maxCa1) + getRandomInt(-2, 2);
        let ca2 = Math.round((desiredTotal / totalMax) * settings.maxCa2) + getRandomInt(-2, 2);
        let exam = desiredTotal - ca1 - ca2;
        ca1 = Math.max(0, Math.min(settings.maxCa1, ca1));
        ca2 = Math.max(0, Math.min(settings.maxCa2, ca2));
        exam = Math.max(0, Math.min(settings.maxExam, exam));
        CORE_DEMO_DATA.scores.push({ studentId: student.id, subjectId: subject.id, session, term, ca1, ca2, exam });
      }
    });

    const hasRemark = CORE_DEMO_DATA.remarks.some(r => r.studentId === student.id && r.session === session && r.term === term);
    if (!hasRemark) {
      const totals = CORE_DEMO_DATA.scores
        .filter(sc => sc.studentId === student.id && sc.session === session && sc.term === term)
        .map(sc => (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0));
      const avg = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
      const firstName = (student.name || '').split(' ')[0] || 'Student';
      let generalComment = '';
      if (avg >= 75) generalComment = `${firstName} demonstrates excellent performance and leadership in class.`;
      else if (avg >= 60) generalComment = `${firstName} has good understanding; continued effort will yield excellent results.`;
      else if (avg >= 45) generalComment = `${firstName} is making steady progress; more practice recommended.`;
      else generalComment = `${firstName} needs significant improvement; targeted support advised.`;
      CORE_DEMO_DATA.remarks.push({ studentId: student.id, session, term, generalComment });
    }
  });
};

backfillJss1AScores();

// --- Finance Demo Data: Income & Expenses ---
(() => {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  // Seed Income records (recent 60 days)
  const incomeSeed: Income[] = [
    { id: 'inc_001', date: fmt(daysAgo(3)), description: 'PTA Fundraising Gala', category: 'Fundraising', amount: 850000 },
    { id: 'inc_002', date: fmt(daysAgo(7)), description: 'Alumni Donation (Batch 2012)', category: 'Donation', amount: 350000 },
    { id: 'inc_003', date: fmt(daysAgo(10)), description: 'Local Government Education Grant', category: 'Grant', amount: 1200000 },
    { id: 'inc_004', date: fmt(daysAgo(14)), description: 'Community Development Fund', category: 'Grant', amount: 500000 },
    { id: 'inc_005', date: fmt(daysAgo(18)), description: 'Staff Cooperative Donation', category: 'Donation', amount: 150000 },
    { id: 'inc_006', date: fmt(daysAgo(22)), description: 'Sports Day Fundraiser', category: 'Fundraising', amount: 210000 },
    { id: 'inc_007', date: fmt(daysAgo(26)), description: 'Book Fair Proceeds', category: 'Fundraising', amount: 175000 },
    { id: 'inc_008', date: fmt(daysAgo(32)), description: 'NGO STEM Program Support', category: 'Grant', amount: 400000 },
    { id: 'inc_009', date: fmt(daysAgo(41)), description: 'Parents Anonymous Donation', category: 'Donation', amount: 90000 },
    { id: 'inc_010', date: fmt(daysAgo(55)), description: 'General Support', category: 'Other', amount: 60000 },
  ];

  CORE_DEMO_DATA.income.push(...incomeSeed);

  // Seed Expense records (recent 60 days)
  const expenseSeed: Expense[] = [
    { id: 'exp_001', date: fmt(daysAgo(2)), description: 'Generator diesel (2 weeks)', category: 'Utilities', amount: 280000 },
    { id: 'exp_002', date: fmt(daysAgo(5)), description: 'Science lab reagents', category: 'Supplies', amount: 145000 },
    { id: 'exp_003', date: fmt(daysAgo(9)), description: 'Roof leak repair (Block B)', category: 'Maintenance', amount: 320000 },
    { id: 'exp_004', date: fmt(daysAgo(12)), description: 'Internet subscription (monthly)', category: 'Utilities', amount: 95000 },
    { id: 'exp_005', date: fmt(daysAgo(16)), description: 'Classroom whiteboards (4 units)', category: 'Operational', amount: 210000 },
    { id: 'exp_006', date: fmt(daysAgo(20)), description: 'Printing exam papers', category: 'Operational', amount: 125000 },
    { id: 'exp_007', date: fmt(daysAgo(24)), description: 'Textbooks for JSS 1', category: 'Supplies', amount: 380000 },
    { id: 'exp_008', date: fmt(daysAgo(28)), description: 'Staff payroll (October)', category: 'payroll', amount: 6400000 },
    { id: 'exp_009', date: fmt(daysAgo(35)), description: 'Library AC servicing', category: 'Maintenance', amount: 85000 },
    { id: 'exp_010', date: fmt(daysAgo(50)), description: 'Security services (monthly)', category: 'Operational', amount: 300000 },
  ];

  CORE_DEMO_DATA.expenses.push(...expenseSeed);
})();

// --- Attendance Demo Data ---
(() => {
  // Generate attendance for last 14 school days across key classes
  const classes = ['JSS 1A', 'SSS 2A', 'Primary 4A', 'Nursery 1A', 'Primary 5A', 'SSS 1B'];
  const today = new Date();

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const minusDays = (base: Date, n: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() - n);
    return d;
  };

  const isWeekend = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6; // Sunday/Saturday
  };

  const pickStatus = (): 'present' | 'absent' | 'late' => {
    const r = Math.random();
    if (r < 0.88) return 'present';
    if (r < 0.94) return 'late';
    return 'absent';
  };

  // Create 14 recent weekdays of attendance
  let createdDays = 0;
  let offset = 1;
  while (createdDays < 14) {
    const date = minusDays(today, offset);
    offset++;
    if (isWeekend(date)) continue;
    createdDays++;

    classes.forEach(cls => {
      const students = CORE_DEMO_DATA.students.filter(s => s.class === cls);
      if (!students.length) return;
      const statuses: Record<string, 'present' | 'absent' | 'late'> = {};
      students.forEach(s => {
        statuses[s.id] = pickStatus();
      });
      const record: AttendanceRecord = {
        date: fmt(date),
        class: cls,
        statuses
      };
      CORE_DEMO_DATA.attendance.push(record);
    });
  }
})();

// --- Extra Assignments Top-up (ensure broader coverage) ---
CORE_DEMO_DATA.assignments.push(
  {
    id: 'asg_sss1b_chem_practical',
    class: 'SSS 1B',
    title: 'Chemistry Practical: Separation Techniques',
    description: 'Perform filtration and distillation; submit lab notes and conclusions.',
    subjectId: 'subj_7',
    dueDate: '2025-11-12',
    maxScore: 20,
    type: 'Lab Report'
  },
  {
    id: 'asg_pri5_english_comprehension',
    class: 'Primary 5A',
    title: 'English Comprehension Passage',
    description: 'Read the passage and answer 10 questions clearly and neatly.',
    subjectId: 'subj_2',
    dueDate: '2025-11-09',
    maxScore: 10,
    type: 'Classwork'
  }
);
