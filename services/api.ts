// A mock API service using localStorage. This should be replaced with a real backend.
import { DEMO_TENANT_ID } from '../utils/demoData';
import { getSubdomain } from '../utils/subdomain';
import { supabase } from './supabaseClient';
// Fix: Add Conversation and Message to imports.
import { Student, Teacher, Subject, Score, SchoolSettings, Remark, BehavioralLogEntry, Tenant, Plan, Assignment, AssignmentScore, Page, MenuItem, PlatformUser, Invoice, Payment, Expense, PayrollRun, SharedLessonPlan, Discount, Conversation, Message } from '../types';

// Helper to get the current tenant ID, respecting demo mode
export const getTenantId = () => {
    return getSubdomain() || 'platform'; // 'platform' for non-tenant data
};

const getStorageKey = (key: string, tenantId?: string) => {
    const id = tenantId || getTenantId();
    // Platform-level data doesn't get a tenant prefix
    if (['platform_settings', 'tenants', 'platform_users'].includes(key)) {
        return key;
    }
    return `${id}_${key}`;
};


const setInitialData = (tenantId) => {
    // This would be your default seed data for a new tenant
    const defaultData = {
        subjects: [],
        students: [],
        teachers: [],
        scores: [],
        //... any other initial data
    };

    for (const key in defaultData) {
        localStorage.setItem(getStorageKey(key, tenantId), JSON.stringify(defaultData[key]));
    }
};

