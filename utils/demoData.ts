import { Tenant, Student, Subject, SchoolSettings, Score, Teacher, Parent, Invoice, FeeStructure, BehavioralLogEntry, Remark, AttendanceRecord, Assignment, AssignmentScore, Expense, Income, Payslip, PayrollRun, Payment, CommunicationLog, MessageTemplate, ScheduledReminder, ScheduledCampaign, Event, AbsenceReport, TeacherAttendanceRecord, ActivityLog, SharedLessonPlan } from '../types';
import { CBTExam } from '../types/cbt';

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

        // SECOND TERM 2023/2024 DATA
        // Adekunle Gold - Second Term (slight improvement)
        { studentId: 'stud_1', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 19, ca2: 18, exam: 58 },
        { studentId: 'stud_1', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 20, ca2: 19, exam: 59 },
        { studentId: 'stud_1', subjectId: 'subj_4', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 20, exam: 52 },
        // Bisiola Adebayo - Second Term (showing improvement)
        { studentId: 'stud_2', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 8, ca2: 12, exam: 28 },
        { studentId: 'stud_2', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 13, ca2: 14, exam: 35 },
        { studentId: 'stud_2', subjectId: 'subj_4', session: '2023/2024', term: 'Second Term', ca1: 10, ca2: 11, exam: 30 },
        // Chinedu Okoro - Second Term (steady performance)
        { studentId: 'stud_3', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 16, ca2: 15, exam: 42 },
        { studentId: 'stud_3', subjectId: 'subj_3', session: '2023/2024', term: 'Second Term', ca1: 17, ca2: 16, exam: 47 },
        // Damilola Fashola - Second Term
        { studentId: 'stud_4', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 17, ca2: 16, exam: 50 },
        { studentId: 'stud_4', subjectId: 'subj_3', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 17, exam: 52 },
        // Emeka Nwosu - Second Term (Primary 4A)
        { studentId: 'stud_5', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 16, ca2: 17, exam: 48 },
        { studentId: 'stud_5', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 16, exam: 50 },
        { studentId: 'stud_5', subjectId: 'subj_6', session: '2023/2024', term: 'Second Term', ca1: 15, ca2: 17, exam: 45 },
        // Fatima Bello - Second Term (Nursery 1A)
        { studentId: 'stud_6', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 19, exam: 56 },
        { studentId: 'stud_6', subjectId: 'subj_5', session: '2023/2024', term: 'Second Term', ca1: 19, ca2: 18, exam: 54 },

        // THIRD TERM 2023/2024 DATA
        // Adekunle Gold - Third Term (consistent excellence)
        { studentId: 'stud_1', subjectId: 'subj_1', session: '2023/2024', term: 'Third Term', ca1: 20, ca2: 19, exam: 60 },
        { studentId: 'stud_1', subjectId: 'subj_2', session: '2023/2024', term: 'Third Term', ca1: 19, ca2: 20, exam: 58 },
        { studentId: 'stud_1', subjectId: 'subj_4', session: '2023/2024', term: 'Third Term', ca1: 19, ca2: 18, exam: 55 },
        // Bisiola Adebayo - Third Term (continued improvement)
        { studentId: 'stud_2', subjectId: 'subj_1', session: '2023/2024', term: 'Third Term', ca1: 12, ca2: 15, exam: 32 },
        { studentId: 'stud_2', subjectId: 'subj_2', session: '2023/2024', term: 'Third Term', ca1: 15, ca2: 16, exam: 38 },
        { studentId: 'stud_2', subjectId: 'subj_4', session: '2023/2024', term: 'Third Term', ca1: 13, ca2: 14, exam: 35 },

        // PREVIOUS SESSION 2022/2023 DATA
        // Adekunle Gold - Third Term Previous Session (showing growth over time)
        { studentId: 'stud_1', subjectId: 'subj_1', session: '2022/2023', term: 'Third Term', ca1: 16, ca2: 17, exam: 52 },
        { studentId: 'stud_1', subjectId: 'subj_2', session: '2022/2023', term: 'Third Term', ca1: 18, ca2: 16, exam: 54 },
        { studentId: 'stud_1', subjectId: 'subj_4', session: '2022/2023', term: 'Third Term', ca1: 15, ca2: 18, exam: 48 },
        // Bisiola Adebayo - Previous Session (showing she struggled earlier too)
        { studentId: 'stud_2', subjectId: 'subj_1', session: '2022/2023', term: 'Third Term', ca1: 4, ca2: 6, exam: 18 },
        { studentId: 'stud_2', subjectId: 'subj_2', session: '2022/2023', term: 'Third Term', ca1: 8, ca2: 10, exam: 25 },
        { studentId: 'stud_2', subjectId: 'subj_4', session: '2022/2023', term: 'Third Term', ca1: 6, ca2: 8, exam: 22 },
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
    remarks: [
        // FIRST TERM 2023/2024
        { studentId: 'stud_1', session: '2023/2024', term: 'First Term', generalComment: 'Adekunle demonstrates excellent performance and leadership in class.' },
        { studentId: 'stud_2', session: '2023/2024', term: 'First Term', generalComment: 'Bisiola needs significant improvement; targeted support advised.' },
        { studentId: 'stud_3', session: '2023/2024', term: 'First Term', generalComment: 'Chinedu is making steady progress; more practice recommended.' },
        { studentId: 'stud_4', session: '2023/2024', term: 'First Term', generalComment: 'Damilola has good understanding; continued effort will yield excellent results.' },
        { studentId: 'stud_5', session: '2023/2024', term: 'First Term', generalComment: 'Emeka has good grasp of concepts and performs well.' },
        { studentId: 'stud_6', session: '2023/2024', term: 'First Term', generalComment: 'Fatima demonstrates excellent performance and leadership in class.' },

        // SECOND TERM 2023/2024
        { studentId: 'stud_1', session: '2023/2024', term: 'Second Term', generalComment: 'Adekunle continues to show exceptional performance with consistent excellence across subjects.' },
        { studentId: 'stud_2', session: '2023/2024', term: 'Second Term', generalComment: 'Bisiola shows marked improvement this term; continue with targeted intervention programs.' },
        { studentId: 'stud_3', session: '2023/2024', term: 'Second Term', generalComment: 'Chinedu maintains steady progress; encouragement to pursue more challenging materials.' },
        { studentId: 'stud_4', session: '2023/2024', term: 'Second Term', generalComment: 'Damilola demonstrates good performance and positive attitude toward learning.' },
        { studentId: 'stud_5', session: '2023/2024', term: 'Second Term', generalComment: 'Emeka displays improved focus and better grasp of fundamental concepts.' },
        { studentId: 'stud_6', session: '2023/2024', term: 'Second Term', generalComment: 'Fatima maintains excellent performance with great participation in class activities.' },

        // THIRD TERM 2023/2024
        { studentId: 'stud_1', session: '2023/2024', term: 'Third Term', generalComment: 'Adekunle achieves outstanding results with perfect consistency; an exemplary student.' },
        { studentId: 'stud_2', session: '2023/2024', term: 'Third Term', generalComment: 'Bisiola continues improving trajectory; with sustained effort, will achieve average performance.' },
        { studentId: 'stud_3', session: '2023/2024', term: 'Third Term', generalComment: 'Chinedu demonstrates consistent average performance; more determination needed for excellence.' },

        // PREVIOUS SESSION 2022/2023
        { studentId: 'stud_1', session: '2022/2023', term: 'Third Term', generalComment: 'Adekunle showed very good performance with strong fundamentals and dedication.' },
        { studentId: 'stud_2', session: '2022/2023', term: 'Third Term', generalComment: 'Bisiola struggled significantly this term; requires comprehensive academic support.' },
    ] as Remark[],
    behavioralRecords: [] as BehavioralLogEntry[],
    behavioral_log: [] as BehavioralLogEntry[],
    attendance: [] as AttendanceRecord[],
    expenses: [] as Expense[],
    income: [] as Income[],
    assignments: [] as Assignment[],
    assignment_scores: [] as AssignmentScore[],
    payments: [] as Payment[],
    communication_logs: [] as CommunicationLog[],
    message_templates: [] as MessageTemplate[],
    scheduled_reminders: [] as ScheduledReminder[],
    scheduled_campaigns: [] as ScheduledCampaign[],
    events: [] as Event[],
    absence_reports: [] as AbsenceReport[],
    activity_log: [] as ActivityLog[],
    teacher_attendance: [] as TeacherAttendanceRecord[],
    fee_structures: [] as any[],
    payment_methods: [] as any[],
    shared_lesson_plans: [] as SharedLessonPlan[],
    cbt_exams: [] as CBTExam[],
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
            nextTermBeginsDate: 'Sept 16, 2024',
            sections: [], affectiveSkills: [], psychomotorSkills: [],
            classicOptions: {
                showLogo: true,
                showStudentPhoto: true,
                showAttendance: true,
                showAffective: true,
                showPsychomotor: true,
                showGradeScale: true,
                showPerformance: true,
                showGradeAnalysis: true,
                showRatingIndices: true,
                summariesLocation: 'below_subjects',
            },
            classicTheme: {
                headerColor: '#4f81bd',
                bandColor: '#d9e1f2',
                borderWidth: 1,
                textScale: 1.0,
            },
            classicHeaderTitle: '',
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

