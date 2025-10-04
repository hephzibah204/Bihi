import { getSubdomain } from '../utils/subdomain';
import { demoSchoolSettings, demoStudents, demoSubjects, demoTeachers, demoParents, DEMO_TENANT_ID, demoMessages } from '../utils/demoData';
import { supabase } from './supabaseClient';
import { SyncStatus } from '../hooks/useSync';
import { Tenant, LandingPageContent } from '../types';

// --- Sync Queue ---
export const syncEventBus = new EventTarget();
let syncQueue: { operation: string, data: any, tenantId: string }[] = JSON.parse(localStorage.getItem('syncQueue') || '[]');
let isSyncing = false;

const dispatchSyncStatus = (status: SyncStatus) => {
    syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: status }));
};

export const isSyncNeeded = () => syncQueue.length > 0;

const saveQueue = () => {
    localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
    dispatchSyncStatus(isSyncNeeded() ? 'unsynced' : 'synced');
};

const addToQueue = (operation: string, data: any, tenantIdOverride?: string) => {
    const tenantId = tenantIdOverride !== undefined ? tenantIdOverride : getTenantId();
    syncQueue.push({ operation, data, tenantId });
    saveQueue();
};

export const processSyncQueue = async () => {
    if (isSyncing || !navigator.onLine || !supabase || syncQueue.length === 0) return false;

    isSyncing = true;
    dispatchSyncStatus('syncing');

    const originalQueue = [...syncQueue];
    syncQueue = []; // Optimistically clear queue

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error("User not authenticated. Sync paused.");
        }

        // Batch insert all queued operations for efficiency.
        const recordsToSync = originalQueue.map(item => ({
            tenant_id: item.tenantId,
            operation: item.operation,
            data: item.data,
            user_id: session.user.id // Add user_id for auditing
        }));

        const { error } = await supabase.from('synced_operations').insert(recordsToSync);

        if (error) {
            // If the batch insert fails, throw an error to trigger the catch block.
            throw error;
        }
        
        // If successful, the queue remains empty.
        saveQueue(); 
        isSyncing = false;
        return true;
    } catch (error) {
        console.error("Sync failed:", error);
        // If sync fails, put items back into the queue.
        syncQueue = [...originalQueue, ...syncQueue];
        saveQueue();
        isSyncing = false;
        return false;
    }
};

let syncInterval: number | null = null;
export const initializeSync = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = window.setInterval(processSyncQueue, 15000); // Attempt sync every 15 seconds
    processSyncQueue(); // Initial attempt
};

export const cleanupSync = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = null;
};

export const clearSyncQueue = () => {
    syncQueue = [];
    saveQueue();
};

export const apiForceSync = async () => {
    return await processSyncQueue();
}


// --- Tenancy ---
export const getTenantId = (): string | null => {
    return getSubdomain(window.location.hostname);
};

// This function determines if we should use demo data
const isDemoMode = () => getTenantId() === DEMO_TENANT_ID;

// Centralized data access
export const getTenantData = (key: string, tenantId: string | null = getTenantId()) => {
    if (!tenantId) {
        // Platform-level data (not school-specific)
        const platformData = localStorage.getItem(`platform_${key}`);
        return platformData ? JSON.parse(platformData) : null;
    }
    if (tenantId === DEMO_TENANT_ID) {
        switch (key) {
            case 'settings': return demoSchoolSettings;
            case 'students': return demoStudents;
            case 'subjects': return demoSubjects;
            case 'teachers': return demoTeachers;
            case 'parents': return demoParents;
            case 'messages': return demoMessages;
            // Add other demo data keys here
            default: return [];
        }
    }
    const data = localStorage.getItem(`tenant_${tenantId}_${key}`);
    return data ? JSON.parse(data) : null;
};

const saveTenantData = (key: string, data: any, tenantId: string | null = getTenantId()) => {
    const isPlatform = !tenantId;
    const storageKey = isPlatform ? `platform_${key}` : `tenant_${tenantId}_${key}`;

    if (isDemoMode() && !isPlatform) {
        console.warn("Attempted to save data in demo mode. Operation skipped.");
        return;
    }
    localStorage.setItem(storageKey, JSON.stringify(data));
    // Dispatch a custom event to notify other tabs/components of the change
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key, tenantId } }));
};

