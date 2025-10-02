import { getSubdomain } from '../utils/subdomain';
import { DEMO_TENANT_ID, demoTenants, demoPlatformSettings, demoKbArticles, demoActivities, demoFees, demoScratchCards } from '../utils/demoData';
import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';


// --- Sync Logic ---
const SYNC_QUEUE_KEY = 'sync_queue';
export const syncEventBus = new EventTarget();
let realtimeChannel: RealtimeChannel | null = null;

const getSyncQueue = (): string[] => {
    try {
        const queue = localStorage.getItem(SYNC_QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch {
        return [];
    }
};

const getInitialStatus = (): string => {
    if (!navigator.onLine) return 'offline';
    return getSyncQueue().length > 0 ? 'unsynced' : 'synced';
};

let currentStatus = getInitialStatus();
let isSyncing = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;


const getTenantIdForSync = () => getSubdomain(window.location.hostname);

const updateStatus = (newStatus: string) => {
    if (currentStatus === newStatus) return;
    currentStatus = newStatus;
    syncEventBus.dispatchEvent(new CustomEvent('syncStatusChange', { detail: currentStatus }));
};

const saveSyncQueue = (queue: string[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

const addToSyncQueue = (dataType: string) => {
    const queue = getSyncQueue();
    if (!queue.includes(dataType)) {
        queue.push(dataType);
        saveSyncQueue(queue);
    }
    if (navigator.onLine && currentStatus !== 'syncing') {
        updateStatus('unsynced');
    }
};

const removeFromSyncQueue = (dataType: string) => {
    let queue = getSyncQueue();
    queue = queue.filter(item => item !== dataType);
    saveSyncQueue(queue);
};

export const clearSyncQueue = () => {
    saveSyncQueue([]);
    if (navigator.onLine) {
        updateStatus('synced');
    }
};

export const isSyncNeeded = (): boolean => getSyncQueue().length > 0;

const showGlobalError = (message: string) => {
    window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message } }));
};

export const syncData = async () => {
    if (sessionStorage.getItem('isDemoMode') === 'true' || isSyncing) {
        return; // Don't sync in demo mode or if already syncing
    }

    if (!navigator.onLine) {
        updateStatus('offline');
        return;
    }

    if (!supabase) {
        console.warn("Supabase not initialized, cannot sync.");
        return;
    }

    const tenantId = getTenantIdForSync();
    if (!tenantId) {
        // Not in a tenant context, nothing to sync.
        return;
    }

    const queue = getSyncQueue();
    if (queue.length === 0) {
        if (currentStatus !== 'synced') updateStatus('synced');
        return;
    }

    isSyncing = true;
    updateStatus('syncing');

    try {
        const syncPromises = queue.map(async (dataType) => {
            const dataToSync = getTenantData(dataType, tenantId);
            const payload = dataToSync === null ? {} : dataToSync;
            const backupKey = `tenant_${tenantId}_${dataType}_backup`;

            const { error } = await supabase
                .from('tenant_data')
                .upsert({
                    tenant_id: tenantId,
                    data_type: dataType,
                    data: payload,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id, data_type' });

            if (error) {
                console.error(`Failed to sync ${dataType}:`, error);
                
                const backupData = getFromStorage(backupKey);
                if (backupData !== null) {
                    saveToStorage(`tenant_${tenantId}_${dataType}`, backupData);
                    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: dataType } }));
                }
                showGlobalError(`Failed to save ${dataType.replace(/_/g, ' ')}. Your changes have been reverted.`);
                
                removeFromSyncQueue(dataType);
                localStorage.removeItem(backupKey);

                return dataType; // Indicate failure
            } else {
                removeFromSyncQueue(dataType);
                localStorage.removeItem(backupKey);
                return null; // Indicate success
            }
        });

        await Promise.all(syncPromises);
    } catch (error) {
        console.error("Error during sync process:", error);
    } finally {
        isSyncing = false;
        if (getSyncQueue().length > 0) {
            updateStatus('unsynced');
        } else {
            updateStatus('synced');
        }
    }
};


