import { Tenant, Student, Subject, SchoolSettings, Score, Teacher, Parent, Invoice, FeeStructure, BehavioralLogEntry, Remark, AttendanceRecord } from '../types';

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
    } as SchoolSettings
};

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
