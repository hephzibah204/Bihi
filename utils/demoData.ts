import { USER_ROLES } from './constants';
import { SchoolSettings, Parent, Student, Message } from '../types';

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
    reportCardSettings: {
        principalName: 'Mrs. Adebayo',
        schoolMotto: 'Excellence and Integrity',
        sections: [
            { id: 'academics', title: 'Academic Performance', enabled: true },
            { id: 'attendance', title: 'Attendance Record', enabled: true },
            { id: 'affective', title: 'Affective Domain', enabled: true },
            { id: 'psychomotor', title: 'Psychomotor Skills', enabled: true },
            { id: 'comment', title: 'General Comment', enabled: true },
        ],
        affectiveSkills: [
            { id: 'skill_1', label: 'Punctuality' },
            { id: 'skill_2', label: 'Neatness' },
            { id: 'skill_3', label: 'Honesty' },
            { id: 'skill_4', label: 'Self-Control' },
        ],
        psychomotorSkills: [
            { id: 'skill_5', label: 'Handwriting' },
            { id: 'skill_6', label: 'Games & Sports' },
            { id: 'skill_7', label: 'Dexterity' },
        ]
    }
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
    { id: 'teacher_1', auth_id: 'teacher_1_auth', name: 'Mr. John Doe', email: 'johndoe@reportsheet.dev', role: USER_ROLES.ADMIN, classTeacherOf: 'JSS 1' },
    { id: 'teacher_2', auth_id: 'teacher_2_auth', name: 'Mrs. Jane Smith', email: 'janesmith@reportsheet.dev', role: USER_ROLES.TEACHER, classTeacherOf: 'JSS 2' },
    { id: 'teacher_3', auth_id: 'teacher_3_auth', name: 'Mr. Femi Adebayo', email: 'femi@reportsheet.dev', role: USER_ROLES.BURSAR, classTeacherOf: '' },
];

// Fix: Add and export demoParents
export const demoParents: Parent[] = [
    { id: 'parent_1', name: 'Mr. & Mrs. Adekunle', email: 'adekunle@family.com' },
    { id: 'parent_2', name: 'Dr. Chioma Okoro', email: 'chioma.okoro@example.com' },
];

// Fix: Rename demoStudentData to demoStudents and export it. Link students to parents.
export const demoStudents: Student[] = [
    { id: 'stud_1', name: 'Adekunle Gold', admissionNo: 'RS-001', class: 'JSS 1', gender: 'Male', dob: '2010-05-15', photo: 'https://i.imgur.com/4z1y2fn.jpeg', parentId: 'parent_1', parentEmail: 'adekunle@family.com' },
    { id: 'stud_2', name: 'Simisola Adekunle', admissionNo: 'RS-002', class: 'JSS 1', gender: 'Female', dob: '2010-08-22', photo: 'https://i.imgur.com/iAn3dI8.jpeg', parentId: 'parent_1', parentEmail: 'adekunle@family.com' },
    { id: 'stud_3', name: 'David Okoro', admissionNo: 'RS-003', class: 'JSS 2', gender: 'Male', dob: '2009-02-10', photo: 'https://i.imgur.com/zW2jZfW.jpeg', parentId: 'parent_2', parentEmail: 'chioma.okoro@example.com' },
];

export const demoMessages: Message[] = [
    {
        id: 'msg_1',
        conversationId: ['parent_1', 'teacher_1_auth'].sort().join('_'),
        senderId: 'parent_1',
        recipientId: 'teacher_1_auth',
        content: 'Good day Mr. John, I wanted to ask about Adekunle\'s performance in Mathematics.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
    },
    {
        id: 'msg_2',
        conversationId: ['parent_1', 'teacher_1_auth'].sort().join('_'),
        senderId: 'teacher_1_auth',
        recipientId: 'parent_1',
        content: 'Good day Mr. Adekunle. He is doing well, but he needs to work on his assignments and submit them on time. His test scores are quite good.',
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        read: false,
    }
];