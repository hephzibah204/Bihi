// utils/demoData.ts

import { USER_ROLES } from './constants';
import { SchoolSettings, Parent, Student, Message, Score, Remark, Assignment, AssignmentScore, BehavioralLogEntry, Fee, ScratchCard, Announcement, Teacher, SharedLessonPlan } from '../types';

export const DEMO_TENANT_ID = 'demo';

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
    { id: 'subj_1', name: 'Mathematics', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_2', name: 'English Language', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_3', name: 'Basic Science', classes: ['JSS 1', 'JSS 2'] },
    { id: 'subj_4', name: 'Basic Technology', classes: ['JSS 1', 'JSS 2'] },
    { id: 'subj_5', name: 'Social Studies', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'subj_6', name: 'Physics', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'subj_7', name: 'Chemistry', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
];

export const demoTeachers: Teacher[] = [
    { id: 'teacher_1', auth_id: 'teacher_1_auth', name: 'Mr. John Doe', email: 'johndoe@reportsheet.dev', role: USER_ROLES.ADMIN, classTeacherOf: 'JSS 1' },
    { id: 'teacher_2', auth_id: 'teacher_2_auth', name: 'Mrs. Jane Smith', email: 'janesmith@reportsheet.dev', role: USER_ROLES.TEACHER, classTeacherOf: 'JSS 2' },
    { id: 'teacher_3', auth_id: 'teacher_3_auth', name: 'Mr. Femi Adebayo', email: 'femi@reportsheet.dev', role: USER_ROLES.BURSAR, classTeacherOf: '' },
    { id: 'teacher_4', auth_id: 'teacher_4_auth', name: 'Ms. Grace Okon', email: 'grace@reportsheet.dev', role: USER_ROLES.TEACHER, classTeacherOf: 'SSS 1' },
];

export const demoParents: Parent[] = [
    { id: 'parent_1', name: 'Mr. & Mrs. Adekunle', email: 'adekunle@family.com', auth_id: 'invited_12345' },
    { id: 'parent_2', name: 'Dr. Chioma Okoro', email: 'chioma.okoro@example.com' },
    { id: 'parent_3', name: 'Mr. & Mrs. Williams', email: 'williams@family.com' },
];