// --- Students ---
export const apiGetStudents = async (filters: { classFilter?: string } = {}, tenantId?: string) => {
    const effectiveTenantId = tenantId || getTenantId();
    let students = getTenantData('students', effectiveTenantId) || [];
    if (filters.classFilter) {
        students = students.filter((s: any) => s.class === filters.classFilter);
    }
    return students;
};

export const apiUpsertStudent = async (studentData: any) => {
    addToQueue('UPSERT_STUDENT', studentData);
    let students = getTenantData('students') || [];
    if (studentData.id) {
        students = students.map((s: any) => s.id === studentData.id ? { ...s, ...studentData } : s);
    } else {
        students.push({ ...studentData, id: `stud_${Date.now()}` });
    }
    saveTenantData('students', students);
};

export const apiDeleteStudent = async (studentId: string) => {
    addToQueue('DELETE_STUDENT', { id: studentId });
    let students = getTenantData('students') || [];
    students = students.filter((s: any) => s.id !== studentId);
    saveTenantData('students', students);
};

export const apiBatchUpdateStudents = async (studentsToUpdate: any[]) => {
    addToQueue('BATCH_UPDATE_STUDENTS', studentsToUpdate);
    let allStudents = getTenantData('students') || [];
    const updateMap = new Map(studentsToUpdate.map(s => [s.id, s]));
    const updatedStudents = allStudents.map(s => updateMap.has(s.id) ? { ...s, ...updateMap.get(s.id) } : s);
    saveTenantData('students', updatedStudents);
};

// --- Subjects ---
export const apiGetSubjects = async () => getTenantData('subjects') || [];

export const apiSaveSubjects = async (subjects: any[], tenantId?: string) => {
    const effectiveTenantId = tenantId || getTenantId();
    addToQueue('SAVE_SUBJECTS', subjects, effectiveTenantId);
    saveTenantData('subjects', subjects, effectiveTenantId);
};

export const apiUpsertSubject = async (subjectData: any) => {
    addToQueue('UPSERT_SUBJECT', subjectData);
    let subjects = getTenantData('subjects') || [];
    if (subjectData.id) {
        subjects = subjects.map((s: any) => s.id === subjectData.id ? { ...s, ...subjectData } : s);
    } else {
        subjects.push({ ...subjectData, id: `subj_${Date.now()}` });
    }
    saveTenantData('subjects', subjects);
};
export const apiDeleteSubject = async (subjectId: string) => {
    addToQueue('DELETE_SUBJECT', { id: subjectId });
    let subjects = getTenantData('subjects') || [];
    subjects = subjects.filter((s: any) => s.id !== subjectId);
    saveTenantData('subjects', subjects);
};

// --- Teachers ---
export const apiGetTeachers = async () => getTenantData('teachers') || [];

export const apiSaveTeachers = async (teachers: any[], tenantId?: string) => {
    const effectiveTenantId = tenantId || getTenantId();
    addToQueue('SAVE_TEACHERS', teachers, effectiveTenantId);
    saveTenantData('teachers', teachers, effectiveTenantId);
};

export const apiUpsertTeacher = async (teacherData: any) => {
    addToQueue('UPSERT_TEACHER', teacherData);
    let teachers = getTenantData('teachers') || [];
    if (teacherData.id) {
        teachers = teachers.map((t: any) => t.id === teacherData.id ? { ...t, ...teacherData } : t);
    } else {
        teachers.push({ ...teacherData, id: `teacher_${Date.now()}` });
    }
    saveTenantData('teachers', teachers);
};
export const apiDeleteTeacher = async (teacherId: string) => {
    addToQueue('DELETE_TEACHER', { id: teacherId });
    let teachers = getTenantData('teachers') || [];
    teachers = teachers.filter((t: any) => t.id !== teacherId);
    saveTenantData('teachers', teachers);
};


// --- Scores ---
// Fix: Updated apiGetScores to accept session and term filters to resolve type error in Results.tsx.
export const apiGetScores = async (filters: { studentIds?: string[], subjectId?: string, session?: string, term?: string } = {}) => {
    let scores = getTenantData('scores') || [];
    if (filters.studentIds) {
        scores = scores.filter((s: any) => filters.studentIds!.includes(s.studentId));
    }
    if (filters.subjectId) {
        scores = scores.filter((s: any) => s.subjectId === filters.subjectId);
    }
    if (filters.session) {
        scores = scores.filter((s: any) => s.session === filters.session);
    }
    if (filters.term) {
        scores = scores.filter((s: any) => s.term === filters.term);
    }
    return scores;
};

