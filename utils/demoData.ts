import { Student, Subject, Score, Remark } from '../types';

export const DEMO_TENANT_ID = 'brightstar';

export const demoTenants = [
  { id: 'brightstar', name: 'Brightstar Academy' }
];

export const demoSchoolSettings = {
  schoolName: 'Brightstar Academy',
  schoolAddress: '123 Education Lane, Knowledge City',
  session: '2023/2024',
  term: 'Second Term',
  schoolLogo: 'https://i.imgur.com/gKEBi1f.png',
  paystackPublicKey: 'pk_test_a62243685a10497577e5c54c34a873130d71a9b5',
  gradingSystem: [
    { grade: 'A', from: 75, to: 100, remark: 'Excellent' },
    { grade: 'B', from: 65, to: 74, remark: 'Very Good' },
    { grade: 'C', from: 50, to: 64, remark: 'Good' },
    { grade: 'D', from: 45, to: 49, remark: 'Pass' },
    { grade: 'E', from: 40, to: 44, remark: 'Weak' },
    { grade: 'F', from: 0, to: 39, remark: 'Fail' },
  ],
};

export const demoFees = [
    { id: 'fee_1', description: 'Tuition Fee', amount: '50000', classes: ['JSS 1', 'JSS 2'] },
    { id: 'fee_2', description: 'Development Levy', amount: '10000', classes: ['JSS 1', 'JSS 2'] },
    { id: 'fee_3', description: 'PTA Levy', amount: '5000', classes: ['JSS 1', 'JSS 2'] },
];

export const demoScratchCards = [
    { id: 'card_1', pin: '123456789012', used: false, createdAt: new Date().toISOString() }
];

