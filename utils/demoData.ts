export const DEMO_TENANT_ID = 'demo';

export const demoSchoolSettings = {
  schoolName: 'Brightstar Academy',
  schoolAddress: '123, Education Lane, Lagos',
  schoolLogo: 'https://i.imgur.com/gKEBi1f.png',
  session: '2023/2024',
  term: 'Second Term',
  paystackPublicKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',
  gradingSystem: [
    { grade: 'A', from: 75, to: 100, remark: 'Excellent' },
    { grade: 'B', from: 65, to: 74, remark: 'Very Good' },
    { grade: 'C', from: 55, to: 64, remark: 'Good' },
    { grade: 'D', from: 45, to: 54, remark: 'Pass' },
    { grade: 'E', from: 40, to: 44, remark: 'Weak Pass' },
    { grade: 'F', from: 0, to: 39, remark: 'Fail' },
  ],
  schoolType: 'secondary',
  planId: 'plan_pro', // A demo plan ID
};

export const demoStudents = [
  { id: 'std_1', name: 'Adebayo Chinedu', class: 'JSS 1', admissionNo: 'RS-001', gender: 'Male', dob: '2010-05-15', photo: 'https://i.pravatar.cc/150?u=std_1', parentEmail: 'parent1@example.com', faceDescriptor: [], status: 'active' },
  { id: 'std_2', name: 'Ngozi Okoro', class: 'JSS 1', admissionNo: 'RS-002', gender: 'Female', dob: '2010-08-22', photo: 'https://i.pravatar.cc/150?u=std_2', parentEmail: 'parent2@example.com', faceDescriptor: [], status: 'active' },
  { id: 'std_3', name: 'Tunde Bello', class: 'JSS 2', admissionNo: 'RS-003', gender: 'Male', dob: '2009-02-10', photo: 'https://i.pravatar.cc/150?u=std_3', parentEmail: 'parent3@example.com', faceDescriptor: [], status: 'active' },
  { id: 'std_4', name: 'Aisha Lawal', class: 'SSS 1', admissionNo: 'RS-004', gender: 'Female', dob: '2008-11-30', photo: 'https://i.pravatar.cc/150?u=std_4', parentEmail: 'parent4@example.com', faceDescriptor: [], status: 'active' },
  { id: 'std_5', name: 'Yusuf Ibrahim', class: 'SSS 1', admissionNo: 'RS-005', gender: 'Male', dob: '2008-07-19', photo: 'https://i.pravatar.cc/150?u=std_5', parentEmail: 'parent5@example.com', faceDescriptor: [], status: 'active' },
  { id: 'std_6', name: 'Folake Adekunle', class: 'JSS 1', admissionNo: 'RS-006', gender: 'Female', dob: '2010-03-12', photo: 'https://i.pravatar.cc/150?u=std_6', parentEmail: 'parent6@example.com', faceDescriptor: [], status: 'active' },
  { id: 'std_7', name: 'Emeka Nwosu', class: 'JSS 2', admissionNo: 'RS-007', gender: 'Male', dob: '2009-09-05', photo: 'https://i.pravatar.cc/150?u=std_7', parentEmail: 'parent7@example.com', faceDescriptor: [], status: 'active' },
  { id: 'alumni_1', name: 'John Doe', class: 'Graduated (2022)', admissionNo: 'RS-AL-001', gender: 'Male', dob: '2004-01-01', photo: 'https://i.pravatar.cc/150?u=alumni_1', parentEmail: 'johndoe@example.com', status: 'alumni', graduationYear: 2022 },
  { id: 'alumni_2', name: 'Jane Smith', class: 'Graduated (2023)', admissionNo: 'RS-AL-002', gender: 'Female', dob: '2005-02-02', photo: 'https://i.pravatar.cc/150?u=alumni_2', parentEmail: 'janesmith@example.com', status: 'alumni', graduationYear: 2023 },
];

export const demoSubjects = [
    { id: 'subj_1', name: 'Mathematics', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_2', name: 'English Language', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_3', name: 'Basic Science', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'subj_4', name: 'Physics', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_5', name: 'Chemistry', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_6', name: 'Biology', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
];

export const demoScores = [
    { studentId: 'std_1', subjectId: 'subj_1', term: 'First Term', session: '2023/2024', ca1: 15, ca2: 18, exam: 45 },
    { studentId: 'std_1', subjectId: 'subj_2', term: 'First Term', session: '2023/2024', ca1: 12, ca2: 10, exam: 30 },
    { studentId: 'std_2', subjectId: 'subj_1', term: 'First Term', session: '2023/2024', ca1: 20, ca2: 19, exam: 55 },
    { studentId: 'std_2', subjectId: 'subj_2', term: 'First Term', session: '2023/2024', ca1: 18, ca2: 17, exam: 48 },
];

export const demoTeachers = [
    { id: 'teacher_1', name: 'Mrs. Funke Adewale', email: 'teacher@example.com', role: 'Teacher' },
    { id: 'teacher_2', name: 'Mr. John Obi', email: 'admin@example.com', role: 'Admin' },
];

export const demoAttendance = [
    { date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], statuses: { 'std_1': 'present', 'std_2': 'present', 'std_3': 'late' } },
    { date: new Date().toISOString().split('T')[0], statuses: { 'std_1': 'present', 'std_2': 'absent' } },
];

export const demoBehavioralRecords = [
    { id: 'bhv_1', studentId: 'std_1', date: new Date().toISOString(), type: 'positive', remark: 'Assisted a classmate who was struggling with a math problem.' },
    { id: 'bhv_2', studentId: 'std_2', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), type: 'negative', remark: 'Was disruptive during the English class.' },
];

export const demoActivities = [
    { id: 'act_1', type: 'STUDENT_ADD', description: 'Added a new student: Adebayo Chinedu.', timestamp: new Date().toISOString() },
    { id: 'act_2', type: 'SUBJECT_UPDATE', description: 'Updated subject: Mathematics.', timestamp: new Date().toISOString() },
];

export const demoFees = [
    { id: 'fee_1', description: 'Tuition Fee', amount: 50000, classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'fee_2', description: 'Lab Fee', amount: 10000, classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
];

export const demoScratchCards = [
    { id: 'card_1', pin: '123456789012', used: false, createdAt: new Date().toISOString() },
    { id: 'card_2', pin: '098765432109', used: true, createdAt: new Date().toISOString() },
];
