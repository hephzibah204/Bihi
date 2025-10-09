// services/api.ts
import { getSubdomain } from '../utils/subdomain';
import { 
    demoSchoolSettings, demoStudents, demoSubjects, demoTeachers, demoParents, DEMO_TENANT_ID, 
    demoMessages, demoScores, demoRemarks, demoAssignments, demoAssignmentScores, demoAttendance,
    demoBehavioralRecords, demoTimetable, demoFees, demoScratchCards, demoAnnouncements, demoSharedLessonPlans
} from '../utils/demoData';
import { supabase } from './supabaseClient';
import { Tenant, LandingPageContent, ReportCardSettings, Conversation, Message, Announcement, Fee, ScratchCard, SchoolSettings, Student, Subject, Teacher, Parent, Score, Remark, Assignment, AssignmentScore, BehavioralLogEntry, PlatformUser, SharedLessonPlan } from '../types';
import { TEACHER_CONTROLLABLE_FEATURES, STUDENT_CONTROLLABLE_FEATURES, PARENT_CONTROLLABLE_FEATURES } from '../utils/constants';

// --- Tenancy & Mode ---
export const getTenantId = (): string | null => {
    return getSubdomain();
};

const isDemoMode = () => getTenantId() === DEMO_TENANT_ID;

// --- Students ---
export const apiGetStudents = async (filters: { classFilter?: string } = {}): Promise<Student[]> => {
    if (isDemoMode()) {
        let students = demoStudents;
        if (filters.classFilter) {
            students = students.filter(s => s.class === filters.classFilter);
        }
        return students;
    }

    if (!supabase) throw new Error("Database client not initialized.");
    let query = supabase.from('students').select('*');
    if (filters.classFilter) {
        query = query.eq('class', filters.classFilter);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const apiUpsertStudent = async (studentData: Partial<Student>): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping student upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('students').upsert(studentData);
    if (error) throw error;
};

export const apiDeleteStudent = async (studentId: string): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping student delete.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('students').delete().match({ id: studentId });
    if (error) throw error;
};

export const apiBatchUpdateStudents = async (studentsToUpdate: Partial<Student>[]): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping batch student update.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('students').upsert(studentsToUpdate);
    if (error) throw error;
};

// --- Parents ---
export const apiGetParents = async (): Promise<Parent[]> => {
    if (isDemoMode()) return demoParents;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('parents').select('*');
    if (error) throw error;
    return data || [];
};

export const apiUpsertParent = async (parentData: Partial<Parent>): Promise<Parent> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping parent upsert.");
        return parentData as Parent;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('parents').upsert(parentData).select().single();
    if (error) throw error;
    return data;
};

export const apiInviteParent = async (student: Student) => {
    if (!student.parentEmail) {
        throw new Error("Student does not have a parent's email address.");
    }
    if (!supabase) throw new Error("Authentication service is not available.");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Admin not authenticated.");

    const response = await fetch('/api/invite-parent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ studentId: student.id }),
    });
    
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to send invitation.');
    }
    return responseData;
};

// --- Subjects ---
export const apiGetSubjects = async (): Promise<Subject[]> => {
    if (isDemoMode()) return demoSubjects;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('subjects').select('*');
    if (error) throw error;
    return data || [];
};

export const apiUpsertSubject = async (subjectData: Partial<Subject>): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping subject upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('subjects').upsert(subjectData);
    if (error) throw error;
};

export const apiDeleteSubject = async (subjectId: string): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping subject delete.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('subjects').delete().match({ id: subjectId });
    if (error) throw error;
};

// Fix: Add missing apiSaveSubjects function
export const apiSaveSubjects = async (subjects: Subject[], tenantId?: string): Promise<void> => {
    const effectiveTenantId = tenantId || getTenantId();
    if (effectiveTenantId === DEMO_TENANT_ID) {
        console.warn("DEMO: Skipping subjects save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const subjectsWithTenant = subjects.map(s => ({...s, tenant_id: effectiveTenantId}));
    const { error } = await supabase.from('subjects').upsert(subjectsWithTenant);
    if (error) throw error;
};


// --- Teachers ---
export const apiGetTeachers = async (): Promise<Teacher[]> => {
    if (isDemoMode()) return demoTeachers;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('teachers').select('*');
    if (error) throw error;
    return data || [];
};

export const apiUpsertTeacher = async (teacherData: Partial<Teacher>): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping teacher upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('teachers').upsert(teacherData);
    if (error) throw error;
};

export const apiDeleteTeacher = async (teacherId: string): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping teacher delete.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('teachers').delete().match({ id: teacherId });
    if (error) throw error;
};