const getData = <T,>(key: string, tenantId?: string): T[] => {
    try {
        const data = localStorage.getItem(getStorageKey(key, tenantId));
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

const saveData = <T,>(key: string, data: T[], tenantId?: string) => {
    localStorage.setItem(getStorageKey(key, tenantId), JSON.stringify(data));
};

// Generic upsert (add or update)
const upsertItem = <T extends { id: string }>(key: string, item: Partial<T>): T => {
    const items = getData<T>(key);
    const existingIndex = items.findIndex(i => i.id === item.id);
    let updatedItem;

    if (existingIndex > -1) {
        updatedItem = { ...items[existingIndex], ...item };
        items[existingIndex] = updatedItem;
    } else {
        updatedItem = { ...item, id: item.id || `${key.slice(0, 3)}_${Date.now()}` } as T;
        items.push(updatedItem);
    }
    saveData(key, items);
    return updatedItem;
};

// --- Default Data for First Run ---

const defaultLandingPageContent = {
  hero: { title: 'AI-Powered School Management System for Nigeria', subtitle: 'Supercharge your school with ReportSheet, the all-in-one platform to automate results, generate report cards, engage parents, and empower teachers.' },
  problem: { title: 'Is your school still stuck in the past?', points: ['Manual result computation is tedious and error-prone.', 'Generating report cards takes weeks of manual work.', 'Poor communication with parents.', 'No clear data on student performance.'], extraText: 'This old way of doing things wastes time, frustrates teachers, and leaves parents in the dark.' },
  solution: { title: 'Welcome to the Future of School Administration', features: [
    { icon: 'SparklesIcon', title: 'Automated Results', desc: 'Input scores, and ReportSheet handles all calculations instantly, from totals to positions.' },
    { icon: 'DocumentArrowDownIcon', title: 'Instant Report Cards', desc: 'Generate beautiful, comprehensive report cards for your entire school in minutes, not weeks.' },
    { icon: 'ChartBarIcon', title: 'Performance Analytics', desc: 'Get deep insights into student and class performance with our easy-to-read dashboards.' },
    { icon: 'ChatBubbleLeftRightIcon', title: 'Parent Engagement', desc: 'Keep parents in the loop with a dedicated portal to view results, attendance, and communicate with teachers.' },
    { icon: 'BrainCircuitIcon', title: 'AI-Powered Tools', desc: 'Leverage AI for lesson planning, comment generation, and identifying at-risk students.' }
  ]},
  comparison: { title: 'ReportSheet vs. The Old Way', features: [
    { name: 'Result Calculation', regular: 'Manual, slow, error-prone', reportsheet: 'Instant & Accurate' },
    { name: 'Report Card Generation', regular: 'Weeks of manual work', reportsheet: 'Minutes' },
    { name: 'Performance Insight', regular: 'Guesswork', reportsheet: 'Data-driven Analytics' },
    { name: 'Parent Communication', regular: 'Occasional PTA meetings', reportsheet: 'Real-time Portal Access' },
  ]},
  testimonials: { title: 'Loved by Schools Across Nigeria', items: [
    { id: 't1', name: 'Mrs. Adebayo', role: 'Proprietor', school: 'Bright Minds College', quote: 'ReportSheet has been a game-changer. What used to take us three weeks now takes a single day. Our teachers are happier and parents are more engaged.', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=adebayo' },
    { id: 't2', name: 'Mr. Okoro', role: 'Head Teacher', school: 'Future Leaders Academy', quote: 'The AI tools are incredible. I can generate lesson plans and get insights on student performance like never before. I can\'t imagine going back.', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=okoro' },
    { id: 't3', name: 'Dr. Amina', role: 'School Admin', school: 'Crestview International', quote: 'The platform is so easy to use, and the support is fantastic. ReportSheet has truly modernized our school\'s operations.', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=amina' }
  ]},
  pricing: { title: 'Simple, Affordable Pricing', subtitle: 'Choose a plan that fits your school\'s size and budget.' },
  faq: { title: 'Frequently Asked Questions', items: [
    { q: 'Is my school\'s data safe?', a: 'Yes, we use industry-standard security measures to protect all your data.' },
    { q: 'Can I try it before I subscribe?', a: 'Absolutely! You can explore our live demo or sign up for a 14-day free trial, no credit card required.' },
    { q: 'How long does it take to set up?', a: 'You can be up and running in minutes. Our simple setup process and bulk student import make it easy to get started.' }
  ]},
  finalCta: { title: 'Ready to transform your school?', subtitle: 'Join hundreds of schools across Nigeria who trust ReportSheet to manage their academic records.', tagline: '14-Day Free Trial. No Credit Card Required.' },
  promoBanner: { enabled: true, text: 'Limited Time Offer: Get 20% off your first year\'s subscription!', endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }
};

const defaultPlatformSettings = {
    platformName: 'ReportSheet',
    accentColor: '#4f46e5',
    landingPageContent: defaultLandingPageContent,
    menus: {
        header: [
            { id: 'm1', label: 'Features', url: '#features' },
            { id: 'm2', label: 'Pricing', url: '#pricing' },
            { id: 'm3', label: 'FAQ', url: '#faq' },
            { id: 'm4', label: 'Blog', url: '?view=blog' }
        ]
    },
    plans: [
        { id: 'plan_basic', name: 'Basic', description: 'For small schools just getting started.', price_monthly: 10000, price_termly: 25000, price_yearly: 70000, features: { maxStudents: 150, results: true, attendance: true } },
        { id: 'plan_pro', name: 'Pro', description: 'Our most popular plan with powerful features for growing schools.', price_monthly: 25000, price_termly: 65000, price_yearly: 180000, features: { maxStudents: 500, results: true, attendance: true, communications: true, bursary: true, analytics: true, 'ai-tools': true } },
        { id: 'plan_enterprise', name: 'Enterprise', description: 'For large schools and groups requiring advanced features and support.', price_monthly: 50000, price_termly: 130000, price_yearly: 350000, features: { maxStudents: 1500, results: true, attendance: true, communications: true, bursary: true, analytics: true, 'ai-tools': true, alumni: true, payroll: true } },
    ],
    pages: [],
    articles: [],
    kb_articles: []
};


// --- API Functions ---

// PLATFORM
export const apiGetPlatformSettings = async (): Promise<any> => {
    const settings = getData('platform_settings')[0];
    if (!settings || Object.keys(settings).length === 0) {
        // This will pre-populate localStorage for the first run.
        await apiSavePlatformSettings(defaultPlatformSettings);
        return defaultPlatformSettings;
    }
    return settings;
};
export const apiSavePlatformSettings = async (settings: any) => saveData('platform_settings', [settings]);
export const apiGetTenants = async (): Promise<Tenant[]> => getData('tenants');
export const apiAddTenant = async (tenantData: { name: string, id: string }) => {
    const newTenant = { ...tenantData, subscriptionStatus: 'trial', trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() };
    upsertItem('tenants', newTenant);
};
export const apiUpdateTenant = async (tenantData: Tenant) => upsertItem('tenants', tenantData);

export const apiDeleteTenant = async (tenantId: string) => {
    const tenants = getData<Tenant>('tenants');
    saveData('tenants', tenants.filter(t => t.id !== tenantId));
    // In a real app, you would also delete all data associated with this tenantId prefix.
};
export const apiUpdateSubscription = async (planId: string) => {
    const tenantId = getTenantId();
    const tenants = await apiGetTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
        const updatedTenant = { 
            ...tenant, 
            planId, 
            // Fix: Use 'as const' to prevent TypeScript from widening the literal type to a generic 'string'.
            subscriptionStatus: 'active' as const,
            subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 day stub
        };
        await apiUpdateTenant(updatedTenant);
    }
};

export const apiFindTenantByEmail = async (email: string): Promise<string | null> => {
    // This is a super inefficient way to do this, but it works for a mock.
    // In a real app, this would be a single server-side query.
    const tenants = await apiGetTenants();
    for (const tenant of tenants) {
        const teachers = getData<Teacher>('teachers', tenant.id);
        if (teachers.some(t => t.email.toLowerCase() === email.toLowerCase())) {
            return tenant.id;
        }
    }
    return null;
}


// SCHOOL-SPECIFIC
// Fix: Cast the fallback empty object to SchoolSettings to match the function's return type.
export const apiGetSchoolSettings = async (tenantId?: string): Promise<SchoolSettings> => getData('settings', tenantId)[0] || ({} as SchoolSettings);
export const apiSaveSchoolSettings = async (settings: SchoolSettings, tenantId?: string) => saveData('settings', [settings], tenantId);

// STUDENTS
export const apiGetStudents = async (filters?: { classFilter?: string }): Promise<Student[]> => {
    const students = getData<Student>('students');
    if (filters?.classFilter) {
        return students.filter(s => s.class === filters.classFilter);
    }
    return students;
};
export const apiUpsertStudent = async (studentData: Partial<Student>) => upsertItem('students', studentData);
export const apiDeleteStudent = async (studentId: string) => {
    const students = getData<Student>('students');
    saveData('students', students.filter(s => s.id !== studentId));
};
export const apiBatchUpdateStudents = async (studentsToUpdate: Partial<Student>[]) => {
    let students = getData<Student>('students');
    studentsToUpdate.forEach(update => {
        const index = students.findIndex(s => s.id === update.id);
        if (index > -1) {
            students[index] = { ...students[index], ...update };
        }
    });
    saveData('students', students);
};


// TEACHERS (STAFF)
export const apiGetTeachers = async (): Promise<Teacher[]> => getData('teachers');
export const apiUpsertTeacher = async (teacherData: Partial<Teacher>) => upsertItem('teachers', teacherData);
export const apiDeleteTeacher = async (teacherId: string) => {
    const teachers = getData<Teacher>('teachers');
    saveData('teachers', teachers.filter(t => t.id !== teacherId));
};

// SUBJECTS
export const apiGetSubjects = async (): Promise<Subject[]> => getData('subjects');
export const apiUpsertSubject = async (subjectData: Partial<Subject>) => upsertItem('subjects', subjectData);
export const apiDeleteSubject = async (subjectId: string) => {
    const subjects = getData<Subject>('subjects');
    saveData('subjects', subjects.filter(s => s.id !== subjectId));
};

// SCORES
export const apiGetScores = async (filters?: { studentIds?: string[], subjectId?: string, session?: string, term?: string }): Promise<Score[]> => {
    let scores = getData<Score>('scores');
    if (filters?.studentIds) scores = scores.filter(s => filters.studentIds.includes(s.studentId));
    if (filters?.subjectId) scores = scores.filter(s => s.subjectId === filters.subjectId);
    if (filters?.session) scores = scores.filter(s => s.session === filters.session);
    if (filters?.term) scores = scores.filter(s => s.term === filters.term);
    return scores;
};
export const apiUpsertScore = async (scoreData: Partial<Score>) => {
    const scores = getData<Score>('scores');
    const existingIndex = scores.findIndex(s => s.studentId === scoreData.studentId && s.subjectId === scoreData.subjectId && s.session === scoreData.session && s.term === scoreData.term);
    
    if (existingIndex > -1) {
        scores[existingIndex] = { ...scores[existingIndex], ...scoreData };
    } else {
        scores.push({ ...scoreData, id: `score_${Date.now()}` } as Score);
    }
    saveData('scores', scores);
};
export const apiBatchUpsertScores = async (scoresToUpsert: Partial<Score>[]) => {
    let allScores = getData<Score>('scores');
    scoresToUpsert.forEach(newScore => {
        const existingIndex = allScores.findIndex(s => s.studentId === newScore.studentId && s.subjectId === newScore.subjectId && s.session === newScore.session && s.term === newScore.term);
        if (existingIndex > -1) {
            allScores[existingIndex] = { ...allScores[existingIndex], ...newScore };
        } else {
            allScores.push({ ...newScore, id: `score_${Date.now()}_${Math.random()}` } as Score);
        }
    });
    saveData('scores', allScores);
};


// REMARKS
export const apiGetRemarks = async (): Promise<Remark[]> => getData('remarks');
export const apiUpsertRemark = async (remarkData: Partial<Remark>) => {
    const remarks = getData<Remark>('remarks');
    const existingIndex = remarks.findIndex(r => r.studentId === remarkData.studentId && r.session === remarkData.session && r.term === remarkData.term);
    if (existingIndex > -1) {
        remarks[existingIndex] = { ...remarks[existingIndex], ...remarkData };
    } else {
        remarks.push({ ...remarkData, id: `rem_${Date.now()}` } as Remark);
    }
    saveData('remarks', remarks);
};

// BEHAVIORAL
export const apiGetBehavioralRecords = async (filters?: { classFilter?: string }): Promise<BehavioralLogEntry[]> => {
    let records = getData<BehavioralLogEntry>('behavioral');
    if (filters?.classFilter) {
        const students = await apiGetStudents({ classFilter: filters.classFilter });
        const studentIds = students.map(s => s.id);
        return records.filter(r => studentIds.includes(r.studentId));
    }
    return records;
};
export const apiUpsertBehavioralRecord = async (recordData: Partial<BehavioralLogEntry>) => upsertItem('behavioral', recordData);

// TIMETABLE
export const apiGetTimetableData = async (): Promise<any> => getData('timetable')[0] || {};
export const apiSaveTimetableData = async (data: any) => saveData('timetable', [data]);

// ATTENDANCE
export const apiGetAttendance = async (filters?: { date?: string }): Promise<any[]> => {
    let records = getData<any>('attendance');
    if (filters?.date) {
        return records.filter(r => r.date === filters.date);
    }
    return records;
};
export const apiSaveAttendanceRecord = async (recordData: {date: string, statuses: any}) => {
    const records = getData<any>('attendance');
    const existingIndex = records.findIndex(r => r.date === recordData.date);
    if (existingIndex > -1) {
        records[existingIndex] = recordData;
    } else {
        records.push(recordData);
    }
    saveData('attendance', records);
};


// --- PUBLIC/SCRATCH CARD ---
export const apiGetScratchCards = async (tenantId?: string): Promise<any[]> => getData('scratch_cards', tenantId);
export const apiSaveScratchCards = async (cards: any[], tenantId?: string) => saveData('scratch_cards', cards, tenantId);
export const apiUseScratchCard = async (pin: string, tenantId: string) => {
    const cards = await apiGetScratchCards(tenantId);
    const cardIndex = cards.findIndex(c => c.pin === pin);
    if (cardIndex > -1) {
        cards[cardIndex].used = true;
        await apiSaveScratchCards(cards, tenantId);
    }
};

export const apiGetPublicStudentResult = async (schoolId: string, admissionNo: string): Promise<any> => {
    const allStudents = getData<Student>('students', schoolId);
    const student = allStudents.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());
    if (!student) throw new Error("Student not found.");
    
    // Fetch all data for that tenant
    const [scores, subjects, schoolSettings, remarks, attendance] = await Promise.all([
        getData<Score>('scores', schoolId),
        getData<Subject>('subjects', schoolId),
        apiGetSchoolSettings(schoolId),
        getData<Remark>('remarks', schoolId),
        getData<any>('attendance', schoolId),
    ]);

    return { student, students: allStudents, scores, subjects, schoolSettings, remarks, attendance };
};

// PARENTS
export const apiGetParents = async (): Promise<any[]> => getData('parents');
export const apiInviteParent = async (student: Student): Promise<{message: string}> => {
    // This is a mock. In a real app, it would trigger a server-side function.
    console.log(`Simulating parent invitation for ${student.parentEmail}`);
    return { message: "Invitation sent successfully (simulated)." };
}

// ANNOUNCEMENTS
export const apiGetAnnouncements = async (): Promise<any[]> => getData('announcements');
export const apiSendAnnouncement = async (announcement: { title: string; content: string; recipients: string[] }) => {
    const newAnnouncement = { ...announcement, id: `ann_${Date.now()}`, created_at: new Date().toISOString() };
    const all = await apiGetAnnouncements();
    saveData('announcements', [newAnnouncement, ...all]);
};

// KB ARTICLES (Platform-level)
export const apiGetKbArticles = async (): Promise<Page[]> => (await apiGetPlatformSettings()).kb_articles || [];
export const apiSaveKbArticles = async (articles: Page[]) => {
    const settings = await apiGetPlatformSettings();
    await apiSavePlatformSettings({ ...settings, kb_articles: articles });
};

// PLATFORM USERS
export const apiGetPlatformUsers = async(): Promise<PlatformUser[]> => getData('platform_users');
export const apiSavePlatformUsers = async(users: PlatformUser[]) => saveData('platform_users', users);

// ACTIVITY LOG
export const apiGetActivities = async(): Promise<any[]> => {
    // Fix: Explicitly type the sort parameters as 'any' to avoid errors on the 'unknown' type.
    return (getData('activities') || []).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
}

// ASSIGNMENTS
export const apiGetAssignments = async(): Promise<Assignment[]> => getData('assignments');
export const apiSaveAssignments = async(data: Assignment[]) => saveData('assignments', data);
export const apiGetAssignmentScores = async(): Promise<AssignmentScore[]> => getData('assignment_scores');
export const apiSaveAssignmentScores = async(data: AssignmentScore[]) => saveData('assignment_scores', data);

// MESSAGING
export const apiGetConversationSummaries = async (userId: string, userRole: string): Promise<Conversation[]> => { return []; };
export const apiGetMessages = async (conversationId: string): Promise<Message[]> => { return []; };
export const apiSendMessage = async (messageData: any): Promise<Message> => { return messageData as Message; };

// USER
export const getCurrentUser = async (): Promise<Teacher | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const teachers = await apiGetTeachers();
    return teachers.find(t => t.email.toLowerCase() === user.email.toLowerCase()) || null;
}

// RESOURCE HUB
export const apiGetSharedLessonPlans = async(): Promise<SharedLessonPlan[]> => getData('shared_lesson_plans');
export const apiShareLessonPlan = async(planData: any) => upsertItem('shared_lesson_plans', {...planData, createdAt: new Date().toISOString(), upvotes: 0});
export const apiUpvoteLessonPlan = async (planId: string) => {
    const plans = await apiGetSharedLessonPlans();
    const planIndex = plans.findIndex(p => p.id === planId);
    if(planIndex > -1) {
        plans[planIndex].upvotes = (plans[planIndex].upvotes || 0) + 1;
        saveData('shared_lesson_plans', plans);
    }
};

// ALUMNI
export const apiSendAlumniEmail = async(recipients: string[], subject: string, body: string): Promise<void> => {
    console.log("Simulating email to alumni:", {recipients, subject, body});
};

// BURSARY
export const apiGetInvoices = async(): Promise<Invoice[]> => getData('invoices');
export const apiUpsertInvoice = async(invoice: Partial<Invoice>) => upsertItem('invoices', invoice);
export const apiGetPayments = async(): Promise<Payment[]> => getData('payments');
export const apiUpsertPayment = async(payment: Partial<Payment>) => upsertItem('payments', payment);
export const apiGetExpenses = async(): Promise<Expense[]> => getData('expenses');
export const apiSaveExpenses = async(expenses: Expense[]) => saveData('expenses', expenses);
export const apiGetPayrollRuns = async(): Promise<PayrollRun[]> => getData('payroll_runs');
export const apiSavePayrollRuns = async(runs: PayrollRun[]) => saveData('payroll_runs', runs);
export const apiGetDiscounts = async(): Promise<Discount[]> => getData('discounts');
export const apiSaveDiscounts = async(discounts: Discount[]) => saveData('discounts', discounts);