// --- Demo Payroll Seeding ---
(() => {
  const teachers: Teacher[] = (CORE_DEMO_DATA as any).teachers || [];
  if (!teachers || teachers.length === 0) return;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const calculatePayslipFor = (teacher: Teacher): Payslip => {
    const grossMonthlyPay = (teacher as any).baseSalary || 80000;
    const grossAnnualPay = grossMonthlyPay * 12;
    const annualBasic = grossAnnualPay * 0.5;
    const annualHousing = grossAnnualPay * 0.3;
    const annualTransport = grossAnnualPay * 0.2;
    const pensionableEmoluments = annualBasic + annualHousing + annualTransport;
    const employeePensionContributionAnnual = pensionableEmoluments * 0.08;
    const consolidatedReliefAllowance = Math.max(200000, grossAnnualPay * 0.01) + (grossAnnualPay * 0.20);
    const taxableIncomeAnnual = grossAnnualPay - consolidatedReliefAllowance - employeePensionContributionAnnual;

    // PAYE calculation following brackets used in PayrollDashboard
    const brackets = [
      { limit: 300000, rate: 0.07 },
      { limit: 300000, rate: 0.11 },
      { limit: 500000, rate: 0.15 },
      { limit: 500000, rate: 0.19 },
      { limit: 1600000, rate: 0.21 },
      { limit: Infinity, rate: 0.24 },
    ];
    let remaining = Math.max(0, taxableIncomeAnnual);
    let payeAnnual = 0;
    for (const b of brackets) {
      if (remaining <= 0) break;
      const taxed = Math.min(remaining, b.limit);
      payeAnnual += taxed * b.rate;
      remaining -= taxed;
    }

    const payeMonthly = payeAnnual / 12;
    const employeePensionMonthly = employeePensionContributionAnnual / 12;

    const baseSalary = annualBasic / 12;
    const allowances = [
      { name: 'Housing Allowance', amount: annualHousing / 12 },
      { name: 'Transport Allowance', amount: annualTransport / 12 },
    ];
    const deductions = [
      { name: 'PAYE Tax', amount: payeMonthly },
      { name: 'Pension (8%)', amount: employeePensionMonthly },
    ];
    const grossPay = grossMonthlyPay;
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
    const netPay = grossPay - totalDeductions;

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      baseSalary,
      allowances,
      deductions,
      grossPay,
      totalDeductions,
      netPay,
    };
  };

  const payslips: Payslip[] = teachers.map(t => calculatePayslipFor(t));
  const totalNet = payslips.reduce((sum, p) => sum + p.netPay, 0);
  const run: PayrollRun = {
    id: `run_demo_${year}_${month}`,
    month,
    year,
    runDate: new Date().toISOString(),
    totalNet,
    payslips,
  };

  (CORE_DEMO_DATA as any).payroll = [ { id: 1, runs: [run] } ];
})();

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

