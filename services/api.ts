import { getSubdomain } from '../utils/subdomain';
import { demoTenants, demoSchoolSettings, demoStudents, demoSubjects, demoScores, demoAttendance, demoBehavioralRecords, demoActivities, demoFees, demoScratchCards, demoPlatformSettings, demoKbArticles, demoTeachers } from '../utils/demoData';
import { Student } from '../types';

// --- Sync Mechanism ---
export const syncEventBus = new EventTarget();
let syncQueue: { tenantId: string, key: string, data: any }[] = [];
let isSyncing = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

const dispatchSyncStatus = () => {
    let status = 'synced';
    if (!navigator.onLine) status = 'offline';
    else if (isSyncing) status = 'syncing';
    else if (syncQueue.length > 0) status = 'unsynced';
    syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: status }));
};

const processSyncQueue = async () => {
    if (isSyncing || syncQueue.length === 0 || !navigator.onLine) {
        dispatchSyncStatus();
        return;
    }
    isSyncing = true;
    dispatchSyncStatus();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would send the queue to a server.
    // For this mock, we just clear it.
    syncQueue = [];
    isSyncing = false;
    dispatchSyncStatus();
    
    // Dispatch a global event to notify components that data has been "synced"
    // and they might need to re-fetch or update.
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { synced: true } }));
};

export const initializeSync = () => {
    if (!syncInterval) {
        syncInterval = setInterval(processSyncQueue, 10000); // Try to sync every 10 seconds
    }
    window.addEventListener('online', processSyncQueue);
};

export const cleanupSync = () => {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    window.removeEventListener('online', processSyncQueue);
};

export const isSyncNeeded = () => syncQueue.length > 0;
export const clearSyncQueue = () => { syncQueue = []; };


// --- Tenancy & Data Access ---
const getActiveTenantId = (): string => {
    const subdomain = getSubdomain(window.location.hostname);
    return subdomain || 'default_tenant'; // Fallback for root domain
};

const getLocalStorageKey = (key: string, tenantId?: string) => {
    const activeTenantId = tenantId || getActiveTenantId();
    return `tenant_${activeTenantId}_${key}`;
};

const getPlatformStorageKey = (key: string) => `platform_${key}`;

const isDemoMode = () => getActiveTenantId() === 'demo';

// Universal data getter
export const getTenantData = (key: string, tenantId?: string) => {
    const lsKey = getLocalStorageKey(key, tenantId);
    const item = localStorage.getItem(lsKey);
    return item ? JSON.parse(item) : null;
};

// Universal data setter
export const updateTenantData = (key: string, updater: (currentData: any) => any, tenantId?: string) => {
    return new Promise<void>(resolve => {
        const activeTenantId = tenantId || getActiveTenantId();
        const lsKey = getLocalStorageKey(key, activeTenantId);
        const currentData = getTenantData(key, activeTenantId);
        const newData = updater(currentData);
        localStorage.setItem(lsKey, JSON.stringify(newData));

        // Add to sync queue
        syncQueue.push({ tenantId: activeTenantId, key, data: newData });
        dispatchSyncStatus();
        
        // Notify other components of the change
        window.dispatchEvent(new CustomEvent('storage-update', { detail: { key } }));
        resolve();
    });
};


// --- API Functions ---

// Platform-level data (not tenant-specific)
export const apiGetPlatformSettings = async () => {
    if (isDemoMode()) return { ...demoPlatformSettings, plans: [] }; // Plans are separate
    const data = localStorage.getItem(getPlatformStorageKey('settings'));
    return data ? JSON.parse(data) : { ...demoPlatformSettings, plans: [] };
};
export const apiSavePlatformSettings = async (settings) => {
    localStorage.setItem(getPlatformStorageKey('settings'), JSON.stringify(settings));
};

export const apiGetKbArticles = async () => {
    if (isDemoMode()) return demoKbArticles;
    const data = localStorage.getItem(getPlatformStorageKey('kb_articles'));
    return data ? JSON.parse(data) : [];
};
export const apiSaveKbArticles = async (articles) => {
    localStorage.setItem(getPlatformStorageKey('kb_articles'), JSON.stringify(articles));
};


// Tenant-level data
export const apiGetSchoolSettings = async (tenantId?: string) => {
    if (isDemoMode()) return demoSchoolSettings;
    return getTenantData('settings', tenantId) || demoSchoolSettings;
};
export const updateSchoolSettings = (updater: (currentData: any) => any) => updateTenantData('settings', updater);
export const apiSaveSchoolSettings = (data, tenantId?: string) => updateTenantData('settings', () => data, tenantId);

export const apiGetStudents = async (tenantId?: string): Promise<Student[]> => {
    if (isDemoMode()) return demoStudents;
    return getTenantData('students', tenantId) || [];
};
export const apiSaveStudents = async (students: Student[], tenantId?: string) => {
    await updateTenantData('students', () => students, tenantId);
};
export const updateStudents = (updater) => updateTenantData('students', updater);

export const apiGetStudentsForClasses = async (classes: string[], tenantId?: string): Promise<Student[]> => {
    const allStudents = await apiGetStudents(tenantId);
    return allStudents.filter(student => classes.includes(student.class));
};

export const apiGetSubjects = async (tenantId?: string) => {
    if (isDemoMode()) return demoSubjects;
    return getTenantData('subjects', tenantId) || [];
};
// Fix: Added optional tenantId parameter to align with other save functions.
export const apiSaveSubjects = (subjects, tenantId?: string) => updateTenantData('subjects', () => subjects, tenantId);

export const apiGetScores = async (tenantId?: string) => {
    if (isDemoMode()) return demoScores;
    return getTenantData('scores', tenantId) || [];
};
export const updateScores = (updater) => updateTenantData('scores', updater);
export const apiSaveScores = (data, tenantId?: string) => updateTenantData('scores', () => data, tenantId);