export const apiUpsertScore = async (scoreData: any) => {
    addToQueue('UPSERT_SCORE', scoreData);
    let scores = getTenantData('scores') || [];
    const existingIndex = scores.findIndex((s: any) => s.studentId === scoreData.studentId && s.subjectId === scoreData.subjectId && s.session === scoreData.session && s.term === scoreData.term);
    if (existingIndex > -1) {
        scores[existingIndex] = { ...scores[existingIndex], ...scoreData };
    } else {
        scores.push({ ...scoreData, id: `score_${Date.now()}` });
    }
    saveTenantData('scores', scores);
};

export const apiBatchUpsertScores = async (scoresToUpsert: any[]) => {
    addToQueue('BATCH_UPSERT_SCORES', scoresToUpsert);
    let allScores = getTenantData('scores') || [];
    scoresToUpsert.forEach(scoreData => {
        const existingIndex = allScores.findIndex((s: any) => s.studentId === scoreData.studentId && s.subjectId === scoreData.subjectId && s.session === scoreData.session && s.term === scoreData.term);
        if (existingIndex > -1) {
            allScores[existingIndex] = { ...allScores[existingIndex], ...scoreData };
        } else {
            allScores.push({ ...scoreData, id: `score_${Date.now()}` });
        }
    });
    saveTenantData('scores', allScores);
}

// --- Settings ---
export const apiGetSchoolSettings = async (tenantId?: string) => getTenantData('settings', tenantId || getTenantId()) || demoSchoolSettings;
export const apiSaveSchoolSettings = async (settingsData: any, tenantId?: string) => {
    const effectiveTenantId = tenantId || getTenantId();
    addToQueue('SAVE_SETTINGS', settingsData, effectiveTenantId);
    saveTenantData('settings', settingsData, effectiveTenantId);
};

// --- Timetable ---
export const apiGetTimetableData = async () => getTenantData('timetable') || {};
export const apiSaveTimetableData = async (timetableData: any) => {
    addToQueue('SAVE_TIMETABLE', timetableData);
    saveTenantData('timetable', timetableData);
};

// --- Attendance ---
export const apiGetAttendance = async (filters: { date?: string } = {}) => {
    let attendance = getTenantData('attendance') || [];
    if (filters.date) {
        attendance = attendance.filter((a: any) => a.date === filters.date);
    }
    return attendance;
};
export const apiSaveAttendanceRecord = async (attendanceRecord: { date: string, statuses: any }) => {
    addToQueue('SAVE_ATTENDANCE', attendanceRecord);
    let attendance = getTenantData('attendance') || [];
    const index = attendance.findIndex((a: any) => a.date === attendanceRecord.date);
    if (index > -1) {
        attendance[index] = attendanceRecord;
    } else {
        attendance.push(attendanceRecord);
    }
    saveTenantData('attendance', attendance);
};

// --- Remarks & Behavioral ---
export const apiUpsertRemark = async (remarkData: any) => {
    addToQueue('UPSERT_REMARK', remarkData);
    let remarks = getTenantData('remarks') || [];
    const existingIndex = remarks.findIndex((r: any) => r.studentId === remarkData.studentId && r.session === remarkData.session && r.term === remarkData.term);
    if (existingIndex > -1) {
        remarks[existingIndex] = { ...remarks[existingIndex], ...remarkData };
    } else {
        remarks.push({ ...remarkData, id: `rem_${Date.now()}` });
    }
    saveTenantData('remarks', remarks);
};
export const apiGetBehavioralRecords = async (filters: { classFilter?: string } = {}) => getTenantData('behavioral') || [];
export const apiUpsertBehavioralRecord = async (record: any) => {
    addToQueue('UPSERT_BEHAVIORAL', record);
    let records = getTenantData('behavioral') || [];
    records.push({ ...record, id: `bhv_${Date.now()}` });
    saveTenantData('behavioral', records);
};