const triggerSync = () => {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
        syncData();
    }, 2000); // Debounce sync calls by 2 seconds
};

// --- End Sync Logic ---


// --- Atomic Update Logic to Prevent Race Conditions ---
class Mutex {
    private queue: (() => void)[] = [];
    private locked = false;

    lock(): Promise<void> {
        return new Promise(resolve => {
            if (!this.locked) {
                this.locked = true;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    unlock(): void {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) {
                next();
            }
        } else {
            this.locked = false;
        }
    }
}

const dataMutex = new Mutex();
// --- End Atomic Update Logic ---

// --- Two-Way Sync (Pull) Logic ---
const handleRealtimeUpdate = (payload: any) => {
    const { new: newData } = payload;
    if (!newData) return;

    const tenantId = getTenantId();
    if (newData.tenant_id !== tenantId) return;

    const { data_type: dataType, data: remoteData } = newData;
    const localData = getTenantData(dataType);

    // Prevent echo updates by checking if data is identical
    if (JSON.stringify(localData) === JSON.stringify(remoteData)) {
        return;
    }

    console.log(`Remote update for ${dataType}. Applying changes.`);
    saveToStorage(`tenant_${tenantId}_${dataType}`, remoteData);

    // Notify the app that this specific key has changed
    window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: dataType } }));
};

export const initializeSync = async () => {
    const tenantId = getTenantId();
    if (!tenantId || sessionStorage.getItem('isDemoMode') === 'true' || !supabase) {
        return;
    }

    console.log("Performing initial data pull...");
    const { data: remoteData, error } = await supabase
        .from('tenant_data')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error("Failed to pull initial data:", error);
        return;
    }

    if (remoteData) {
        remoteData.forEach(item => {
            saveToStorage(`tenant_${tenantId}_${item.data_type}`, item.data);
            window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: item.data_type } }));
        });
        console.log("Initial data pull complete.");
    }
    
    // Clear any existing channel before creating a new one
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }

    console.log(`Subscribing to changes for tenant: ${tenantId}`);
    realtimeChannel = supabase
        .channel(`tenant-data-${tenantId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tenant_data',
            filter: `tenant_id=eq.${tenantId}`
        }, handleRealtimeUpdate)
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') console.log('Realtime subscription active.');
            if (status === 'CHANNEL_ERROR') console.error('Realtime subscription error:', err);
            if (status === 'TIMED_OUT') console.warn('Realtime subscription timed out.');
        });
};

export const cleanupSync = () => {
    if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
        console.log("Realtime subscription cleaned up.");
    }
};
// --- End Two-Way Sync ---


const getTenantId = (tenantIdOverride?: string): string | null => {
    if (sessionStorage.getItem('isDemoMode') === 'true') {
        return DEMO_TENANT_ID;
    }
    return tenantIdOverride || getSubdomain(window.location.hostname);
};

const getFromStorage = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error getting ${key} from storage`, error);
        return null;
    }
};