// Fix: Add missing apiSaveTeachers function
export const apiSaveTeachers = async (teachers: Teacher[], tenantId?: string): Promise<void> => {
    const effectiveTenantId = tenantId || getTenantId();
    if (effectiveTenantId === DEMO_TENANT_ID) {
        console.warn("DEMO: Skipping teachers save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const teachersWithTenant = teachers.map(t => ({...t, tenant_id: effectiveTenantId}));
    const { error } = await supabase.from('teachers').upsert(teachersWithTenant);
    if (error) throw error;
};

// --- Scores ---
export const apiGetScores = async (filters: { studentIds?: string[], subjectId?: string, session?: string, term?: string } = {}): Promise<Score[]> => {
    if (isDemoMode()) {
        let scores = demoScores;
        if (filters.studentIds) scores = scores.filter(s => filters.studentIds!.includes(s.studentId));
        if (filters.subjectId) scores = scores.filter(s => s.subjectId === filters.subjectId);
        if (filters.session) scores = scores.filter(s => s.session === filters.session);
        if (filters.term) scores = scores.filter(s => s.term === filters.term);
        return scores;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    let query = supabase.from('scores').select('*');
    if (filters.studentIds) query = query.in('studentId', filters.studentIds);
    if (filters.subjectId) query = query.eq('subjectId', filters.subjectId);
    if (filters.session) query = query.eq('session', filters.session);
    if (filters.term) query = query.eq('term', filters.term);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const apiUpsertScore = async (scoreData: Partial<Score>): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping score upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('scores').upsert(scoreData);
    if (error) throw error;
};

export const apiBatchUpsertScores = async (scoresToUpsert: Partial<Score>[]): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping batch score upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('scores').upsert(scoresToUpsert);
    if (error) throw error;
}

// --- Settings ---
// Fix: Modified to accept an optional tenantId for use in super-admin contexts.
export const apiGetSchoolSettings = async (tenantId?: string): Promise<SchoolSettings> => {
    const effectiveTenantId = tenantId || getTenantId();
    if (effectiveTenantId === DEMO_TENANT_ID) return demoSchoolSettings;
    if (!supabase) throw new Error("Database client not initialized.");
    
    let query = supabase.from('settings').select('*');
    if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
    }
    
    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' error
    return data || {};
};

// Fix: Modified to accept an optional tenantId for use during new tenant creation.
export const apiSaveSchoolSettings = async (settingsData: Partial<SchoolSettings>, tenantId?: string): Promise<void> => {
    const effectiveTenantId = tenantId || getTenantId();
    if (effectiveTenantId === DEMO_TENANT_ID) {
        console.warn("DEMO: Skipping settings save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const dataToUpsert = { ...settingsData, id: 1, tenant_id: effectiveTenantId };
    const { error } = await supabase.from('settings').upsert(dataToUpsert, { onConflict: 'tenant_id' }); // Assuming tenant_id is the PK or unique
    if (error) throw error;
};

// --- Timetable ---
export const apiGetTimetableData = async (): Promise<any> => {
    if (isDemoMode()) return demoTimetable;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('settings').select('timetable').single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.timetable || {};
};

export const apiSaveTimetableData = async (timetableData: any): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping timetable save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('settings').upsert({ id: 1, timetable: timetableData });
    if (error) throw error;
};

// --- Attendance ---
export const apiGetAttendance = async (filters: { date?: string } = {}): Promise<any[]> => {
    if (isDemoMode()) {
        let attendance = demoAttendance;
        if (filters.date) attendance = attendance.filter(a => a.date === filters.date);
        return attendance;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    let query = supabase.from('attendance').select('*');
    if (filters.date) query = query.eq('date', filters.date);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const apiSaveAttendanceRecord = async (attendanceRecord: { date: string, statuses: any }): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping attendance save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('attendance').upsert(attendanceRecord, { onConflict: 'date' });
    if (error) throw error;
};

// --- Remarks & Behavioral ---
export const apiGetRemarks = async (): Promise<Remark[]> => {
    if (isDemoMode()) return demoRemarks;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('remarks').select('*');
    if (error) throw error;
    return data || [];
};

export const apiUpsertRemark = async (remarkData: Partial<Remark>): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping remark upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('remarks').upsert(remarkData);
    if (error) throw error;
};

export const apiGetBehavioralRecords = async (filters: { classFilter?: string } = {}): Promise<BehavioralLogEntry[]> => {
    if (isDemoMode()) return demoBehavioralRecords;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('behavioral_logs').select('*');
    if (error) throw error;
    // Client-side filtering if needed, as classFilter is not implemented in the backend query here.
    return data || [];
};

export const apiUpsertBehavioralRecord = async (record: Partial<BehavioralLogEntry>): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping behavioral record upsert.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('behavioral_logs').upsert(record);
    if (error) throw error;
};

// --- Assignments ---
export const apiGetAssignments = async (): Promise<Assignment[]> => {
    if (isDemoMode()) return demoAssignments;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('assignments').select('*');
    if (error) throw error;
    return data || [];
};

export const apiSaveAssignments = async (assignments: Assignment[]): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping assignments save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('assignments').upsert(assignments);
    if (error) throw error;
};