export const demoStudents: Student[] = [
    { id: 'stud_1', name: 'Adekunle Gold', admissionNo: 'RS-001', class: 'JSS 1', gender: 'Male', dob: '2010-05-15', photo: 'https://i.imgur.com/4z1y2fn.jpeg', parentId: 'parent_1', parentEmail: 'adekunle@family.com' },
    { id: 'stud_2', name: 'Simisola Adekunle', admissionNo: 'RS-002', class: 'JSS 1', gender: 'Female', dob: '2010-08-22', photo: 'https://i.imgur.com/iAn3dI8.jpeg', parentId: 'parent_1', parentEmail: 'adekunle@family.com' },
    { id: 'stud_3', name: 'David Okoro', admissionNo: 'RS-003', class: 'JSS 2', gender: 'Male', dob: '2009-02-10', photo: 'https://i.imgur.com/zW2jZfW.jpeg', parentId: 'parent_2', parentEmail: 'chioma.okoro@example.com' },
    { id: 'stud_4', name: 'Funke Williams', admissionNo: 'RS-004', class: 'SSS 1', gender: 'Female', dob: '2007-11-20', photo: 'https://i.imgur.com/Qe1qJzk.jpeg', parentId: 'parent_3', parentEmail: 'williams@family.com' },
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

export const demoScores: Score[] = [
  // --- 2023/2024 Second Term (Current Term) ---
  // stud_1 (JSS 1)
  { id: 'score_1', studentId: 'stud_1', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 15, exam: 45, comment: 'Excellent grasp of concepts.' },
  { id: 'score_2', studentId: 'stud_1', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 15, ca2: 12, exam: 35, comment: 'Good, but needs to work on grammar.' },
  { id: 'score_15', studentId: 'stud_1', subjectId: 'subj_3', session: '2023/2024', term: 'Second Term', ca1: 17, ca2: 14, exam: 40 },
  { id: 'score_16', studentId: 'stud_1', subjectId: 'subj_4', session: '2023/2024', term: 'Second Term', ca1: 12, ca2: 18, exam: 38 },
  { id: 'score_17', studentId: 'stud_1', subjectId: 'subj_5', session: '2023/2024', term: 'Second Term', ca1: 16, ca2: 16, exam: 42 },
  // stud_2 (JSS 1)
  { id: 'score_3', studentId: 'stud_2', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 16, ca2: 17, exam: 50 },
  { id: 'score_4', studentId: 'stud_2', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 19, ca2: 18, exam: 55, comment: 'Outstanding performance.' },
  { id: 'score_18', studentId: 'stud_2', subjectId: 'subj_3', session: '2023/2024', term: 'Second Term', ca1: 20, ca2: 19, exam: 58 },
  { id: 'score_19', studentId: 'stud_2', subjectId: 'subj_4', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 17, exam: 51 },
  { id: 'score_20', studentId: 'stud_2', subjectId: 'subj_5', session: '2023/2024', term: 'Second Term', ca1: 19, ca2: 19, exam: 53 },
  // stud_3 (JSS 2)
  { id: 'score_9', studentId: 'stud_3', subjectId: 'subj_3', session: '2023/2024', term: 'Second Term', ca1: 17, ca2: 18, exam: 51, comment: 'Very consistent and hardworking.' },
  { id: 'score_10', studentId: 'stud_3', subjectId: 'subj_5', session: '2023/2024', term: 'Second Term', ca1: 15, ca2: 14, exam: 40 },
  { id: 'score_21', studentId: 'stud_3', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 14, ca2: 13, exam: 35 },
  { id: 'score_22', studentId: 'stud_3', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 16, ca2: 15, exam: 41 },
  { id: 'score_23', studentId: 'stud_3', subjectId: 'subj_4', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 14, exam: 45 },
  // stud_4 (SSS 1)
  { id: 'score_24', studentId: 'stud_4', subjectId: 'subj_1', session: '2023/2024', term: 'Second Term', ca1: 19, ca2: 19, exam: 59 },
  { id: 'score_25', studentId: 'stud_4', subjectId: 'subj_2', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 17, exam: 50 },
  { id: 'score_26', studentId: 'stud_4', subjectId: 'subj_6', session: '2023/2024', term: 'Second Term', ca1: 17, ca2: 16, exam: 48 },
  { id: 'score_27', studentId: 'stud_4', subjectId: 'subj_7', session: '2023/2024', term: 'Second Term', ca1: 18, ca2: 18, exam: 52 },

  // --- 2023/2024 First Term (Past Term) ---
  // stud_1 (JSS 1)
  { id: 'score_5', studentId: 'stud_1', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 14, ca2: 16, exam: 40 },
  { id: 'score_6', studentId: 'stud_1', subjectId: 'subj_2', session: '2023/2024', term: 'First Term', ca1: 12, ca2: 11, exam: 30 },
  { id: 'score_28', studentId: 'stud_1', subjectId: 'subj_3', session: '2023/2024', term: 'First Term', ca1: 15, ca2: 13, exam: 35 },
  { id: 'score_29', studentId: 'stud_1', subjectId: 'subj_4', session: '2023/2024', term: 'First Term', ca1: 10, ca2: 14, exam: 30 },
  { id: 'score_30', studentId: 'stud_1', subjectId: 'subj_5', session: '2023/2024', term: 'First Term', ca1: 14, ca2: 14, exam: 38 },
  // stud_2 (JSS 1)
  { id: 'score_7', studentId: 'stud_2', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 15, ca2: 15, exam: 48 },
  { id: 'score_8', studentId: 'stud_2', subjectId: 'subj_2', session: '2023/2024', term: 'First Term', ca1: 18, ca2: 17, exam: 52 },
  { id: 'score_31', studentId: 'stud_2', subjectId: 'subj_3', session: '2023/2024', term: 'First Term', ca1: 19, ca2: 18, exam: 55 },
  { id: 'score_32', studentId: 'stud_2', subjectId: 'subj_4', session: '2023/2024', term: 'First Term', ca1: 17, ca2: 16, exam: 49 },
  { id: 'score_33', studentId: 'stud_2', subjectId: 'subj_5', session: '2023/2024', term: 'First Term', ca1: 18, ca2: 18, exam: 51 },
  // stud_3 (JSS 2)
  { id: 'score_11', studentId: 'stud_3', subjectId: 'subj_3', session: '2023/2024', term: 'First Term', ca1: 16, ca2: 15, exam: 45 },
  { id: 'score_12', studentId: 'stud_3', subjectId: 'subj_5', session: '2023/2024', term: 'First Term', ca1: 18, ca2: 12, exam: 38 },
  { id: 'score_34', studentId: 'stud_3', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 12, ca2: 11, exam: 31 },
  { id: 'score_35', studentId: 'stud_3', subjectId: 'subj_2', session: '2023/2024', term: 'First Term', ca1: 15, ca2: 14, exam: 39 },
  { id: 'score_36', studentId: 'stud_3', subjectId: 'subj_4', session: '2023/2024', term: 'First Term', ca1: 16, ca2: 16, exam: 42 },
  // stud_4 (SSS 1)
  { id: 'score_37', studentId: 'stud_4', subjectId: 'subj_1', session: '2023/2024', term: 'First Term', ca1: 18, ca2: 18, exam: 55 },
  { id: 'score_38', studentId: 'stud_4', subjectId: 'subj_2', session: '2023/2024', term: 'First Term', ca1: 17, ca2: 15, exam: 48 },
  { id: 'score_39', studentId: 'stud_4', subjectId: 'subj_6', session: '2023/2024', term: 'First Term', ca1: 16, ca2: 15, exam: 45 },
  { id: 'score_40', studentId: 'stud_4', subjectId: 'subj_7', session: '2023/2024', term: 'First Term', ca1: 17, ca2: 17, exam: 50 },

  // --- 2022/2023 Third Term (Past Session) ---
  { id: 'score_13', studentId: 'stud_1', subjectId: 'subj_1', session: '2022/2023', term: 'Third Term', ca1: 10, ca2: 12, exam: 35 },
  { id: 'score_14', studentId: 'stud_1', subjectId: 'subj_2', session: '2022/2023', term: 'Third Term', ca1: 11, ca2: 13, exam: 28 },
  { id: 'score_41', studentId: 'stud_1', subjectId: 'subj_3', session: '2022/2023', term: 'Third Term', ca1: 13, ca2: 14, exam: 33 },
  { id: 'score_42', studentId: 'stud_2', subjectId: 'subj_1', session: '2022/2023', term: 'Third Term', ca1: 14, ca2: 14, exam: 45 },
  { id: 'score_43', studentId: 'stud_2', subjectId: 'subj_2', session: '2022/2023', term: 'Third Term', ca1: 16, ca2: 15, exam: 48 },

  // --- 2022/2023 Second Term (Past Session) ---
  { id: 'score_44', studentId: 'stud_1', subjectId: 'subj_1', session: '2022/2023', term: 'Second Term', ca1: 8, ca2: 10, exam: 30 },
  { id: 'score_45', studentId: 'stud_2', subjectId: 'subj_1', session: '2022/2023', term: 'Second Term', ca1: 12, ca2: 13, exam: 40 },
  { id: 'score_46', studentId: 'stud_3', subjectId: 'subj_3', session: '2022/2023', term: 'Second Term', ca1: 15, ca2: 15, exam: 44 },
  
  // --- 2022/2023 First Term (Past Session) ---
  { id: 'score_47', studentId: 'stud_1', subjectId: 'subj_1', session: '2022/2023', term: 'First Term', ca1: 5, ca2: 8, exam: 25 },
  { id: 'score_48', studentId: 'stud_2', subjectId: 'subj_1', session: '2022/2023', term: 'First Term', ca1: 10, ca2: 11, exam: 35 },
  { id: 'score_49', studentId: 'stud_3', subjectId: 'subj_3', session: '2022/2023', term: 'First Term', ca1: 14, ca2: 12, exam: 40 },
];

export const demoRemarks: Remark[] = [
  // --- 2023/2024 Second Term ---
  { id: 'rem_1', studentId: 'stud_1', session: '2023/2024', term: 'Second Term', generalComment: 'Adekunle is a brilliant student who shows great potential. He needs to be more consistent with his assignments to reach his peak.' },
  { id: 'rem_2', studentId: 'stud_2', session: '2023/2024', term: 'Second Term', generalComment: 'Simisola continues to be an exemplary student. Her dedication to her studies is commendable. Keep it up!' },
  { id: 'rem_5', studentId: 'stud_3', session: '2023/2024', term: 'Second Term', generalComment: 'David has settled in well and is proving to be a very capable student. His performance this term has been impressive.' },
  { id: 'rem_8', studentId: 'stud_4', session: '2023/2024', term: 'Second Term', generalComment: 'Funke has had a fantastic term, showing great aptitude for the science subjects. An excellent performance overall.' },

  // --- 2023/2024 First Term ---
  { id: 'rem_3', studentId: 'stud_1', session: '2023/2024', term: 'First Term', generalComment: 'A good start to the session. Adekunle needs to focus more in class to improve his scores.' },
  { id: 'rem_4', studentId: 'stud_2', session: '2023/2024', term: 'First Term', generalComment: 'Simisola has had a very strong start to the academic year. She is a joy to have in class.' },
  { id: 'rem_6', studentId: 'stud_3', session: '2023/2024', term: 'First Term', generalComment: 'A satisfactory start for David. More attention to classwork is encouraged to boost his scores.' },
  { id: 'rem_9', studentId: 'stud_4', session: '2023/2024', term: 'First Term', generalComment: 'A very promising start to her senior secondary education. Funke should keep up the momentum.' },

  // --- 2022/2023 Third Term ---
  { id: 'rem_7', studentId: 'stud_1', session: '2022/2023', term: 'Third Term', generalComment: 'Adekunle showed significant improvement towards the end of the session. A very encouraging performance to build on.' },
  { id: 'rem_10', studentId: 'stud_2', session: '2022/2023', term: 'Third Term', generalComment: 'A solid performance to end the school year. Well done, Simisola.' },

  // --- 2022/2023 Second Term ---
  { id: 'rem_11', studentId: 'stud_1', session: '2022/2023', term: 'Second Term', generalComment: 'Adekunle has struggled this term but is capable of much more. He needs to apply himself more diligently.' },
  { id: 'rem_12', studentId: 'stud_3', session: '2022/2023', term: 'Second Term', generalComment: 'David is a hardworking student who is always willing to learn. A pleasure to teach.' },

  // --- 2022/2023 First Term ---
  { id: 'rem_13', studentId: 'stud_1', session: '2022/2023', term: 'First Term', generalComment: 'A challenging start to the year. Adekunle is encouraged to seek help when he does not understand a topic.' },
  { id: 'rem_14', studentId: 'stud_2', session: '2022/2023', term: 'First Term', generalComment: 'Simisola has had a decent start but can improve her scores with more focus.' },
];

export const demoAssignments: Assignment[] = [
    { id: 'asg_1', class: 'JSS 1', subjectId: 'subj_1', title: 'Algebraic Expressions Worksheet', description: 'Complete all questions in the attached worksheet.', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), maxScore: 20, type: 'Homework' },
    { id: 'asg_2', class: 'JSS 1', subjectId: 'subj_2', title: 'Essay: "My Favourite Holiday"', description: 'Write a 2-page essay on your favourite holiday experience.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), maxScore: 50, type: 'Essay' },
    { id: 'asg_3', class: 'JSS 2', subjectId: 'subj_3', title: 'The Human Skeleton Diagram', description: 'Draw and label the major bones of the human skeleton.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), maxScore: 30, type: 'Project' },
    { id: 'asg_4', class: 'JSS 2', subjectId: 'subj_4', title: 'Simple Circuits', description: 'Build a simple parallel circuit and draw its diagram.', dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), maxScore: 40, type: 'Practical' },
    { id: 'asg_5', class: 'SSS 1', subjectId: 'subj_6', title: 'Newton\'s Laws of Motion', description: 'Solve the 10 problems on Newton\'s laws from the textbook.', dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), maxScore: 25, type: 'Problem Set' },
    { id: 'asg_6', class: 'SSS 1', subjectId: 'subj_7', title: 'Titration Lab Report', description: 'Submit the full lab report for the acid-base titration practical.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), maxScore: 50, type: 'Lab Report' },
];

export const demoAssignmentScores: AssignmentScore[] = [
    { id: 'asg_score_1', assignmentId: 'asg_2', studentId: 'stud_1', score: 40, comment: 'Good effort, but watch your tenses.' },
    { id: 'asg_score_2', assignmentId: 'asg_2', studentId: 'stud_2', score: 48, comment: 'Excellent and very descriptive writing!' },
    { id: 'asg_score_3', assignmentId: 'asg_4', studentId: 'stud_3', score: 35, comment: 'Well-drawn diagram and the circuit works perfectly.' },
    { id: 'asg_score_4', assignmentId: 'asg_6', studentId: 'stud_4', score: 45, comment: 'Excellent report. Clear methodology and accurate results.' },
];

export const demoAttendance = [
    { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'present', 'stud_3': 'present', 'stud_4': 'present' } },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'present', 'stud_3': 'present', 'stud_4': 'present' } },
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'late', 'stud_3': 'present', 'stud_4': 'absent' } },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'present', 'stud_3': 'absent', 'stud_4': 'present' } },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'present', 'stud_3': 'present', 'stud_4': 'present' } },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'present', 'stud_3': 'present', 'stud_4': 'late' } },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'absent', 'stud_2': 'present', 'stud_3': 'late', 'stud_4': 'present' } },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], statuses: { 'stud_1': 'present', 'stud_2': 'present', 'stud_3': 'present', 'stud_4': 'present' } },
];

