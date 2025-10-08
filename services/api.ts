// services/api.ts
import { getSubdomain } from '../utils/subdomain';
import { 
    demoSchoolSettings, demoStudents, demoSubjects, demoTeachers, demoParents, DEMO_TENANT_ID, 
    demoMessages, demoScores, demoRemarks, demoAssignments, demoAssignmentScores, demoAttendance,
    demoBehavioralRecords, demoTimetable, demoFees, demoScratchCards, demoAnnouncements
} from '../utils/demoData';
import { supabase } from './supabaseClient';
import { Tenant, LandingPageContent, ReportCardSettings, Conversation, Message, Announcement, Fee, ScratchCard, SchoolSettings, Student, Subject, Teacher, Parent, Score, Remark, Assignment, AssignmentScore, BehavioralLogEntry, PlatformUser } from '../types';
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
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    return data || [];
};

export const apiAddTenant = async (tenant: { id: string, name: string }) => {
    if (!supabase) throw new Error("Database client not initialized.");
    const newTenant: Partial<Tenant> = {
        ...tenant,
        subscriptionStatus: 'trial',
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const { error } = await supabase.from('tenants').insert(newTenant);
    if (error) throw error;
};

export const apiUpdateTenant = async (tenantData: Tenant) => {
    if (!supabase) throw new Error("Database client not initialized.");
    const { error } = await supabase.from('tenants').update(tenantData).match({ id: tenantData.id });
    if (error) throw error;
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
    plans: [],
    pages: [],
    menus: { header: [] },
    landingPageContent: {
        promoBanner: { enabled: true, text: 'Welcome to the Demo!', endDate: new Date(Date.now() + 3600 * 1000).toISOString() },
        hero: { title: 'Explore ReportSheet', subtitle: 'This is a fully interactive demo of the ReportSheet platform.' },
        trustBar: { enabled: false, logos: [] },
        problem: { title: 'Common School Challenges', points: ['Manual result compilation', 'Slow communication with parents'], features: [] },
        solution: {
            title: 'An All-in-One Solution',
            features: [
                { icon: 'SparklesIcon', title: 'AI-Powered Tools', desc: 'Automate comments and get insights.' },
                { icon: 'ClockIcon', title: 'Save Time', desc: 'Reduce manual data entry.' },
                { icon: 'ChatBubbleLeftRightIcon', title: 'Engage Parents', desc: 'Keep parents informed instantly.' },
            ]
        },
        howItWorks: { title: 'How It Works', steps: [] },
        testimonials: { title: 'What Schools Say', items: [] },
        faq: { title: 'Frequently Asked Questions', items: [{q: 'Is this data saved?', a: 'No, all data in this demo is temporary and resets.'}] },
        finalCta: { title: 'Ready to Start?', subtitle: 'Sign up for your own school portal today.' },
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
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const teachers = await apiGetTeachers();
    const teacherProfile = teachers.find(t => t.auth_id === user.id || t.email.toLowerCase() === user.email.toLowerCase());
    if (teacherProfile) return { id: teacherProfile.auth_id, name: teacherProfile.name, role: teacherProfile.role };
    return { id: user.id, name: user.email, role: 'Unknown' };
}
export const apiGetConversationSummaries = async (userId: string, userRole: string): Promise<Conversation[]> => {
    if (isDemoMode()) return []; // To be implemented
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