(() => {
  const invoices = CORE_DEMO_DATA.invoices;
  const payments: Payment[] = [];
  const add = (invoiceId: string, studentId: string, amt: number, status: 'verified' | 'pending' | 'failed', method: 'Cash' | 'Bank Transfer' | 'Card', ref: string) => {
    payments.push({ id: `pay_${invoiceId}_${ref}`, invoiceId, studentId, amount: amt, paymentDate: new Date().toISOString().split('T')[0], method, reference: ref, status } as any);
  };
  const inv1 = invoices.find(i => i.id === 'inv_1');
  if (inv1) add(inv1.id, inv1.studentId, inv1.totalAmount, 'verified', 'Cash', 'RCPT-001');
  const inv2 = invoices.find(i => i.id === 'inv_2');
  if (inv2) {
    add(inv2.id, inv2.studentId, Math.floor(inv2.totalAmount / 2), 'pending', 'Bank Transfer', 'TRF-AB12');
  }
  const inv3 = invoices.find(i => i.id === 'inv_3');
  if (inv3) add(inv3.id, inv3.studentId, inv3.amountPaid || Math.floor(inv3.totalAmount / 2), 'verified', 'Card', 'POS-7788');
  CORE_DEMO_DATA.payments.push(...payments);
  CORE_DEMO_DATA.fee_structures = [
    {
      id: 1,
      data: [
        { id: 'fee_jss1', name: 'JSS 1 Standard Fees', session: CORE_DEMO_DATA.settings.session, term: CORE_DEMO_DATA.settings.term, applicableClasses: ['JSS 1A'], totalAmount: 75000, items: [
          { description: 'Tuition', amount: 60000 },
          { description: 'PTA Levy', amount: 5000 },
          { description: 'Lab Fee', amount: 10000 }
        ] } as FeeStructure,
        { id: 'fee_sss2', name: 'SSS 2 Science Fees', session: CORE_DEMO_DATA.settings.session, term: CORE_DEMO_DATA.settings.term, applicableClasses: ['SSS 2A'], totalAmount: 100000, items: [
          { description: 'Tuition', amount: 80000 },
          { description: 'Science Lab', amount: 15000 },
          { description: 'PTA Levy', amount: 5000 }
        ] } as FeeStructure,
        { id: 'fee_pri4', name: 'Primary 4 Fees', session: CORE_DEMO_DATA.settings.session, term: CORE_DEMO_DATA.settings.term, applicableClasses: ['Primary 4A'], totalAmount: 60000, items: [
          { description: 'Tuition', amount: 50000 },
          { description: 'Books', amount: 8000 },
          { description: 'PTA Levy', amount: 2000 }
        ] } as FeeStructure,
        { id: 'fee_nur1', name: 'Nursery 1 Fees', session: CORE_DEMO_DATA.settings.session, term: CORE_DEMO_DATA.settings.term, applicableClasses: ['Nursery 1A'], totalAmount: 40000, items: [
          { description: 'Tuition', amount: 35000 },
          { description: 'Activity', amount: 3000 },
          { description: 'PTA Levy', amount: 2000 }
        ] } as FeeStructure,
      ]
    }
  ];
  CORE_DEMO_DATA.payment_methods = [ { id: 1, data: ['Cash', 'Bank Transfer', 'Card'] } ];
})();