export const apiGetAssignmentScores = async (): Promise<AssignmentScore[]> => {
    if (isDemoMode()) return demoAssignmentScores;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('assignment_scores').select('*');
    if (error) throw error;
    return data || [];
};

export const apiSaveAssignmentScores = async (scores: AssignmentScore[]): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping assignment scores save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('assignment_scores').upsert(scores);
    if (error) throw error;
};

// --- Bursary ---
export const apiGetFees = async (): Promise<Fee[]> => {
    if (isDemoMode()) return demoFees;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('fees').select('*');
    if (error) throw error;
    return data || [];
};

export const apiSaveFees = async (fees: Fee[]): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping fees save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('fees').upsert(fees);
    if (error) throw error;
};

// Fix: Modified to accept an optional tenantId for public-facing components.
export const apiGetScratchCards = async (tenantId?: string): Promise<ScratchCard[]> => {
    const effectiveTenantId = tenantId || getTenantId();
    if (effectiveTenantId === DEMO_TENANT_ID) return demoScratchCards;
    if (!supabase) throw new Error("Database client not initialized.");
    let query = supabase.from('scratch_cards').select('*');
    if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const apiSaveScratchCards = async (cards: ScratchCard[]): Promise<void> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping scratch cards save.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('scratch_cards').upsert(cards);
    if (error) throw error;
};

// --- Public / Multi-tenant (Simulations to be replaced) ---
export const apiGetPublicStudentResult = async (schoolId: string, admissionNo: string) => {
    // This is a public function, so we must be very careful.
    // It assumes RLS is configured on the backend for anonymous read access with tenant_id filter.
    if (!supabase) throw new Error("Database client not initialized.");
    
    // In a real app with separate Supabase projects per tenant, you'd initialize a client for 'schoolId' here.
    // With a multi-tenant setup, we rely on RLS and a tenant_id column.
    
    const { data: students, error: studentError } = await supabase.from('students')
        .select('*').eq('tenant_id', schoolId).eq('admissionNo', admissionNo);
    if (studentError) throw studentError;
    const student = students[0];
    if (!student) throw new Error("Student not found.");

    const [
        { data: scores }, { data: subjects }, { data: schoolSettings }, 
        { data: remarks }, { data: attendance }, { data: studentsInClass }
    ] = await Promise.all([
        supabase.from('scores').select('*').eq('tenant_id', schoolId),
        supabase.from('subjects').select('*').eq('tenant_id', schoolId),
        supabase.from('settings').select('*').eq('tenant_id', schoolId).single(),
        supabase.from('remarks').select('*').eq('tenant_id', schoolId),
        supabase.from('attendance').select('*').eq('tenant_id', schoolId),
        supabase.from('students').select('*').eq('tenant_id', schoolId).eq('class', student.class),
    ]);
    
    return { student, students: studentsInClass, scores, subjects, schoolSettings, remarks, attendance };
};