// --- Assignments ---
export const apiGetAssignments = async () => getTenantData('assignments') || [];
export const apiSaveAssignments = async (assignments: any[]) => {
    addToQueue('SAVE_ASSIGNMENTS', assignments);
    saveTenantData('assignments', assignments);
};
export const apiGetAssignmentScores = async () => getTenantData('assignment_scores') || [];
export const apiSaveAssignmentScores = async (scores: any[]) => {
    addToQueue('SAVE_ASSIGNMENT_SCORES', scores);
    saveTenantData('assignment_scores', scores);
};

// --- Recent Activities ---
export const apiGetActivities = async () => {
    // This would be a server-side log. For demo, we'll simulate it.
    return [
        { id: 1, type: 'STUDENT_ADD', description: 'Added new student: John Doe', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, type: 'SUBJECT_UPDATE', description: 'Updated subject: Mathematics', timestamp: new Date(Date.now() - 7200000).toISOString() },
    ].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- Bursary ---
export const apiGetFees = async () => getTenantData('fees') || [];
export const apiSaveFees = async (fees: any[]) => {
    addToQueue('SAVE_FEES', fees);
    saveTenantData('fees', fees);
};
export const apiGetScratchCards = async (tenantId?: string) => getTenantData('scratch_cards', tenantId || getTenantId()) || [];
export const apiSaveScratchCards = async (cards: any[], tenantId?: string) => {
    const effectiveTenantId = tenantId || getTenantId();
    addToQueue('SAVE_SCRATCH_CARDS', cards, effectiveTenantId);
    saveTenantData('scratch_cards', cards, effectiveTenantId);
};
export const apiUseScratchCard = async (pin: string, tenantId: string) => {
    let cards = getTenantData('scratch_cards', tenantId) || [];
    const cardIndex = cards.findIndex(c => c.pin === pin);
    if (cardIndex > -1) {
        cards[cardIndex].used = true;
        await apiSaveScratchCards(cards, tenantId);
    }
};

// --- Public / Multi-tenant ---
export const apiGetPublicStudentResult = async (schoolId: string, admissionNo: string) => {
    const allStudents = await apiGetStudents({}, schoolId);
    const student = allStudents.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());
    if (!student) throw new Error("Student not found.");
    
    const [scores, subjects, settings, remarks, attendance, studentsInClass] = await Promise.all([
        getTenantData('scores', schoolId) || [],
        getTenantData('subjects', schoolId) || [],
        apiGetSchoolSettings(schoolId),
        getTenantData('remarks', schoolId) || [],
        getTenantData('attendance', schoolId) || [],
        apiGetStudents({ classFilter: student.class }, schoolId)
    ]);

    return { student, students: studentsInClass, scores, subjects, schoolSettings: settings, remarks, attendance };
};


// --- Super Admin / Platform ---
export const apiGetTenants = async (): Promise<Tenant[]> => JSON.parse(localStorage.getItem('platform_tenants') || '[]');
export const apiAddTenant = async (tenant: { id: string, name: string }) => {
    const tenants = await apiGetTenants();
    const newTenant: Tenant = {
        ...tenant,
        subscriptionStatus: 'trial',
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14-day trial
    };
    tenants.push(newTenant);
    localStorage.setItem('platform_tenants', JSON.stringify(tenants));
};
export const apiUpdateTenant = async (tenantData: Tenant) => {
    let tenants = await apiGetTenants();
    tenants = tenants.map(t => t.id === tenantData.id ? { ...t, ...tenantData } : t);
    localStorage.setItem('platform_tenants', JSON.stringify(tenants));
};
export const apiDeleteTenant = async (tenantId: string) => {
    const tenants = (await apiGetTenants()).filter(t => t.id !== tenantId);
    localStorage.setItem('platform_tenants', JSON.stringify(tenants));
    // Also remove all tenant-specific data
    Object.keys(localStorage)
        .filter(key => key.startsWith(`tenant_${tenantId}_`))
        .forEach(key => localStorage.removeItem(key));
};