(() => {
  CORE_DEMO_DATA.communication_logs.push(
    { id: 'comm_001', type: 'announcement', channel: 'sms', content: 'Welcome back! First term resumes on Monday.', recipients: ['all'], sentAt: new Date().toISOString() } as any,
    { id: 'comm_002', type: 'reminder', channel: 'email', content: 'Fees reminder: Kindly settle outstanding balances.', recipients: ['parent_1', 'parent_2'], sentAt: new Date().toISOString() } as any
  );
  CORE_DEMO_DATA.message_templates.push(
    { id: 'tmpl_term_start', name: 'Term Start Notice', type: 'email', subject: 'Term Starts', content: 'Dear Parents, the new term starts on {{date}}.' } as any
  );
  CORE_DEMO_DATA.scheduled_reminders.push(
    { id: 'rem_fee_overdue', type: 'fee_overdue', schedule: '0 9 * * MON', payload: { class: 'JSS 1A' } } as any
  );
  CORE_DEMO_DATA.scheduled_campaigns.push(
    { id: 'camp_newsletter_oct', name: 'October Newsletter', schedule: '2025-10-20', content: 'Highlights of the month', status: 'scheduled' } as any
  );
  CORE_DEMO_DATA.events.push(
    { id: 'evt_pta_meeting', title: 'PTA Meeting', date: new Date().toISOString().split('T')[0], description: 'Monthly PTA meeting', location: 'Hall A' } as any,
    { id: 'evt_sports_day', title: 'Sports Day', date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], description: 'Inter-house sports', location: 'Main Field' } as any
  );
  CORE_DEMO_DATA.absence_reports.push(
    { id: 'abs_001', studentId: 'stud_2', date: new Date().toISOString().split('T')[0], reason: 'Illness', reportedBy: 'teacher_2' } as any
  );
  CORE_DEMO_DATA.behavioral_log.push(
    { id: 'beh_001', studentId: 'stud_1', date: new Date().toISOString().split('T')[0], category: 'Leadership', description: 'Led class project successfully' } as any,
    { id: 'beh_002', studentId: 'stud_2', date: new Date().toISOString().split('T')[0], category: 'Discipline', description: 'Late to class' } as any
  );
  CORE_DEMO_DATA.activity_log.push(
    { id: 'act_001', user: 'Admin', type: 'SUBJECT_UPDATE', description: 'Updated subjects for new term', timestamp: new Date().toISOString() } as any,
    { id: 'act_002', user: 'Bursar', type: 'INVOICE_UPDATE', description: 'Processed payments for JSS 1A', timestamp: new Date().toISOString() } as any
  );
  CORE_DEMO_DATA.shared_lesson_plans.push(
    { id: 'lp_math_fractions', title: 'Fractions Basics', subjectId: 'subj_1', author: 'teacher_2', upvotes: 3, sharedAt: new Date().toISOString() } as any,
    { id: 'lp_basic_science_matter', title: 'States of Matter', subjectId: 'subj_4', author: 'teacher_2', upvotes: 2, sharedAt: new Date().toISOString() } as any
  );
})();