const saveToStorage = (key: string, data: any): boolean => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error saving ${key} to storage`, error);
        return false;
    }
};

// --- Tenant-Specific Data Functions ---

export const getTenantData = (key: string, tenantIdOverride?: string) => {
    const tenantId = getTenantId(tenantIdOverride);
    if (!tenantId) {
        console.warn(`Cannot get ${key}: No tenant ID found.`);
        return null;
    }
    return getFromStorage(`tenant_${tenantId}_${key}`);
};

const saveTenantData = (key: string, data: any, tenantIdOverride?: string) => {
    const tenantId = getTenantId(tenantIdOverride);
    if (!tenantId) {
        console.warn(`Cannot save ${key}: No tenant ID found.`);
        return;
    }
    const success = saveToStorage(`tenant_${tenantId}_${key}`, data);

    if (success) {
        addToSyncQueue(key);
        triggerSync();
    }
};

// New atomic update function
export const updateTenantData = async (key: string, updateFn: (currentData: any) => any, tenantIdOverride?: string) => {
    await dataMutex.lock();
    try {
        const tenantId = getTenantId(tenantIdOverride);
        if (!tenantId) {
            console.warn(`Cannot update ${key}: No tenant ID found.`);
            return;
        }
        const defaultState = (key === 'settings' || key === 'timetable') ? {} : [];
        const currentData = getTenantData(key, tenantId) || defaultState;
        
        const backupKey = `tenant_${tenantId}_${key}_backup`;
        if (getFromStorage(backupKey) === null) {
            saveToStorage(backupKey, currentData);
        }
        
        const newData = updateFn(currentData);
        saveTenantData(key, newData, tenantId);
    } finally {
        dataMutex.unlock();
    }
};


// --- API Functions ---

export const apiGetStudents = async (tenantId?: string) => getTenantData('students', tenantId) || [];
export const updateStudents = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('students', updateFn, tenantId);
export const apiSaveStudents = async (students: any[], tenantId?: string) => updateStudents(() => students, tenantId);

export const apiGetStudentsForClasses = async (classes: string[], tenantId?: string) => {
    const students = await apiGetStudents(tenantId);
    return students.filter(student => classes.includes(student.class));
};

export const apiGetSubjects = async (tenantId?: string) => getTenantData('subjects', tenantId) || [];
export const updateSubjects = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('subjects', updateFn, tenantId);
export const apiSaveSubjects = async (subjects: any[], tenantId?: string) => updateSubjects(() => subjects, tenantId);

export const apiGetScores = async (tenantId?: string) => getTenantData('scores', tenantId) || [];
export const updateScores = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('scores', updateFn, tenantId);
export const apiSaveScores = async (scores: any[], tenantId?: string) => updateScores(() => scores, tenantId);

export const apiGetSchoolSettings = async (tenantId?: string) => getTenantData('settings', tenantId) || {};
export const updateSchoolSettings = async (updateFn: (data: object) => object, tenantId?: string) => updateTenantData('settings', updateFn, tenantId);
export const apiSaveSchoolSettings = async (settings: any, tenantId?: string) => updateSchoolSettings(() => settings, tenantId);

export const apiGetTeachers = async (tenantId?: string) => getTenantData('teachers', tenantId) || [];
export const updateTeachers = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('teachers', updateFn, tenantId);
export const apiSaveTeachers = async (teachers: any[], tenantId?: string) => updateTeachers(() => teachers, tenantId);

export const apiGetAttendance = async (tenantId?: string) => getTenantData('attendance', tenantId) || [];
export const updateAttendance = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('attendance', updateFn, tenantId);
export const apiSaveAttendance = async (attendance: any[], tenantId?: string) => updateAttendance(() => attendance, tenantId);

export const apiGetBehavioralRecords = async (tenantId?: string) => getTenantData('behavioral', tenantId) || [];
export const updateBehavioralRecords = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('behavioral', updateFn, tenantId);
export const apiSaveBehavioralRecords = async (records: any[], tenantId?: string) => updateBehavioralRecords(() => records, tenantId);

export const apiGetTimetableData = async (tenantId?: string) => getTenantData('timetable', tenantId) || {};
export const updateTimetableData = async (updateFn: (data: object) => object, tenantId?: string) => updateTenantData('timetable', updateFn, tenantId);
export const apiSaveTimetableData = async (timetable: any, tenantId?: string) => updateTimetableData(() => timetable, tenantId);

// --- Bursary Specific Functions ---
export const apiGetFees = async (tenantId?: string) => getTenantData('fees', tenantId) || [];
export const apiSaveFees = async (fees: any[], tenantId?: string) => updateTenantData('fees', () => fees, tenantId);
export const apiGetScratchCards = async (tenantId?: string) => getTenantData('scratch_cards', tenantId) || [];
export const apiSaveScratchCards = async (cards: any[], tenantId?: string) => updateTenantData('scratch_cards', () => cards, tenantId);

export const apiUseScratchCard = async (pin: string, tenantId: string) => {
    await updateTenantData('scratch_cards', (allCards: any[]) => {
        return allCards.map(c => c.pin === pin ? { ...c, used: true } : c);
    }, tenantId);
};


export const apiGetActivities = async (tenantId?: string) => getTenantData('activities', tenantId) || [];
export const updateActivities = async (updateFn: (data: any[]) => any[], tenantId?: string) => updateTenantData('activities', updateFn, tenantId);

export const apiLogActivity = async (activity: { type: string; description: string }, tenantId?: string) => {
    const newActivity = {
        id: `act_${Date.now()}`,
        ...activity,
        timestamp: new Date().toISOString()
    };
    await updateActivities(activities => {
        // Keep a rolling log of the last 20 activities
        return [newActivity, ...activities].slice(0, 20);
    }, tenantId);
};

// --- Real-time Communications ---
export const apiGetAnnouncements = async () => {
    if (!supabase) return [];
    const tenantId = getTenantId();
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
    return data;
};

export const apiSendAnnouncement = async (announcement) => {
    if (!supabase) throw new Error("Database service not available.");
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Could not determine school portal.");

    // 1. Save the announcement to the database for in-portal viewing.
    const { data, error } = await supabase
        .from('announcements')
        .insert([{ ...announcement, tenant_id: tenantId }])
        .select();
    
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to save announcement.");

    // 2. If email method is selected, invoke the Supabase Edge Function.
    if (announcement.methods.email) {
        try {
            const { error: funcError } = await supabase.functions.invoke('send-announcement-email', {
                body: { 
                    announcementId: data[0].id,
                    tenantId: tenantId,
                    recipients: announcement.recipients 
                },
            });
            if (funcError) throw funcError;
        } catch (emailError) {
            // Log the error but don't throw, so the in-portal message is still considered "sent".
            console.error("In-portal announcement saved, but failed to trigger email function:", emailError);
        }
    }
};


// --- Platform-Wide Data Functions (Not Tenant-Specific) ---

export const apiGetTenants = async () => {
    return getFromStorage('platform_tenants') || demoTenants;
};

export const apiSaveTenants = async (tenants: any[]) => {
    saveToStorage('platform_tenants', tenants);
};

export const apiAddTenant = async (tenant: { id: string, name: string }) => {
    const tenants = await apiGetTenants();
    if (tenants.some(t => t.id === tenant.id)) {
        throw new Error('Tenant ID already exists.');
    }
    const newTenants = [...tenants, tenant];
    await apiSaveTenants(newTenants);
};

export const apiDeleteTenantData = async (tenant: { id: string }) => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`tenant_${tenant.id}_`)) {
            localStorage.removeItem(key);
        }
    });
};

export const apiGetPlatformSettings = async () => {
    return getFromStorage('platform_settings') || demoPlatformSettings;
};

export const apiSavePlatformSettings = async (settings: any) => {
    saveToStorage('platform_settings', settings);
};

export const apiGetKbArticles = async () => {
    return getFromStorage('kb_articles') || demoKbArticles;
};

export const apiSaveKbArticles = async (articles: any[]) => {
    saveToStorage('kb_articles', articles);
};


// --- Public Functions ---
export const apiGetPublicStudentResult = async (schoolId: string, admissionNo: string) => {
    if (!schoolId || !admissionNo) throw new Error("School ID and Admission Number are required.");

    const tenants = await apiGetTenants();
    const schoolExists = tenants.some(t => t.id === schoolId);
    if (!schoolExists) throw new Error("School portal not found.");

    const allStudents = await apiGetStudents(schoolId);
    const student = allStudents.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());

    if (!student) throw new Error("Student with that admission number not found in this school.");

    // Fetch all data for that school to build the report card
    // FIX: Added attendance and remarks to the data fetching for public results.
    const [scores, subjects, schoolSettings, students, attendance, remarks] = await Promise.all([
        apiGetScores(schoolId),
        apiGetSubjects(schoolId),
        apiGetSchoolSettings(schoolId),
        apiGetStudents(schoolId),
        apiGetAttendance(schoolId),
        getTenantData('remarks', schoolId) || [],
    ]);

    return {
        student,
        scores,
        subjects,
        schoolSettings,
        students,
        attendance,
        remarks,
    };
};

// --- Init Sync System ---
window.addEventListener('online', syncData);
window.addEventListener('offline', () => updateStatus('offline'));
setTimeout(syncData, 1000);