export const demoBehavioralRecords: BehavioralLogEntry[] = [
    { id: 'bhv_1', studentId: 'stud_1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), remark: 'Helped a classmate who was struggling with a math problem.', type: 'positive', teacherId: 'teacher_1' },
    { id: 'bhv_2', studentId: 'stud_1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), remark: 'Was disruptive during the English Language class.', type: 'negative', teacherId: 'teacher_2' },
    { id: 'bhv_3', studentId: 'stud_2', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), remark: 'Consistently keeps her notes neat and well-organized.', type: 'positive', teacherId: 'teacher_1' },
    { id: 'bhv_4', studentId: 'stud_3', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), remark: 'Failed to submit his Basic Technology assignment on time.', type: 'negative', teacherId: 'teacher_2' },
    { id: 'bhv_5', studentId: 'stud_4', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), remark: 'Asked a very insightful question during the Physics class.', type: 'positive', teacherId: 'teacher_4' },
];

export const demoTimetable = {
    "JSS 1": {
        "Monday": {
            "8:00 - 9:00": { "subjectId": "subj_1", "teacherId": "teacher_1" },
            "9:00 - 10:00": { "subjectId": "subj_2", "teacherId": "teacher_2" },
            "10:00 - 11:00": { "subjectId": "subj_3", "teacherId": "teacher_2" },
        },
        "Tuesday": {
            "8:00 - 9:00": { "subjectId": "subj_3", "teacherId": "teacher_2" },
            "9:00 - 10:00": { "subjectId": "subj_1", "teacherId": "teacher_1" },
            "10:00 - 11:00": { "subjectId": "subj_4", "teacherId": "teacher_1" },
        },
        "Wednesday": {
            "8:00 - 9:00": { "subjectId": "subj_5", "teacherId": "teacher_2" },
            "9:00 - 10:00": { "subjectId": "subj_2", "teacherId": "teacher_2" },
        }
    },
    "JSS 2": {
        "Monday": {
            "8:00 - 9:00": { "subjectId": "subj_2", "teacherId": "teacher_2" },
            "9:00 - 10:00": { "subjectId": "subj_3", "teacherId": "teacher_2" },
            "10:00 - 11:00": { "subjectId": "subj_1", "teacherId": "teacher_1" },
        },
        "Tuesday": {
            "9:00 - 10:00": { "subjectId": "subj_4", "teacherId": "teacher_1" },
            "10:00 - 11:00": { "subjectId": "subj_5", "teacherId": "teacher_2" },
        },
    },
    "SSS 1": {
        "Monday": {
            "8:00 - 9:00": { "subjectId": "subj_6", "teacherId": "teacher_4" },
            "9:00 - 10:00": { "subjectId": "subj_2", "teacherId": "teacher_2" },
        },
        "Tuesday": {
            "8:00 - 9:00": { "subjectId": "subj_7", "teacherId": "teacher_4" },
            "9:00 - 10:00": { "subjectId": "subj_1", "teacherId": "teacher_1" },
        }
    }
};