export const apiGetTeachers = async (tenantId?: string) => {
    if (isDemoMode()) return demoTeachers;
    return getTenantData('teachers', tenantId) || [];
};
export const updateTeachers = (updater) => updateTenantData('teachers', updater);
// Fix: Added missing apiSaveTeachers function for consistency.
export const apiSaveTeachers = (data, tenantId?: string) => updateTenantData('teachers', () => data, tenantId);


export const apiGetAttendance = async (tenantId?: string) => {
    if (isDemoMode()) return demoAttendance;
    return getTenantData('attendance', tenantId) || [];
};
export const apiSaveAttendance = (data, tenantId?: string) => updateTenantData('attendance', () => data, tenantId);
export const updateAttendance = (updater) => updateTenantData('attendance', updater);


export const apiGetBehavioralRecords = async (tenantId?: string) => {
    if (isDemoMode()) return demoBehavioralRecords;
    return getTenantData('behavioral', tenantId) || [];
};
export const apiSaveBehavioralRecords = (data, tenantId?: string) => updateTenantData('behavioral', () => data, tenantId);


export const apiGetActivities = async (tenantId?: string) => {
    if (isDemoMode()) return demoActivities;
    const activities = getTenantData('activities', tenantId) || [];
    return activities.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0,5);
};
export const updateActivities = (updater, tenantId?: string) => updateTenantData('activities', updater, tenantId);
export const apiLogActivity = async (activity) => {
    await updateActivities(currentActivities => {
        const newActivity = { ...activity, id: `act_${Date.now()}`, timestamp: new Date().toISOString() };
        return [newActivity, ...(currentActivities || [])];
    });
};

export const apiGetFees = async (tenantId?: string) => {
    if(isDemoMode()) return demoFees;
    return getTenantData('fees', tenantId) || [];
};
// Fix: Added optional tenantId parameter to align with other save functions.
export const apiSaveFees = (data, tenantId?: string) => updateTenantData('fees', () => data, tenantId);

export const apiGetScratchCards = async (tenantId?: string) => {
    if(isDemoMode()) return demoScratchCards;
    return getTenantData('scratch_cards', tenantId) || [];
};
// Fix: Added optional tenantId parameter to align with other save functions.
export const apiSaveScratchCards = (data, tenantId?: string) => updateTenantData('scratch_cards', () => data, tenantId);

export const apiGetTimetableData = async (tenantId?: string) => {
    if (isDemoMode()) return {};
    return getTenantData('timetable', tenantId) || {};
}


// --- Super Admin Functions ---
export const apiGetTenants = async () => {
    const data = localStorage.getItem(getPlatformStorageKey('tenants'));
    return data ? JSON.parse(data) : demoTenants;
};
export const apiSaveTenants = async (tenants) => {
    localStorage.setItem(getPlatformStorageKey('tenants'), JSON.stringify(tenants));
};
export const apiAddTenant = async (tenant: { id: string, name: string }) => {
    const tenants = await apiGetTenants();
    if (tenants.some(t => t.id === tenant.id)) {
        throw new Error("A tenant with this ID already exists.");
    }
    // Add new tenants with a null planId by default
    await apiSaveTenants([...tenants, { ...tenant, planId: null }]);
};


export const apiDeleteTenantData = async (tenant) => {
    // In a real app, this would be a server-side operation.
    // Here we clear localStorage for that tenant.
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`tenant_${tenant.id}_`)) {
            localStorage.removeItem(key);
        }
    });
};

// --- Public / Cross-Tenant Functions ---
export const apiGetPublicStudentResult = async (tenantId: string, admissionNo: string) => {
    const [students, scores, subjects, schoolSettings, attendance, remarks] = await Promise.all([
        apiGetStudents(tenantId),
        apiGetScores(tenantId),
        apiGetSubjects(tenantId),
        apiGetSchoolSettings(tenantId),
        apiGetAttendance(tenantId),
        getTenantData('remarks', tenantId) || [],
    ]);
    const student = students.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());
    if (!student) throw new Error("Admission number not found for this school.");

    return { student, students, scores, subjects, schoolSettings, attendance, remarks };
};

export const apiUseScratchCard = async (pin: string, tenantId: string) => {
    await updateTenantData('scratch_cards', (cards: any[]) => {
        return (cards || []).map(card => card.pin === pin ? { ...card, used: true } : card);
    }, tenantId);
};

// --- Communications ---
export const apiGetAnnouncements = async (tenantId?: string) => {
    // In a real app, this would fetch from a database table.
    // We'll mock it with Supabase SDK if available, or localStorage.
    if (isDemoMode()) return [];
    if(window.supabase) {
        const { data } = await window.supabase.from('announcements').select('*').order('created_at', { ascending: false });
        return data || [];
    }
    return getTenantData('announcements', tenantId) || [];
};

export const apiSendAnnouncement = async (announcement) => {
    // Mock sending. In a real app, this would save to a DB and trigger emails.
    if(window.supabase) {
        const { error } = await window.supabase.from('announcements').insert([announcement]);
        if (error) throw error;
    } else {
        await updateTenantData('announcements', (announcements: any[] = []) => {
            return [{ ...announcement, id: `ann_${Date.now()}`, created_at: new Date().toISOString() }, ...announcements];
        });
    }
};

export const apiSendAlumniEmail = async (recipients: string[], subject: string, body: string) => {
    // This is a mock. A real implementation would use an email service.
    console.log("Mock sending email to alumni:", { recipients, subject, body });
    if (recipients.length === 0) throw new Error("No recipients provided.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate success
};