export const apiUseScratchCard = async (pin: string, tenantId: string) => {
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('scratch_cards').update({ used: true }).eq('tenant_id', tenantId).eq('pin', pin);
    if (error) throw error;
};

// --- Super Admin / Platform ---
export const apiGetTenants = async (): Promise<Tenant[]> => {
    if (!supabase) throw new Error("Database client not initialized.");
    // Select all columns and let Supabase return them. The names should match the camelCase Tenant type.
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return data || [];
};

export const apiAddTenant = async (tenant: { id: string, name: string }) => {
    if (!supabase) throw new Error("Database client not initialized.");
    const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    // The newTenant object is already in camelCase, matching the Tenant type.
    const newTenant: Partial<Tenant> = {
        ...tenant,
        subscriptionStatus: 'trial',
        trialEndDate: trialExpiry,
        subscriptionExpiryDate: trialExpiry,
    };
    // Insert the camelCase object directly.
    const { error } = await supabase.from('tenants').insert(newTenant);
    if (error) throw error;
};

export const apiUpdateTenant = async (tenantData: Tenant) => {
    if (!supabase) throw new Error("Database client not initialized.");
    // Update with the camelCase object directly.
    const { error } = await supabase.from('tenants').update(tenantData).match({ id: tenantData.id });
    if (error) throw error;
};

export const apiUpdateSubscription = async (planId: string): Promise<void> => {
    const tenantId = getTenantId();
    if (!tenantId || isDemoMode()) {
        console.warn("DEMO or no tenant: Skipping subscription update.");
        return;
    }

    try {
        // 1. Get current tenant info and settings
        const [tenants, schoolSettings] = await Promise.all([
            apiGetTenants(),
            apiGetSchoolSettings()
        ]);
        
        const currentTenant = tenants.find(t => t.id === tenantId);
        if (!currentTenant) {
            throw new Error("Could not find tenant record to update.");
        }
        
        // 2. Update tenant's own settings with the new planId
        await apiSaveSchoolSettings({ ...schoolSettings, planId });

        // 3. Update the central tenant record with planId and active status
        const updatedTenantData: Tenant = {
            ...currentTenant,
            planId,
            subscriptionStatus: 'active',
            trialEndDate: null, // End trial if they subscribe
        };
        await apiUpdateTenant(updatedTenantData);

    } catch (error) {
        console.error("Failed to update subscription:", error);
        throw error; // Re-throw to be caught by the calling component
    }
};

export const apiDeleteTenant = async (tenantId: string) => {
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('tenants').delete().match({ id: tenantId });
    if (error) throw error;
};