const defaultLandingPageContent: LandingPageContent = {
    promoBanner: {
        enabled: true,
        text: "🎉 Special Launch Offer: Get 20% off your first year when you sign up this month!",
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()
    },
    hero: {
        title: "The All-In-One Platform to Run a Smarter School",
        subtitle: "Supercharge your school with our AI-powered management system. Automate results, engage parents, and empower teachers. Get started for free or explore our live demo."
    },
    trustBar: {
        enabled: false,
        logos: [
            { src: "...", alt: "Partner 1" },
        ]
    },
    problem: {
        title: "Is This Your Reality?",
        points: [
            "Endless weekends spent calculating results and typing comments.",
            "Parents constantly calling for updates you don't have time to give.",
            "Struggling to spot at-risk students before it's too late.",
            "Feeling overwhelmed by administrative tasks instead of teaching."
        ]
    },
    solution: {
        title: "The All-In-One Platform to Run a Smarter School",
        features: [
            { icon: "ClockIcon", title: "Automate Result Computation", desc: "From scores to positions, our system handles all calculations in seconds, eliminating errors and freeing up hundreds of hours for your teachers." },
            { icon: "SparklesIcon", title: "Empower Teachers with AI", desc: "Generate insightful, personalized report card comments and complete lesson plans in a click. Give your teachers superpowers." },
            { icon: "ChatBubbleLeftRightIcon", title: "Engage Parents Effortlessly", desc: "Provide parents with a dedicated portal to view results, track attendance, and communicate directly with teachers, building a stronger school community." }
        ]
    },
    howItWorks: {
        title: "Go Live in 3 Simple Steps",
        steps: [
            { title: "Create Your Portal", desc: "Sign up in minutes and get your school's dedicated, secure portal instantly." },
            { title: "Import Your Data", desc: "Easily upload your student, teacher, and subject lists via our simple CSV importer." },
            { title: "Transform Your School", desc: "Start entering scores, generating reports, and enjoying a more efficient, data-driven school." }
        ]
    },
    testimonials: {
        title: "Loved by Schools Across Nigeria",
        items: [
            { id: 't1', quote: "ReportSheet has been a total game-changer. What used to take us weeks now takes a few hours. Our teachers are happier and our parents are more engaged than ever.", name: "Mrs. Adaeze Nwosu", role: "Proprietress", school: "Bright Minds Academy, Lagos", avatar: "https://i.imgur.com/O44fpwA.jpeg" },
            { id: 't2', quote: "The AI comment generator is pure magic. I can now write unique, thoughtful comments for all 40 of my students in under 30 minutes. I can't imagine going back.", name: "Mr. Femi Adeboye", role: "JSS 2 Coordinator", school: "Royal Pillars College, Abuja", avatar: "https://i.imgur.com/k2NaL1U.jpeg" },
        ]
    },
    faq: {
        title: "Your Questions, Answered",
        items: [
            { q: "Is ReportSheet difficult to set up?", a: "Not at all! You can set up your school portal in under 5 minutes. We provide default data to get you started immediately, and you can customize everything to your school's specific needs." },
            { q: "Can I use it on my phone?", a: "Yes! ReportSheet is fully mobile-responsive. Teachers and admins can manage the school from their phones, and parents can check results on the go." },
            { q: "Is our school's data secure?", a: "Absolutely. We use industry-standard security practices to ensure your data is safe, secure, and always accessible to you." }
        ]
    },
    finalCta: {
        title: "Ready to Transform Your School?",
        subtitle: "Join hundreds of schools across Nigeria who trust ReportSheet to manage their academics, engage parents, and save countless hours of administrative work."
    }
};

