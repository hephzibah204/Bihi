import { getSubdomain } from '../utils/subdomain';
// Fix: Import demoParents and correct demoStudents name
import { demoSchoolSettings, demoSubjects, demoTeachers, DEMO_TENANT_ID, demoParents, demoStudents } from '../utils/demoData';
// Fix: Import Parent type
import { Student, Subject, Teacher, Score, BehavioralLogEntry, Assignment, AssignmentScore, SchoolSettings, Remark, Parent, Plan } from '../types';

// --- Sync Engine ---

export const syncEventBus = new EventTarget();
let syncInterval: ReturnType<typeof setInterval> | null = null;
const SYNC_INTERVAL = 5000;
const BATCH_SIZE = 5;

const dispatchSyncStatus = (status: 'synced' | 'syncing' | 'unsynced' | 'offline') => {
    syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: status }));
};
const getSyncQueue = (tenantId = getSubdomain(window.location.hostname)): any[] => {
    try {
        const queue = localStorage.getItem(`sync_queue_${tenantId}`);
        return queue ? JSON.parse(queue) : [];
    } catch (e) { return []; }
};
const saveSyncQueue = (queue: any[], tenantId = getSubdomain(window.location.hostname)) => {
    localStorage.setItem(`sync_queue_${tenantId}`, JSON.stringify(queue));
};
const addToSyncQueue = (operation: string, table: string, record: any) => {
    if (!navigator.onLine) dispatchSyncStatus('offline');
    else dispatchSyncStatus('unsynced');
    const tenantId = getSubdomain(window.location.hostname);
    const queue = getSyncQueue(tenantId);
    const queueItem = {
        id: `op_${Date.now()}_${Math.random()}`,
        operation,
        table,
        record,
        timestamp: new Date().toISOString(),
    };
    queue.push(queueItem);
    saveSyncQueue(queue, tenantId);
};
export const processSyncQueue = async (): Promise<boolean> => {
    const tenantId = getSubdomain(window.location.hostname);
    if (!navigator.onLine) {
        dispatchSyncStatus('offline');
        return false;
    }
    let queue = getSyncQueue(tenantId);
    if (queue.length === 0) {
        dispatchSyncStatus('synced');
        return true;
    }
    dispatchSyncStatus('syncing');
    const batch = queue.slice(0, BATCH_SIZE);
    try {
        console.log("SYNCING BATCH:", batch);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        queue = queue.slice(BATCH_SIZE);
        saveSyncQueue(queue, tenantId);
        if (queue.length > 0) return processSyncQueue();
        else {
            dispatchSyncStatus('synced');
            return true;
        }
    } catch (error) {
        console.error("Sync failed:", error);
        dispatchSyncStatus('unsynced');
        return false;
    }
};
export const apiForceSync = async (): Promise<boolean> => {
    const tenantId = getSubdomain(window.location.hostname);
    let queue = getSyncQueue(tenantId);
    if (queue.length === 0) return true;
    dispatchSyncStatus('syncing');
    try {
        console.log("FORCE SYNCING:", queue);
        await new Promise(resolve => setTimeout(resolve, 1000));
        saveSyncQueue([], tenantId);
        dispatchSyncStatus('synced');
        return true;
    } catch (error) {
        console.error("Force sync failed:", error);
        dispatchSyncStatus('unsynced');
        return false;
    }
};
export const initializeSync = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(processSyncQueue, SYNC_INTERVAL);
    processSyncQueue();
};
export const cleanupSync = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = null;
};
export const clearSyncQueue = (tenantId = getSubdomain(window.location.hostname)) => {
    saveSyncQueue([], tenantId);
};
export const isSyncNeeded = (): boolean => getSyncQueue().length > 0;
// --- Data Access Layer ---
const isDemoMode = () => getSubdomain(window.location.hostname) === 'demo';
export const getTenantId = () => {
    const subdomain = getSubdomain(window.location.hostname);
    return subdomain === 'demo' ? DEMO_TENANT_ID : subdomain;
};
export const getTenantData = (key: string, tenantId = getTenantId()) => {
    try {
        const item = localStorage.getItem(`${key}_${tenantId}`);
        return item ? JSON.parse(item) : null;
    } catch (e) { return null; }
};
const saveTenantData = (key: string, data: any, tenantId = getTenantId()) => {
    localStorage.setItem(`${key}_${tenantId}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
};
// --- Record-level API functions ---
export const apiUpsertRecord = async (table: string, record: any) => {
    const tenantId = getTenantId();
    let data = getTenantData(table, tenantId) || [];
    const recordWithTimestamp = { ...record, last_updated: new Date().toISOString() };
    
    // Ensure ID exists
    if (!recordWithTimestamp.id) {
        recordWithTimestamp.id = `${table.slice(0, 3)}_${Date.now()}_${Math.random()}`;
    }

    const index = data.findIndex(r => r.id === recordWithTimestamp.id);

    if (index !== -1) {
        data[index] = { ...data[index], ...recordWithTimestamp };
    } else {
        data.push(recordWithTimestamp);
    }
    saveTenantData(table, data, tenantId);
    addToSyncQueue('UPSERT_RECORD', table, data[index !== -1 ? index : data.length - 1]);
};
export const apiDeleteRecord = async (table: string, recordId: string) => {
    const tenantId = getTenantId();
    let data = getTenantData(table, tenantId) || [];
    data = data.filter(r => r.id !== recordId);
    saveTenantData(table, data, tenantId);
    addToSyncQueue('DELETE_RECORD', table, { id: recordId });
};
// --- Specific API Functions ---
// Parents
export const apiGetParents = async (tenantIdArg?: string): Promise<Parent[]> => {
    const tenantId = tenantIdArg || getTenantId();
    let parents = getTenantData('parents', tenantId);
    if (!parents) {
        if (isDemoMode() || tenantId === DEMO_TENANT_ID) return demoParents || [];
        return [];
    }
    return parents;
};
export const apiUpsertParent = (parent: Partial<Parent>) => apiUpsertRecord('parents', parent);
// Students
// FIX: Changed function signature to accept optional tenantId correctly, fixing "Expected 0-1 arguments, but got 2" error.
export const apiGetStudents = async (filters: { classFilter?: string } = {}, tenantIdArg?: string): Promise<Student[]> => {
    const tenantId = tenantIdArg || getTenantId();
    let students = getTenantData('students', tenantId);
    if (!students) {
        if (isDemoMode() || tenantId === DEMO_TENANT_ID) {
            const demoStudentsCopy = JSON.parse(JSON.stringify(demoStudents || []));
            if (filters.classFilter) return demoStudentsCopy.filter((s: Student) => s.class === filters.classFilter);
            return demoStudentsCopy;
        }
        return [];
    }
    if (filters.classFilter) students = students.filter((s: Student) => s.class === filters.classFilter);
    return students;
};
export const apiUpsertStudentAndLinkParent = async (studentData: Partial<Student>) => {
    const parents = await apiGetParents();
    let parentToLink: Parent | null = null;
    const parentIdentifier = studentData.parentEmail || studentData.parentPhone;
    if (parentIdentifier) {
        parentToLink = parents.find(p =>
            (studentData.parentEmail && p.email && p.email.toLowerCase() === studentData.parentEmail.toLowerCase()) ||
            (studentData.parentPhone && p.phone === studentData.parentPhone)
        ) || null;
    }
    if (!parentToLink && parentIdentifier) {
        const newParent: Partial<Parent> = {
            id: `parent_${Date.now()}`,
            name: studentData.parentName || `Parent of ${studentData.name}`,
            email: studentData.parentEmail,
            phone: studentData.parentPhone,
            address: studentData.parentAddress,
        };
        await apiUpsertParent(newParent);
        parentToLink = newParent as Parent;
    }
    const finalStudentData = {
        ...studentData,
        parentId: parentToLink ? parentToLink.id : studentData.parentId,
    };
    return apiUpsertRecord('students', finalStudentData);
};
export const apiUpsertStudent = (student: Partial<Student>) => apiUpsertStudentAndLinkParent(student);
export const apiDeleteStudent = (studentId: string) => apiDeleteRecord('students', studentId);
export const apiBatchUpdateStudents = async (studentsToUpdate: Partial<Student>[]) => {
    const allStudents = await apiGetStudents();
    const updatedStudents = allStudents.map(student => {
        const update = studentsToUpdate.find(u => u.id === student.id);
        if (update) {
            const updatedStudent = { ...student, ...update, last_updated: new Date().toISOString() };
            addToSyncQueue('UPSERT_RECORD', 'students', updatedStudent);
            return updatedStudent;
        }
        return student;
    });
    saveTenantData('students', updatedStudents);
};
// Teachers
// FIX: Changed function signature to accept optional tenantId.
export const apiGetTeachers = async (tenantIdArg?: string): Promise<Teacher[]> => {
    const tenantId = tenantIdArg || getTenantId();
    let teachers = getTenantData('teachers', tenantId);
    if (!teachers) {
        if (isDemoMode() || tenantId === DEMO_TENANT_ID) return demoTeachers;
        return [];
    }
    return teachers;
};
export const apiUpsertTeacher = (teacher: Partial<Teacher>) => apiUpsertRecord('teachers', teacher);
export const apiDeleteTeacher = (teacherId: string) => apiDeleteRecord('teachers', teacherId);
// Fix: Add missing apiSaveTeachers function
export const apiSaveTeachers = async (teachers: Teacher[], tenantId = getTenantId()) => {
    saveTenantData('teachers', teachers, tenantId);
};

// Subjects
// FIX: Changed function signature to accept optional tenantId.
export const apiGetSubjects = async (tenantIdArg?: string): Promise<Subject[]> => {
    const tenantId = tenantIdArg || getTenantId();
    let subjects = getTenantData('subjects', tenantId);
    if (!subjects) {
        if (isDemoMode() || tenantId === DEMO_TENANT_ID) return demoSubjects;
        return [];
    }
    return subjects;
};
export const apiUpsertSubject = (subject: Partial<Subject>) => apiUpsertRecord('subjects', subject);
export const apiDeleteSubject = (subjectId: string) => apiDeleteRecord('subjects', subjectId);
// Fix: Add missing apiSaveSubjects function
export const apiSaveSubjects = async (subjects: Subject[], tenantId = getTenantId()) => {
    saveTenantData('subjects', subjects, tenantId);
};

// Scores
// FIX: Changed function signature to accept optional tenantId.
export const apiGetScores = async (filters: { studentIds?: string[], subjectId?: string } = {}, tenantIdArg?: string): Promise<Score[]> => {
    const tenantId = tenantIdArg || getTenantId();
    let scores = getTenantData('scores', tenantId) || [];
    if (filters.studentIds) {
        const studentIdSet = new Set(filters.studentIds);
        scores = scores.filter((s: Score) => studentIdSet.has(s.studentId));
    }
    if (filters.subjectId) {
        scores = scores.filter((s: Score) => s.subjectId === filters.subjectId);
    }
    return scores;
};
export const apiUpsertScore = (score: Partial<Score>) => apiUpsertRecord('scores', score);
export const apiBatchUpsertScores = async (scoresToUpsert: Partial<Score>[]) => {
    const allScores = await apiGetScores();
    const updatedScoresMap = new Map(allScores.map(s => [`${s.studentId}-${s.subjectId}-${s.term}-${s.session}`, s]));
    scoresToUpsert.forEach(scoreUpdate => {
        const key = `${scoreUpdate.studentId}-${scoreUpdate.subjectId}-${scoreUpdate.term}-${scoreUpdate.session}`;
        const existingScore = updatedScoresMap.get(key);
        const updatedScore = { ...existingScore, ...scoreUpdate, last_updated: new Date().toISOString() };
        if (!updatedScore.id) updatedScore.id = `score_${Date.now()}_${Math.random()}`;
        updatedScoresMap.set(key, updatedScore);
        addToSyncQueue('UPSERT_RECORD', 'scores', updatedScore);
    });
    saveTenantData('scores', Array.from(updatedScoresMap.values()));
};
// School Settings
export const apiGetSchoolSettings = async (tenantId = getTenantId()): Promise<SchoolSettings | null> => {
    let settings = getTenantData('school_settings', tenantId);
    if (!settings) {
        if (isDemoMode() || tenantId === DEMO_TENANT_ID) return demoSchoolSettings;
        return null;
    }
    return settings;
};
export const apiSaveSchoolSettings = async (settings: SchoolSettings, tenantId = getTenantId()) => {
    saveTenantData('school_settings', settings, tenantId);
};
// Behavioral Records
export const apiGetBehavioralRecords = async (filters: { classFilter?: string } = {}): Promise<BehavioralLogEntry[]> => {
    let records = getTenantData('behavioral') || [];
    if (filters.classFilter) {
        const studentsInClass = await apiGetStudents({ classFilter: filters.classFilter });
        const studentIds = new Set(studentsInClass.map(s => s.id));
        records = records.filter(r => studentIds.has(r.studentId));
    }
    return records;
};
export const apiUpsertBehavioralRecord = (record: Partial<BehavioralLogEntry>) => apiUpsertRecord('behavioral', record);
// Attendance
// FIX: Changed function signature to accept optional tenantId.
export const apiGetAttendance = async (filters: { date?: string } = {}, tenantIdArg?: string): Promise<any[]> => {
    const tenantId = tenantIdArg || getTenantId();
    let records = getTenantData('attendance', tenantId) || [];
    if (filters.date) {
        records = records.filter(r => r.date === filters.date);
    }
    return records;
};
export const apiSaveAttendanceRecord = (record: { date: string, statuses: Record<string, string> }) => {
    const allAttendance = getTenantData('attendance') || [];
    const index = allAttendance.findIndex(r => r.date === record.date);
    const recordWithTimestamp = { ...record, last_updated: new Date().toISOString() };
    if (index !== -1) allAttendance[index] = recordWithTimestamp;
    else allAttendance.push(recordWithTimestamp);
    saveTenantData('attendance', allAttendance);
    addToSyncQueue('UPSERT_RECORD', 'attendance', recordWithTimestamp);
};
// Assignments
export const apiGetAssignments = async (filters: { classFilter?: string, subjectFilter?: string } = {}): Promise<Assignment[]> => {
    let assignments = getTenantData('assignments') || [];
    if (filters.classFilter) assignments = assignments.filter(a => a.class === filters.classFilter);
    if (filters.subjectFilter) assignments = assignments.filter(a => a.subjectId === filters.subjectFilter);
    return assignments;
};
export const apiSaveAssignments = async (assignments: Assignment[]) => {
    saveTenantData('assignments', assignments);
    console.warn("apiSaveAssignments is deprecated for sync. Refactor to use granular upserts.");
};
export const apiGetAssignmentScores = async (): Promise<AssignmentScore[]> => getTenantData('assignment_scores') || [];
export const apiSaveAssignmentScores = async (scores: AssignmentScore[]) => {
    saveTenantData('assignment_scores', scores);
    console.warn("apiSaveAssignmentScores is deprecated for sync. Refactor to use granular upserts.");
};
// Remarks
export const apiUpsertRemark = (remark: Partial<Remark>) => apiUpsertRecord('remarks', remark);

// Fix: Add missing timetable functions
export const apiGetTimetableData = async (): Promise<any> => {
    return getTenantData('timetable') || {};
};
export const apiSaveTimetableData = async (data: any) => {
    saveTenantData('timetable', data);
    // This is a bulk operation, so skipping granular sync queue for now.
};

// --- Platform-level (Super Admin) Functions ---
export const apiGetTenants = async () => getTenantData('tenants', 'platform') || [];
export const apiSaveTenants = async (tenants: any[]) => saveTenantData('tenants', tenants, 'platform');
export const apiGetPlatformSettings = async () => getTenantData('platform_settings', 'platform') || { plans: [], articles: [], kb_articles: [] };
export const apiSavePlatformSettings = async (settings: any) => saveTenantData('platform_settings', settings, 'platform');
export const apiAddTenant = async (tenant: { id: string, name: string }) => {
    const tenants = await apiGetTenants();
    if (tenants.some(t => t.id === tenant.id)) {
        throw new Error("A tenant with this Portal ID already exists.");
    }
    await apiSaveTenants([...tenants, tenant]);
};
export const apiDeleteTenantData = async (tenant: { id: string }) => {
    // In a real app, this would be a complex backend operation.
    // For local storage, we just remove the tenant's data keys.
    const keys = ['students', 'teachers', 'subjects', 'scores', 'school_settings', 'attendance', 'behavioral', 'assignments', 'assignment_scores', 'remarks', 'fees', 'scratch_cards', 'announcements', 'parents'];
    keys.forEach(key => localStorage.removeItem(`${key}_${tenant.id}`));
};
export const apiGetKbArticles = async () => (await apiGetPlatformSettings()).kb_articles || [];
export const apiSaveKbArticles = async (articles: any[]) => {
    const settings = await apiGetPlatformSettings();
    await apiSavePlatformSettings({ ...settings, kb_articles: articles });
};

// --- Public/Cross-Tenant Functions ---
export const apiGetPublicStudentResult = async (tenantId: string, admissionNo: string) => {
    const students = await apiGetStudents({}, tenantId);
    const student = students.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());
    if (!student) throw new Error("Student not found.");

    const [scores, subjects, schoolSettings, allStudents, remarks, attendance] = await Promise.all([
        apiGetScores({}, tenantId),
        apiGetSubjects(tenantId),
        apiGetSchoolSettings(tenantId),
        apiGetStudents({}, tenantId),
        getTenantData('remarks', tenantId) || [],
        apiGetAttendance({}, tenantId)
    ]);
    return { student, scores, subjects, schoolSettings, students: allStudents, remarks, attendance };
};

export const apiGetScratchCards = async (tenantId = getTenantId()) => getTenantData('scratch_cards', tenantId) || [];
export const apiSaveScratchCards = async (cards: any[], tenantId = getTenantId()) => saveTenantData('scratch_cards', cards, tenantId);
export const apiUseScratchCard = async (pin: string, tenantId: string) => {
    const cards = await apiGetScratchCards(tenantId);
    const cardIndex = cards.findIndex(c => c.pin === pin);
    if (cardIndex === -1) throw new Error("Card not found during use operation.");
    cards[cardIndex].used = true;
    await apiSaveScratchCards(cards, tenantId);
};

// Bursary
export const apiGetFees = async (tenantId = getTenantId()) => getTenantData('fees', tenantId);
export const apiSaveFees = async (fees: any[], tenantId = getTenantId()) => saveTenantData('fees', fees, tenantId);
// Communications
export const apiGetAnnouncements = async (tenantId = getTenantId()) => getTenantData('announcements', tenantId) || [];
export const apiSendAnnouncement = async (announcement: any) => {
    // In a real app, this would go to a backend to handle sending emails etc.
    // For now, we just save it to local storage.
    const newAnn = {
        ...announcement,
        id: `ann_${Date.now()}`,
        created_at: new Date().toISOString(),
    };
    const announcements = await apiGetAnnouncements();
    await saveTenantData('announcements', [newAnn, ...announcements]);
};
// Alumni
export const apiSendAlumniEmail = async (recipients: string[], subject: string, body: string) => {
    console.log("Simulating email send to alumni:", { recipients, subject, body });
    return Promise.resolve();
};

// Activity Log
export const apiLogActivity = (activity: { type: string, description: string }) => {
    const tenantId = getTenantId();
    const newActivity = {
        id: `act_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        ...activity
    };
    const currentActivities = getTenantData('activities', tenantId) || [];
    const updatedActivities = [newActivity, ...currentActivities].slice(0, 50); // Keep last 50
    saveTenantData('activities', updatedActivities, tenantId);
};

export const apiGetActivities = async (): Promise<any[]> => {
    return getTenantData('activities') || [];
};