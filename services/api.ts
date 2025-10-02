import { getSubdomain } from '../utils/subdomain';
import { supabase } from './supabaseClient';
import { Student, Subject, Score, Remark, SchoolSettings, Plan, Tenant } from '../types';
import { Teacher } from '../components/Teachers';

// --- SYNC ENGINE ---
// A simple event bus for sync status updates
class EventBus extends EventTarget {}
export const syncEventBus = new EventBus();

let syncInterval: ReturnType<typeof setInterval> | null = null;
const SYNC_QUEUE_KEY = 'sync_queue';
const SYNC_INTERVAL_MS = 15000; // Sync every 15 seconds

const getSyncQueue = (): any[] => {
    try {
        return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveSyncQueue = (queue: any[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

const addToSyncQueue = (item: any) => {
    const queue = getSyncQueue();
    queue.push(item);
    saveSyncQueue(queue);
    syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: 'unsynced' }));
};

export const isSyncNeeded = (): boolean => {
    return getSyncQueue().length > 0;
};

export const clearSyncQueue = () => {
    saveSyncQueue([]);
};

const processSyncQueue = async () => {
    if (!navigator.onLine || !supabase) return;
    
    let queue = getSyncQueue();
    if (queue.length === 0) {
        syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: 'synced' }));
        return;
    }

    syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: 'syncing' }));

    const itemToSync = queue[0];
    
    try {
        // In a real app, this would be a call to a Supabase Edge Function
        // to perform the specific database operation. For this mock, we'll
        // just pretend it worked and remove it from the queue.
        console.log("Syncing item:", itemToSync);
        
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // On success, remove from queue
        queue.shift();
        saveSyncQueue(queue);
        
        // If queue is now empty, we are synced
        if (queue.length === 0) {
            syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: 'synced' }));
        } else {
             // Still more to sync
            syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: 'unsynced' }));
        }

    } catch (error) {
        console.error("Sync failed:", error);
        // In a real app, you might have retry logic. Here, we'll just stop.
        syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: 'unsynced' }));
    }
};


export const initializeSync = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(processSyncQueue, SYNC_INTERVAL_MS);
    processSyncQueue(); // Initial sync check
};

export const cleanupSync = () => {
    if (syncInterval) clearInterval(syncInterval);
};

// --- DATA ACCESS LAYER ---

const getTenantId = (tenantId?: string | null) => tenantId || getSubdomain(window.location.hostname) || 'default';

// Platform-level data (not tenant-specific)
export const getPlatformData = (key: string): any => {
    try {
        const data = localStorage.getItem(`platform_${key}`);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const savePlatformData = (key: string, data: any): void => {
    try {
        localStorage.setItem(`platform_${key}`, JSON.stringify(data));
        // Dispatches a global event that useSyncedLocalStorage can listen to
        window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
    } catch (e) {
        console.error("Failed to save platform data to localStorage", e);
    }
};

// Tenant-specific data
export const getTenantData = (key: string, tenantId?: string): any => {
    const effectiveTenantId = getTenantId(tenantId);
    try {
        const data = localStorage.getItem(`tenant_${effectiveTenantId}_${key}`);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const updateTenantData = (key: string, updater: (currentData: any) => any, tenantId?: string): void => {
    const effectiveTenantId = getTenantId(tenantId);
    try {
        const currentData = getTenantData(key, effectiveTenantId);
        const newData = updater(currentData);
        localStorage.setItem(`tenant_${effectiveTenantId}_${key}`, JSON.stringify(newData));
        
        // In a real offline-first app, you'd add this change to a sync queue.
        addToSyncQueue({
            type: 'UPDATE_TENANT_DATA',
            tenantId: effectiveTenantId,
            key,
            payload: newData,
            timestamp: new Date().toISOString()
        });
        
        // Dispatches a global event that useSyncedLocalStorage can listen to
        window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
    } catch (e) {
        console.error(`Failed to update tenant data for key ${key}`, e);
        window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: `Failed to save changes for ${key}. Data may be out of sync.` } }));
    }
};

const saveTenantData = (key: string, data: any, tenantId?: string): void => {
    updateTenantData(key, () => data, tenantId);
};


// --- API FUNCTIONS ---

// Students
export const apiGetStudents = async (tenantId?: string): Promise<Student[]> => getTenantData('students', tenantId) || [];
export const apiGetStudentsForClasses = async (classes: string[], tenantId?: string): Promise<Student[]> => {
    const allStudents = await apiGetStudents(tenantId);
    return allStudents.filter(s => classes.includes(s.class));
};
export const updateStudents = async (updater: (current: Student[]) => Student[], tenantId?: string) => updateTenantData('students', updater, tenantId);
export const apiSaveStudents = async (students: Student[], tenantId?: string) => saveTenantData('students', students, tenantId);


// Teachers
export const apiGetTeachers = async (tenantId?: string): Promise<Teacher[]> => getTenantData('teachers', tenantId) || [];
export const updateTeachers = async (updater: (current: Teacher[]) => Teacher[], tenantId?: string) => updateTenantData('teachers', updater, tenantId);
export const apiSaveTeachers = async (teachers: Teacher[], tenantId?: string) => saveTenantData('teachers', teachers, tenantId);

// Subjects
export const apiGetSubjects = async (tenantId?: string): Promise<Subject[]> => getTenantData('subjects', tenantId) || [];
export const apiSaveSubjects = async (subjects: Subject[], tenantId?: string) => saveTenantData('subjects', subjects, tenantId);


// Scores
export const apiGetScores = async (tenantId?: string): Promise<Score[]> => getTenantData('scores', tenantId) || [];
export const updateScores = async (updater: (current: Score[]) => Score[], tenantId?: string) => updateTenantData('scores', updater, tenantId);
export const apiSaveScores = async (scores: Score[], tenantId?: string) => saveTenantData('scores', scores, tenantId);