export const apiGetPlatformSettings = async () => getTenantData('settings', null) || {
    plans: [
        { 
            id: 'plan_basic_123', 
            name: 'Basic', 
            price_monthly: 2500, 
            price_termly: 7000, 
            price_yearly: 24000, 
            features: { 
                maxStudents: 100,
                students: true,
                teachers: true,
                subjects: true,
                results: true,
                'report-cards': true,
                assignments: false,
                'general-remarks': false,
                promotions: false,
                'id-cards': false,
                timetable: false,
                attendance: false,
                communications: false,
                bursary: false,
                analytics: false,
                'ai-tools': false,
                alumni: false
            } 
        },
        { 
            id: 'plan_pro_456', 
            name: 'Pro', 
            price_monthly: 3500, 
            price_termly: 10000, 
            price_yearly: 33600, 
            features: { 
                maxStudents: 250,
                students: true,
                teachers: true,
                subjects: true,
                results: true,
                'report-cards': true,
                assignments: true,
                'general-remarks': true,
                promotions: true,
                'id-cards': true,
                timetable: true,
                attendance: true,
                communications: true,
                bursary: false,
                analytics: false,
                'ai-tools': false,
                alumni: false
            } 
        },
        { 
            id: 'plan_ent_789', 
            name: 'Enterprise', 
            price_monthly: 5000, 
            price_termly: 14000, 
            price_yearly: 48000, 
            features: { 
                maxStudents: 1000,
                students: true,
                teachers: true,
                subjects: true,
                results: true,
                'report-cards': true,
                assignments: true,
                'general-remarks': true,
                promotions: true,
                'id-cards': true,
                timetable: true,
                attendance: true,
                communications: true,
                bursary: true,
                analytics: true,
                'ai-tools': true,
                alumni: true
            } 
        }
    ],
    pages: [],
    menus: { header: [] },
    landingPageContent: defaultLandingPageContent
};
export const apiSavePlatformSettings = async (settings: any) => saveTenantData('settings', settings, null);
export const apiGetKbArticles = async () => getTenantData('kb_articles', null) || [];
export const apiSaveKbArticles = async (articles: any) => saveTenantData('kb_articles', null);
export const apiGetPlatformUsers = async () => getTenantData('users', null) || [];
export const apiSavePlatformUsers = async (users: any) => saveTenantData('users', null);

// --- Messaging ---
export const apiGetAnnouncements = async () => getTenantData('announcements') || [];
export const apiSendAnnouncement = async (announcement: any) => {
    const announcements = await apiGetAnnouncements();
    const newAnnouncement = { ...announcement, id: `ann_${Date.now()}`, created_at: new Date().toISOString() };
    saveTenantData('announcements', [newAnnouncement, ...announcements]);

    // In a real app, this would be a Supabase RPC call that inserts and possibly sends emails.
    if(supabase) {
        // This simulates a write that would trigger realtime updates
        const { error } = await supabase.from('announcements').insert([newAnnouncement]);
        if(error) console.error("Realtime announcement failed:", error);
    }
};

export const apiSendAlumniEmail = async (recipients: string[], subject: string, body: string) => {
    // This is a simulation. In a real app, this would call a server-side function.
    console.log("Simulating email send to alumni:", { recipients, subject, body });
    await new Promise(res => setTimeout(res, 1000));
};

// --- Current User & Messaging --
export const getCurrentUser = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const teachers = await apiGetTeachers();
    const teacherProfile = teachers.find(t => t.auth_id === user.id);
    if (teacherProfile) return { id: teacherProfile.auth_id, name: teacherProfile.name, role: teacherProfile.role };
    
    return { id: user.id, name: user.email, role: 'Unknown' };
}

export const apiGetConversationSummaries = async (userId: string, userRole: string) => {
    const allMessages = getTenantData('messages') || [];
    const allTeachers = await apiGetTeachers();
    const allParents = getTenantData('parents') || [];

    const conversationsMap = new Map();
    allMessages.forEach(msg => {
        if(msg.participants?.includes(userId)) {
             if (!conversationsMap.has(msg.conversationId) || new Date(msg.timestamp) > new Date(conversationsMap.get(msg.conversationId).timestamp)) {
                conversationsMap.set(msg.conversationId, msg);
            }
        }
    });

    return Array.from(conversationsMap.values()).map(msg => {
        const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        const teacher = allTeachers.find(t => t.auth_id === otherId);
        const parent = allParents.find(p => p.id === otherId);

        return {
            id: msg.conversationId,
            lastMessage: msg,
            otherParticipant: {
                id: otherId,
                name: teacher?.name || parent?.name || 'Unknown User',
                role: teacher ? teacher.role : 'Parent'
            }
        };
    }).sort((a,b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
};

export const apiGetMessages = async (conversationId: string) => {
    const allMessages = getTenantData('messages') || [];
    return allMessages.filter(m => m.conversationId === conversationId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const apiSendMessage = async (messageData) => {
    const allMessages = getTenantData('messages') || [];
    const newMessage = { ...messageData, id: `msg_${Date.now()}`, timestamp: new Date().toISOString(), read: false };
    saveTenantData('messages', [...allMessages, newMessage]);
    return newMessage;
};