export const demoStudents: Student[] = [
  { id: 'std_001', name: 'Adebayo Chukwuma', class: 'JSS 1', admissionNo: 'RS-001', gender: 'Male', dob: '2010-05-15', photo: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Adebayo', parentEmail: 'parent1@example.com' },
  { id: 'std_002', name: 'Ngozi Okoro', class: 'JSS 1', admissionNo: 'RS-002', gender: 'Female', dob: '2010-08-22', photo: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Ngozi', parentEmail: 'parent2@example.com' },
  { id: 'std_003', name: 'Emeka Nwosu', class: 'JSS 2', admissionNo: 'RS-003', gender: 'Male', dob: '2009-03-10', photo: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Emeka', parentEmail: 'parent3@example.com' },
  { id: 'std_004', name: 'Fatima Bello', class: 'JSS 2', admissionNo: 'RS-004', gender: 'Female', dob: '2009-11-05', photo: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Fatima', parentEmail: 'parent4@example.com' },
];

export const demoSubjects: Subject[] = [
  { id: 'subj_eng', name: 'English Language', classes: ['JSS 1', 'JSS 2'] },
  { id: 'subj_mat', name: 'Mathematics', classes: ['JSS 1', 'JSS 2'] },
  { id: 'subj_sci', name: 'Basic Science', classes: ['JSS 1', 'JSS 2'] },
  { id: 'subj_tec', name: 'Basic Technology', classes: ['JSS 1', 'JSS 2'] },
];

export const demoTeachers = [
    { id: 'teacher_1699904494056', name: 'Mrs. Funke Akindele', email: 'funke@example.com', role: 'Teacher' },
    { id: 'teacher_1699904534638', name: 'Mr. Chidi Mokeme', email: 'chidi@example.com', role: 'Admin' },
    { id: 'teacher_1699904534639', name: 'Mr. Femi Adebayo', email: 'femi@example.com', role: 'Bursar' },
];

export const demoScores: Score[] = [
  // Session: 2023/2024, First Term
  { studentId: 'std_001', subjectId: 'subj_eng', term: 'First Term', session: '2023/2024', ca1: 18, ca2: 15, exam: 50 }, // 83
  { studentId: 'std_001', subjectId: 'subj_mat', term: 'First Term', session: '2023/2024', ca1: 20, ca2: 18, exam: 55 }, // 93
  { studentId: 'std_001', subjectId: 'subj_sci', term: 'First Term', session: '2023/2024', ca1: 17, ca2: 17, exam: 48 }, // 82
  { studentId: 'std_002', subjectId: 'subj_eng', term: 'First Term', session: '2023/2024', ca1: 15, ca2: 12, exam: 40 }, // 67
  { studentId: 'std_002', subjectId: 'subj_mat', term: 'First Term', session: '2023/2024', ca1: 10, ca2: 8, exam: 25 },  // 43
  { studentId: 'std_002', subjectId: 'subj_sci', term: 'First Term', session: '2023/2024', ca1: 12, ca2: 13, exam: 35 },  // 60
  { studentId: 'std_003', subjectId: 'subj_eng', term: 'First Term', session: '2023/2024', ca1: 14, ca2: 16, exam: 45 }, // 75
  { studentId: 'std_003', subjectId: 'subj_mat', term: 'First Term', session: '2023/2024', ca1: 19, ca2: 19, exam: 58 }, // 96

  // Session: 2023/2024, Second Term
  { studentId: 'std_001', subjectId: 'subj_eng', term: 'Second Term', session: '2023/2024', ca1: 17, ca2: 16, exam: 52 }, // 85
  { studentId: 'std_001', subjectId: 'subj_mat', term: 'Second Term', session: '2023/2024', ca1: 18, ca2: 19, exam: 50 }, // 87
  { studentId: 'std_001', subjectId: 'subj_sci', term: 'Second Term', session: '2023/2024', ca1: 15, ca2: 15, exam: 50 }, // 80
  { studentId: 'std_002', subjectId: 'subj_eng', term: 'Second Term', session: '2023/2024', ca1: 16, ca2: 13, exam: 45 }, // 74
  { studentId: 'std_002', subjectId: 'subj_mat', term: 'Second Term', session: '2023/2024', ca1: 11, ca2: 10, exam: 30 }, // 51
  { studentId: 'std_002', subjectId: 'subj_sci', term: 'Second Term', session: '2023/2024', ca1: 14, ca2: 12, exam: 40 },  // 66
  { studentId: 'std_003', subjectId: 'subj_eng', term: 'Second Term', session: '2023/2024', ca1: 15, ca2: 15, exam: 48 }, // 78
  { studentId: 'std_003', subjectId: 'subj_mat', term: 'Second Term', session: '2023/2024', ca1: 18, ca2: 17, exam: 55 }, // 90

  // Session: 2022/2023, Third Term (for historical data)
  { studentId: 'std_003', subjectId: 'subj_eng', term: 'Third Term', session: '2022/2023', ca1: 12, ca2: 14, exam: 40 }, // 66 (was in JSS 1)
  { studentId: 'std_003', subjectId: 'subj_mat', term: 'Third Term', session: '2022/2023', ca1: 17, ca2: 18, exam: 50 }, // 85 (was in JSS 1)
];


export const demoAttendance = [
    { date: '2024-05-20', statuses: { 'std_001': 'present', 'std_002': 'late' } },
    { date: '2024-05-21', statuses: { 'std_001': 'present', 'std_002': 'present' } },
];

export const demoBehavioralRecords = [
    { id: 'bhv_1', studentId: 'std_001', type: 'positive', remark: 'Answered questions correctly in class.', date: '2024-05-20' },
    { id: 'bhv_2', studentId: 'std_002', type: 'negative', remark: 'Did not submit assignment on time.', date: '2024-05-21' },
];

export const demoActivities = [
  { id: 'act_1', type: 'STUDENT_ADD', description: 'Added a new student: Adebayo Chukwuma.', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 'act_2', type: 'TEACHER_ADD', description: 'Added a new teacher: Mrs. Funke Akindele.', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'act_3', type: 'SUBJECT_UPDATE', description: 'Updated subject: Mathematics', timestamp: new Date(Date.now() - 7200000).toISOString() }
];

export const demoPlatformSettings = {
    paystackPublicKey: '',
    paystackSecretKey: '',
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    payvesselMerchantId: '',
    payvesselApiKey: '',
    articles: [
        { id: 'art_1', title: 'Welcome to ReportSheet', content: 'This is the first article in your knowledge base.', status: 'published', lastUpdated: new Date().toISOString() },
    ]
};

export const demoKbArticles = [
    { id: 'kb_1', title: 'How to Add a New Student', content: 'Go to the Students tab and click "Add Student".', status: 'published', lastUpdated: new Date().toISOString() },
];

export const demoRemarks: Remark[] = [
    { studentId: 'std_001', term: 'First Term', session: '2023/2024', generalComment: 'Excellent start to the session. Adebayo is focused and hardworking.' },
    { studentId: 'std_001', term: 'Second Term', session: '2023/2024', generalComment: 'Consistent performance. Keep up the great work.' },
];