export const demoFees: Fee[] = [
    { id: 'fee_1', description: 'Tuition Fee', amount: 50000, classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { id: 'fee_2', description: 'Uniform', amount: 15000, classes: ['JSS 1'] },
    { id: 'fee_3', description: 'Textbooks', amount: 25000, classes: ['JSS 1', 'JSS 2'] },
    { id: 'fee_4', description: 'Senior Tuition Fee', amount: 65000, classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { id: 'fee_5', description: 'Science Laboratory Fee', amount: 7500, classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
];

export const demoScratchCards: ScratchCard[] = [
    { id: 'card_1', pin: '111122223333', used: false, createdAt: new Date().toISOString() },
    { id: 'card_2', pin: '444455556666', used: false, createdAt: new Date().toISOString() },
    { id: 'card_3', pin: '777788889999', used: true, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
];

export const demoAnnouncements: Announcement[] = [
    { id: 'ann_1', title: 'Welcome to the New Term!', content: 'We are excited to welcome all students and parents to the second term of the 2023/2024 academic session. We look forward to a term of hard work and great achievements.', recipients: ['all'], created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ann_2', title: 'JSS 1 Mathematics Assignment', content: 'Please be reminded that the first mathematics assignment is due this Friday. Ensure you submit on time.', recipients: ['JSS 1'], created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'ann_3', title: 'SSS 1 Physics Practical Test', content: 'There will be a practical test for all SSS 1 students during the scheduled Physics period next week Monday.', recipients: ['SSS 1'], created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

export const demoSharedLessonPlans: SharedLessonPlan[] = [
    {
        id: 'shared_1',
        topic: 'Introduction to Photosynthesis',
        class: 'JSS 1',
        subjectId: 'subj_3', // Basic Science
        content: `**Learning Objectives:**\n1. Define Photosynthesis.\n2. List the requirements for photosynthesis.\n3. State the products of photosynthesis.\n\n**Lesson Procedure:**\n- Start with a question: "What do plants eat?"\n- Explain the process using a simple diagram.\n- Conduct a simple experiment to show the presence of starch in a leaf.\n\n**Evaluation:**\n- Ask students to draw and label the photosynthesis process.`,
        sharedByTeacherId: 'teacher_2',
        sharedByTeacherName: 'Mrs. Jane Smith',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 12,
    },
    {
        id: 'shared_2',
        topic: 'Quadratic Equations',
        class: 'SSS 1',
        subjectId: 'subj_1', // Mathematics
        content: `**Learning Objectives:**\n1. Identify a quadratic equation.\n2. Solve quadratic equations by factorization.\n3. Apply the quadratic formula.\n\n**Lesson Procedure:**\n- Introduction: Review linear equations.\n- Presentation: Introduce the general form ax^2 + bx + c = 0.\n- Practice: Give students multiple examples to solve on the board.\n\n**Assignment:**\n- Solve questions 1-10 from page 54 of the New General Mathematics textbook.`,
        sharedByTeacherId: 'teacher_1',
        sharedByTeacherName: 'Mr. John Doe',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        upvotes: 28,
    }
];