export const apiFindTenantByEmail = async (email: string): Promise<string | null> => {
    if (isDemoMode()) {
        const teacher = demoTeachers.find(t => t.email.toLowerCase() === email.toLowerCase());
        return teacher ? DEMO_TENANT_ID : null;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('teachers').select('tenant_id').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.tenant_id || null;
};

// --- Other Features (to be migrated) ---
const demoPlatformSettings = {
    plans: [
        { id: 'plan_basic', name: 'Basic', description: 'Core academic tools, report cards, AI grading, teacher & parent dashboards', price_monthly: 3000, price_termly: 7000, price_yearly: 16800, features: { maxStudents: 100 } },
        { id: 'plan_pro', name: 'Pro', description: 'All Basic features + AI Assistant, Analytics, Assignments, Alumni', price_monthly: 4000, price_termly: 10000, price_yearly: 24000, features: { maxStudents: 250 } },
        { id: 'plan_enterprise', name: 'Enterprise', description: 'Everything + Custom Automation, School-Wide Insights & Priority Support', price_monthly: 5500, price_termly: 14000, price_yearly: 33600, features: { maxStudents: 500 } },
    ],
    pages: [],
    menus: { header: [] },
    landingPageContent: {
        promoBanner: { enabled: true, text: 'Welcome to the Demo!', endDate: new Date(Date.now() + 3600 * 1000).toISOString() },
        hero: { 
            title: 'Nigeria’s #1 AI-Powered School Performance Suite', 
            subtitle: 'This is not just another school portal. This is ReportSheet — the revolutionary AI suite built to help schools reduce student failure, boost academic performance, and generate intelligent report cards in minutes.\n\nBecause running a school should be about impact, not paperwork.' 
        },
        trustBar: { enabled: false, logos: [] },
        problem: { 
            title: 'The Hidden Truth About Many Schools', 
            points: [
                'Students are struggling to perform.',
                'Teachers are overworked and under-supported.',
                'Parents are frustrated with poor communication.',
                'And school owners spend nights buried in result sheets.'
            ],
            extraText: "You’ve tried traditional school management systems. They helped you record data — but not improve performance.\n\nThat’s where ReportSheet changes the game."
        },
        solution: {
            title: 'The Future of Academic Excellence Has Arrived',
            features: [
                { icon: 'ChartBarIcon', title: 'Built to Improve Learning Outcomes', desc: 'ReportSheet uses artificial intelligence to analyze academic trends, detect learning gaps early, and help teachers personalize support for every child. You’re not just managing students — you’re developing them.' },
                { icon: 'DocumentArrowDownIcon', title: 'Generate Report Cards Instantly', desc: 'No more result-week chaos. From raw scores to positions, grading, and insightful AI-generated remarks — every report is accurate, polished, and ready to print in minutes.' },
                { icon: 'SparklesIcon', title: 'AI Teacher Assistant', desc: 'Our built-in AI helps teachers write better, faster, and smarter — generating lesson notes, report comments, and personalized student feedback in seconds. Less stress. More teaching. Better results.' },
                { icon: 'BrainCircuitIcon', title: 'Turn Data Into Decisions', desc: 'Real-time analytics reveal which students need attention, which teachers are excelling, and which subjects need intervention. Because a data-driven school is a high-performing school.' },
                { icon: 'ChatBubbleLeftRightIcon', title: 'Engage Parents the Smart Way', desc: 'Parents no longer have to call repeatedly. They can view grades, attendance, and teacher feedback anytime — from anywhere. This transparency builds trust and boosts student motivation.' },
            ]
        },
        howItWorks: { title: 'How It Works', steps: [] },
        testimonials: { 
            title: 'Why Schools Across Nigeria Are Switching to ReportSheet', 
            items: [
                { id: 't1', quote: "We moved from a regular school portal to ReportSheet — and saw our students’ performance improve within one term. It’s not just automation, it’s intelligence.", name: 'Mrs. Adaeze Nwosu', role: 'Proprietress', school: 'Bright Minds Academy, Lagos', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Adaeze' },
                { id: 't2', quote: "The AI comment generator is pure genius. It saves me time and helps me write comments that actually motivate my students.", name: 'Mr. Femi Adeboye', role: 'JSS 2 Coordinator', school: 'Royal Pillars College, Abuja', avatar: 'https://api.dicebear.com/8.x/avataaars/svg?seed=Femi' },
                { id: 't3', quote: "Parents love the instant updates. Teachers love the automation. And I love the peace of mind.", name: 'Principal', role: 'Principal', school: 'Gracefield High School, Port Harcourt', avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=P' }
            ]
        },
        pricing: {
            title: "Affordable for Every School. Powerful for Every Leader.",
            subtitle: "💡 Pay Termly or Annually and Save 20%."
        },
        faq: { 
            title: 'Your Questions, Answered', 
            items: [
                { q: 'Is this difficult to set up?', a: 'Not at all. You can launch your school suite in under 5 minutes — we provide sample data and guided onboarding.' },
                { q: 'Can I use it on my phone?', a: 'Yes! ReportSheet is fully responsive and works beautifully on phones, tablets, and computers for administrators, teachers, parents, and students.' },
                { q: 'Is my data secure?', a: 'Absolutely. We use industry-standard encryption and security protocols to keep your school\'s data safe, secure, and private.' }
            ] 
        },
        finalCta: { 
            title: 'Join the Next Generation of Smart Schools in Nigeria', 
            subtitle: 'Over 2,000+ Nigerian schools are already transforming their academic performance with ReportSheet. Don’t get left behind. Start improving results today — not next term.',
            tagline: "ReportSheet — The AI Suite That Turns Ordinary Schools into Exceptional Ones."
        },
    },
    articles: [],
    kb_articles: [],
    platformUsers: []
};

export const apiGetPlatformSettings = async () => ({
    ...demoPlatformSettings
});
export const apiSavePlatformSettings = async (settings: any) => console.warn("DEMO: Skipping platform settings save.");
export const apiGetAnnouncements = async (): Promise<Announcement[]> => {
    if (isDemoMode()) return demoAnnouncements;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};
export const apiSendAnnouncement = async (announcement: Partial<Announcement>) => {
    if (isDemoMode()) { console.warn("DEMO: Skipping announcement send."); return; }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('announcements').insert(announcement);
    if (error) throw error;
};
export const apiSendAlumniEmail = async (recipients: string[], subject: string, body: string) => {
    console.log("Simulating email send to alumni:", { recipients, subject, body });
    await new Promise(res => setTimeout(res, 1000));
};
export const getCurrentUser = async () => {
    // 1. Handle Demo Mode
    if (isDemoMode()) {
        const activeUserSession = sessionStorage.getItem('activeUser');
        if (activeUserSession) {
            try {
                const parsedUser = JSON.parse(activeUserSession);
                if (parsedUser.role === 'Admin' || parsedUser.role === 'Teacher') {
                    // Use the first Admin in demo data as the representative user
                    const demoAdmin = demoTeachers.find(t => t.role === 'Admin');
                    if (demoAdmin) return { id: demoAdmin.auth_id, name: demoAdmin.name, role: demoAdmin.role };
                }
                if (parsedUser.role === 'Parent') {
                    const student = demoStudents.find(s => s.id === parsedUser.userId);
                    if (student && student.parentId) {
                        const parent = demoParents.find(p => p.id === student.parentId);
                        if (parent) return { id: parent.id, name: parent.name, role: 'Parent' };
                    }
                }
            } catch (e) {
                console.error("Failed to parse demo user session", e);
                return null;
            }
        }
        return null; // Could not identify demo user
    }

    // 2. Handle Live Mode
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [teachers, parents] = await Promise.all([apiGetTeachers(), apiGetParents()]);

    const teacherProfile = teachers.find(t => t.auth_id === user.id);
    if (teacherProfile) {
        return { id: teacherProfile.auth_id, name: teacherProfile.name, role: teacherProfile.role };
    }
    if (user.user_metadata?.parent_id) {
        const parentProfile = parents.find(p => p.id === user.user_metadata.parent_id);
        if (parentProfile) {
            return { id: parentProfile.id, name: parentProfile.name, role: 'Parent' };
        }
    }
    
    return { id: user.id, name: user.email, role: 'Unknown' };
}
export const apiGetConversationSummaries = async (userId: string, userRole: string): Promise<Conversation[]> => {
    if (isDemoMode()) {
        const relevantMessages = demoMessages.filter(
            m => m.senderId === userId || m.recipientId === userId
        );
        const conversationsMap = new Map();

        relevantMessages.forEach(msg => {
            const otherParticipantId = msg.senderId === userId ? msg.recipientId : msg.senderId;
            if (!conversationsMap.has(otherParticipantId) || new Date(msg.timestamp) > new Date(conversationsMap.get(otherParticipantId).lastMessage.timestamp)) {
                
                let otherParticipant;
                const teacher = demoTeachers.find(t => t.auth_id === otherParticipantId);
                const parent = demoParents.find(p => p.id === otherParticipantId);

                if (teacher) {
                    otherParticipant = { id: teacher.auth_id, name: teacher.name, role: teacher.role };
                } else if (parent) {
                    otherParticipant = { id: parent.id, name: parent.name, role: 'Parent' };
                } else {
                    return; // Skip if participant not found
                }

                conversationsMap.set(otherParticipantId, {
                    id: [userId, otherParticipantId].sort().join('_'),
                    participants: [userId, otherParticipantId],
                    lastMessage: msg,
                    otherParticipant,
                });
            }
        });
        
        return Array.from(conversationsMap.values());
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.rpc('get_conversation_summaries', { p_user_id: userId });
    if (error) throw error;
    return data;
};
export const apiGetMessages = async (conversationId: string): Promise<Message[]> => {
    if (isDemoMode()) return demoMessages.filter(m => m.conversationId === conversationId);
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('messages').select('*').eq('conversationId', conversationId).order('timestamp');
    if (error) throw error;
    return data || [];
};
export const apiSendMessage = async (messageData: Partial<Message>): Promise<Message> => {
    if (isDemoMode()) {
        console.warn("DEMO: Skipping message send.");
        return { ...messageData, id: `msg_${Date.now()}`, timestamp: new Date().toISOString() } as Message;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('messages').insert(messageData).select().single();
    if (error) throw error;
    return data;
};

// Fix: Add missing API functions to resolve import errors.
export const apiGetKbArticles = async () => {
    const settings = await apiGetPlatformSettings();
    return settings.kb_articles || [];
};

export const apiSaveKbArticles = async (articles: any[]) => {
    const settings = await apiGetPlatformSettings();
    await apiSavePlatformSettings({ ...settings, kb_articles: articles });
};

export const apiGetPlatformUsers = async (): Promise<PlatformUser[]> => {
    const settings = await apiGetPlatformSettings();
    return settings.platformUsers || [];
}
export const apiSavePlatformUsers = async (users: PlatformUser[]): Promise<void> => {
    const settings = await apiGetPlatformSettings();
    await apiSavePlatformSettings({ ...settings, platformUsers: users });
}

export const apiGetActivities = async (): Promise<any[]> => {
    if (isDemoMode()) {
        return [
            { id: 1, type: 'STUDENT_ADD', description: 'Added new student: Adekunle Gold', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, type: 'SUBJECT_UPDATE', description: 'Updated subject: Mathematics', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: 3, type: 'TEACHER_ADD', description: 'Added new teacher: Mr. John Doe', timestamp: new Date(Date.now() - 86400000).toISOString() },
        ];
    }
    if (!supabase) return [];
    const { data, error } = await supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(5);
    if (error) { console.error('Error fetching activities:', error); return []; }
    return data || [];
};

export const apiGetSharedLessonPlans = async (): Promise<SharedLessonPlan[]> => {
    if (isDemoMode()) return demoSharedLessonPlans;
    if (!supabase) throw new Error("Database client not initialized.");
    const { data, error } = await supabase.from('shared_lesson_plans').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const apiShareLessonPlan = async (planData: Partial<SharedLessonPlan>): Promise<void> => {
    if (isDemoMode()) {
        demoSharedLessonPlans.unshift({ ...planData, id: `shared_${Date.now()}`, createdAt: new Date().toISOString(), upvotes: 0 } as SharedLessonPlan);
        console.warn("DEMO: Shared lesson plan.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('shared_lesson_plans').insert(planData);
    if (error) throw error;
};

export const apiUpvoteLessonPlan = async (planId: string): Promise<void> => {
     if (isDemoMode()) {
        const plan = demoSharedLessonPlans.find(p => p.id === planId);
        if (plan) plan.upvotes += 1;
        console.warn("DEMO: Upvoted lesson plan.");
        return;
    }
    if (!supabase) throw new Error("Database client not initialized.");
    // This should ideally be an RPC call for atomic increment.
    // For simplicity, we'll do a read-then-write.
    const { data: current, error: fetchError } = await supabase.from('shared_lesson_plans').select('upvotes').eq('id', planId).single();
    if (fetchError) throw fetchError;
    const { error: updateError } = await supabase.from('shared_lesson_plans').update({ upvotes: (current.upvotes || 0) + 1 }).eq('id', planId);
    if (updateError) throw updateError;
};