(() => {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString();
  const entries: TeacherAttendanceRecord[] = [];
  const pushDay = (teacherId: string, offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    entries.push({ teacherId, tenantId: DEMO_TENANT_ID, timestamp: fmt(d), status: 'present', lat: 6.5244, lng: 3.3792, accuracy_m: 25, method: 'geofence' } as any);
  };
  ['teacher_2', 'teacher_1'].forEach(tid => {
    pushDay(tid, 1);
    pushDay(tid, 3);
    pushDay(tid, 5);
  });
  (CORE_DEMO_DATA as any).teacher_attendance = entries;
})();

(() => {
  const now = new Date();
  const addHours = (d: Date, h: number) => {
    const x = new Date(d);
    x.setHours(x.getHours() + h);
    return x;
  };
  const inDays = (d: Date, days: number, hour = 9) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    x.setHours(hour, 0, 0, 0);
    return x;
  };
  const exams: CBTExam[] = [
    {
      id: 'exam_jss1_math_midterm',
      title: 'JSS 1A Mathematics Midterm',
      description: 'Algebra basics and fractions',
      sections: [ { id: 'sec1', title: 'MCQ' } ],
      rules: { scoreEntry: { subjectId: 'subj_1', className: 'JSS 1A', term: CORE_DEMO_DATA.settings.term, examWeight: 60 }, shuffleItems: true, shuffleOptions: true, autoGradeOnSubmit: true, autoEnterScores: false },
      timeWindowStart: inDays(now, 3).toISOString(),
      timeWindowEnd: addHours(inDays(now, 3), 2).toISOString(),
      status: 'ready'
    },
    {
      id: 'exam_sss2_physics_practical',
      title: 'SSS 2A Physics Practical',
      description: 'Kinematics and projectile motion',
      sections: [ { id: 'sec1', title: 'Short Answer' } ],
      rules: { scoreEntry: { subjectId: 'subj_3', className: 'SSS 2A', term: CORE_DEMO_DATA.settings.term, examWeight: 70 }, navigation: 'linear' },
      timeWindowStart: inDays(now, 5, 10).toISOString(),
      timeWindowEnd: addHours(inDays(now, 5, 10), 3).toISOString(),
      status: 'ready'
    },
    {
      id: 'exam_pri4_english_quiz',
      title: 'Primary 4A English Quiz',
      description: 'Comprehension and vocabulary',
      sections: [ { id: 'sec1', title: 'MCQ' } ],
      rules: { scoreEntry: { subjectId: 'subj_2', className: 'Primary 4A', term: CORE_DEMO_DATA.settings.term, examWeight: 40 }, attempts: 1 },
      timeWindowStart: inDays(now, 1, 8).toISOString(),
      timeWindowEnd: addHours(inDays(now, 1, 8), 1).toISOString(),
      status: 'ready'
    },
    {
      id: 'exam_nur1_number_work_assessment',
      title: 'Nursery 1A Number Work Assessment',
      description: 'Counting and number recognition',
      sections: [ { id: 'sec1', title: 'MCQ' } ],
      rules: { scoreEntry: { subjectId: 'subj_5', className: 'Nursery 1A', term: CORE_DEMO_DATA.settings.term, examWeight: 30 } },
      timeWindowStart: inDays(now, 2, 9).toISOString(),
      timeWindowEnd: addHours(inDays(now, 2, 9), 1).toISOString(),
      status: 'ready'
    }
  ];
  (CORE_DEMO_DATA as any).cbt_exams = exams;
})();

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