// Settings
export const apiGetSchoolSettings = async (tenantId?: string): Promise<SchoolSettings> => getTenantData('settings', tenantId);
export const updateSchoolSettings = async (updater: (current: SchoolSettings) => SchoolSettings, tenantId?: string) => updateTenantData('settings', updater, tenantId);
export const apiSaveSchoolSettings = async (settings: SchoolSettings, tenantId?: string) => saveTenantData('settings', settings, tenantId);


// Activity Log
export const apiGetActivities = async (tenantId?: string): Promise<any[]> => (getTenantData('activities', tenantId) || []).slice().reverse();
export const updateActivities = async (updater: (current: any[]) => any[], tenantId?: string) => updateTenantData('activities', updater, tenantId);
export const apiLogActivity = async (activity: { type: string; description: string }, tenantId?: string) => {
    const newActivity = { ...activity, id: `act_${Date.now()}`, timestamp: new Date().toISOString() };
    updateTenantData('activities', (current: any[] = []) => [...current, newActivity].slice(-50), tenantId); // Keep last 50
};


// Attendance
export const apiGetAttendance = async (tenantId?: string): Promise<any[]> => getTenantData('attendance', tenantId) || [];
export const updateAttendance = async (updater: (current: any[]) => any[], tenantId?: string) => updateTenantData('attendance', updater, tenantId);
export const apiSaveAttendance = async (attendance: any[], tenantId?: string) => saveTenantData('attendance', attendance, tenantId);


// Behavioral
export const apiGetBehavioralRecords = async (tenantId?: string): Promise<any[]> => getTenantData('behavioral', tenantId) || [];
export const apiSaveBehavioralRecords = async (records: any[], tenantId?: string) => saveTenantData('behavioral', records, tenantId);

// Bursary
export const apiGetFees = async (tenantId?: string): Promise<any[]> => getTenantData('fees', tenantId) || [];
export const apiSaveFees = async (fees: any[], tenantId?: string) => saveTenantData('fees', fees, tenantId);

export const apiGetScratchCards = async (tenantId?: string): Promise<any[]> => getTenantData('scratch_cards', tenantId) || [];
export const apiSaveScratchCards = async (cards: any[], tenantId?: string) => saveTenantData('scratch_cards', cards, tenantId);
export const apiUseScratchCard = async (pin: string, tenantId?: string): Promise<void> => {
    updateTenantData('scratch_cards', (currentCards: any[] = []) => {
        return currentCards.map(c => c.pin === pin ? { ...c, used: true, usedAt: new Date().toISOString() } : c);
    }, tenantId);
};


// Timetable
export const apiGetTimetableData = async (tenantId?: string): Promise<any> => getTenantData('timetable', tenantId) || {};

// Platform Management
export const apiGetTenants = async (): Promise<Tenant[]> => getPlatformData('tenants') || [];
export const apiSaveTenants = async (tenants: Tenant[]) => savePlatformData('tenants', tenants);
export const apiAddTenant = async (tenant: { id: string; name: string }) => {
    const tenants = await apiGetTenants();
    if (tenants.find(t => t.id === tenant.id)) {
        throw new Error('Tenant with this ID already exists.');
    }
    await apiSaveTenants([...tenants, { ...tenant, planId: null }]);
};
export const apiDeleteTenantData = async (tenant: Tenant) => {
    // In a real app, this would be a server-side operation.
    // Here we simulate it by clearing localStorage for that tenant.
    Object.keys(localStorage)
        .filter(key => key.startsWith(`tenant_${tenant.id}_`))
        .forEach(key => localStorage.removeItem(key));
};

export const apiGetPlatformSettings = async (): Promise<any> => getPlatformData('platform_settings') || {};
export const apiSavePlatformSettings = async (settings: any) => savePlatformData('platform_settings', settings);


// Communications
export const apiGetAnnouncements = async (tenantId?: string): Promise<any[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    return data || [];
};
export const apiSendAnnouncement = async (announcement: any, tenantId?: string) => {
    if (!supabase) throw new Error("Communication service not available.");
    const { error } = await supabase.from('announcements').insert([announcement]);
    if (error) throw error;
};
export const apiSendAlumniEmail = async (recipients: string[], subject: string, body: string) => {
    // This is a mock. A real implementation would call a serverless function.
    console.log("Sending email to:", recipients, "Subject:", subject, "Body:", body);
    if (!supabase) throw new Error("Email service not configured.");
    // Example with Supabase Edge Function
    // await supabase.functions.invoke('send-email', { body: { recipients, subject, body } });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network
};


// KB Articles
export const apiGetKbArticles = async (): Promise<any[]> => (await apiGetPlatformSettings()).kb_articles || [];
export const apiSaveKbArticles = async (articles: any[]) => {
    const settings = await apiGetPlatformSettings();
    await apiSavePlatformSettings({ ...settings, kb_articles: articles });
};

// Public
export const apiGetPublicStudentResult = async (schoolId: string, admissionNo: string): Promise<any> => {
    const allStudents = await apiGetStudents(schoolId);
    const student = allStudents.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());

    if (!student) {
        throw new Error("Admission number not found for this school.");
    }
    
    // Fetch all necessary data for the report card for that tenant
    const [scores, subjects, schoolSettings, attendance, remarks] = await Promise.all([
        apiGetScores(schoolId),
        apiGetSubjects(schoolId),
        apiGetSchoolSettings(schoolId),
        apiGetAttendance(schoolId),
        getTenantData('remarks', schoolId) || []
    ]);
    
    return {
        student,
        students: allStudents, // for class position calculation
        scores,
        subjects,
        schoolSettings,
        attendance,
        remarks
    };
};
