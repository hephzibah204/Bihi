// services/api.ts
import { supabase } from './supabaseClient';
import { DEMO_TENANT_ID, CORE_DEMO_DATA } from '../utils/demoData';
import { withRetry } from '../utils/retry';
import { parseSupabaseError, DatabaseError, NotFoundError } from '../utils/errors';
import { 
  validateInput, 
  studentSchema, 
  teacherSchema, 
  parentSchema, 
  messageSchema, 
  communicationSchema,
  paginationSchema,
  sanitizeHtml 
} from '../utils/validation';
import { rateLimiters, createRateLimitMiddleware, fetchWithRateLimit, ClientRateLimiter } from '../utils/rateLimiter';
// Import organized types
import type {
  Student, Teacher, Parent, PlatformUser, UserRole,
  Subject, Score, Remark, BehavioralLogEntry, AttendanceRecord, Assignment, AssignmentScore, SharedLessonPlan, AbsenceReport,
  Invoice, Payment, Expense, Income, FeeStructure, Payslip, PayrollRun,
  SchoolSettings,
  Tenant, Plan, ActivityLog,
  CommunicationLog, MessageTemplate, ScheduledReminder, ScheduledCampaign, Conversation, Message,
  Page, Event
} from '../types';
import { USER_ROLES } from '../utils/constants';
import { DEFAULT_LANDING_PAGE_CONTENT, DEFAULT_MENU_ITEMS } from '../utils/landingPageContent';
import { getSubdomain } from '../utils/subdomain';
import { logger } from '../utils/logger';

// --- New Fallback Logic Implementation ---

type PlatformSettings = Record<string, any>;

const CLOUDFLARE_URL = "/api/platform-settings";

// Get fallback URL from environment variables
const getSupabaseFallbackUrl = () => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.process?.env?.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL
    : process.env.VITE_SUPABASE_URL;
    
  if (!baseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is not configured');
  }
  
  return `${baseUrl}/functions/v1/platform-settings`;
};

/**
 * Fetch with a timeout wrapper.
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Fetch with exponential backoff and jitter for resilience.
 */
async function fetchWithExponentialBackoff<T>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  initialDelay = 1000,
  timeoutPerRequest = 5000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Use the existing fetchWithTimeout for each attempt.
      return await fetchWithTimeout<T>(url, options, timeoutPerRequest);
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        logger.error('All attempts failed for URL', { url, error });
        throw error; // Rethrow the last error after all retries fail.
      }
      
      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = delay * 0.5 * Math.random(); // Jitter is up to 50% of the delay
      const backoffTime = delay + jitter;
      
      logger.warn('Fetch attempt failed, retrying', { attempt, url, error: (error as any)?.message, backoffMs: Math.round(backoffTime) });
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  // This part should not be reachable, but is a safeguard.
  throw new Error("Exhausted all retries.");
}


// --- Tenant & Auth ---
export const getTenantId = (): string | null => {
    return getSubdomain();
};

// --- Data Access Layer ---
const isDemo = () => {
    const tenantId = getTenantId();
    const flag = typeof window !== 'undefined' && (
        sessionStorage.getItem('isDemoMode') === 'true' ||
        localStorage.getItem('isDemoMode') === 'true'
    );
    return tenantId === DEMO_TENANT_ID || flag;
};

const get = async <T>(table: string, options: { filter?: string, select?: string } = {}): Promise<T[]> => {
    if (isDemo()) {
        return (CORE_DEMO_DATA[table] || []) as any;
    }
    if (!supabase) return [];
    
    return withRetry(async () => {
        let query = supabase.from(table).select(options.select || '*');
        if (options.filter) {
            // This is a simplification; a real app might need more complex filtering
            const [field, value] = options.filter.split('=');
            query = query.eq(field, value);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
    });
};

const upsert = async (table: string, record: any) => {
    if (isDemo()) return record;
    if (!supabase) return null;
    
    return withRetry(async () => {
        const { data, error } = await supabase.from(table).upsert(record).select();
        if (error) throw error;
        return data[0];
    });
};

const batchUpsert = async (table: string, records: any[]) => {
    if (isDemo()) return records;
    if (!supabase) return null;
    
    return withRetry(async () => {
        const { data, error } = await supabase.from(table).upsert(records).select();
        if (error) throw error;
        return data;
    });
}

const del = async (table: string, id: string) => {
    if (isDemo()) return { id };
    if (!supabase) return null;
    
    return withRetry(async () => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return { id };
    });
};

// --- Storage (Uploads) ---
export const apiUploadSchoolLogo = async (file: File): Promise<string> => {
    // In demo mode, persist the image as a data URL within settings
    if (isDemo()) {
        const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        return dataUrl;
    }
    if (!supabase) throw new Error('Storage client not available');
    const tenant_id = getTenantId() || 'default';
    const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const path = `logos/${tenant_id}/${Date.now()}_${cleanName}`;
    const { data, error } = await supabase.storage.from('school-assets').upload(path, file, {
        upsert: true,
        cacheControl: '3600'
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('school-assets').getPublicUrl(data.path);
    if (!pub?.publicUrl) throw new Error('Failed to generate public URL for logo');
    return pub.publicUrl;
};

// --- Students ---
export const apiGetStudents = async (options: { classFilter?: string, studentIds?: string[], limit?: number, offset?: number } = {}): Promise<Student[]> => {
    if (isDemo()) {
        let students = CORE_DEMO_DATA.students;
        if (options.classFilter) {
            students = students.filter(s => s.class === options.classFilter);
        }
        if (options.studentIds) {
            const idSet = new Set(options.studentIds);
            students = students.filter(s => idSet.has(s.id));
        }
        const limit = options.limit ?? undefined;
        const offset = options.offset ?? 0;
        if (limit !== undefined) {
            students = students.slice(offset, offset + limit);
        }
        return students;
    }
    if (!supabase) return [];
    return withRetry(async () => {
        let query = supabase.from('students').select('*');
        if (options.classFilter) query = query.eq('class', options.classFilter);
        if (options.studentIds) query = query.in('id', options.studentIds);
        const limit = options.limit ?? undefined;
        const offset = options.offset ?? 0;
        if (limit !== undefined) {
            query = query.range(offset, offset + limit - 1);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
};

export const apiUpsertStudent = (student: Partial<Student>) => {
    // Validate and sanitize input
    const validatedStudent = validateInput(studentSchema.partial(), student);
    
    const actionType = validatedStudent.id ? 'STUDENT_UPDATE' : 'STUDENT_ADD';
    const description = validatedStudent.id ? `Updated details for ${validatedStudent.firstName} ${validatedStudent.lastName}` : `Added new student ${validatedStudent.firstName} ${validatedStudent.lastName}`;
    apiLogActivity(actionType, description);
    return upsert('students', validatedStudent);
};
export const apiDeleteStudent = (studentId: string) => {
    apiLogActivity('STUDENT_DELETE', `Deleted student with ID ${studentId}`);
    return del('students', studentId);
};
export const apiBatchUpdateStudents = (students: Partial<Student>[]) => {
     apiLogActivity('STUDENT_BATCH_UPDATE', `Batch updated ${students.length} students.`);
    return batchUpsert('students', students);
};
export const apiGetPublicStudentResult = async (schoolId: string, admissionNo: string) => {
    // This is a special case that needs to operate outside the tenant context
    if (!supabase) throw new Error("Database client not available.");
    
    // Simulate fetching across tenants in demo
    if (schoolId === DEMO_TENANT_ID) {
        const student = CORE_DEMO_DATA.students.find(s => s.admissionNo.toLowerCase() === admissionNo.toLowerCase());
        if (!student) throw new Error("Student not found.");
        return {
            student,
            students: CORE_DEMO_DATA.students,
            scores: CORE_DEMO_DATA.scores,
            subjects: CORE_DEMO_DATA.subjects,
            schoolSettings: CORE_DEMO_DATA.settings,
            remarks: CORE_DEMO_DATA.remarks,
            attendance: CORE_DEMO_DATA.attendance
        };
    }

    const { data, error } = await supabase.rpc('get_public_result_data', {
        p_tenant_id: schoolId,
        p_admission_no: admissionNo
    });

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Result data not found for the provided details.");

    return data;
};

// --- Parents ---
export const apiGetParents = async (options: { limit?: number, offset?: number } = {}): Promise<Parent[]> => {
    if (isDemo()) {
        let parents = CORE_DEMO_DATA.parents || [];
        const limit = options.limit ?? undefined;
        const offset = options.offset ?? 0;
        if (limit !== undefined) parents = parents.slice(offset, offset + limit);
        return parents;
    }
    if (!supabase) return [];
    return withRetry(async () => {
        let query = supabase.from('parents').select('*');
        const limit = options.limit ?? undefined;
        const offset = options.offset ?? 0;
        if (limit !== undefined) query = query.range(offset, offset + limit - 1);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
};
export const apiUpsertParent = (parent: Partial<Parent>) => {
    // Validate and sanitize input
    const validatedParent = validateInput(parentSchema.partial(), parent);
    return upsert('parents', validatedParent);
};
export const apiDeleteParent = (parentId: string) => del('parents', parentId);
export const apiInviteParent = async (studentId: string) => {
    if (isDemo()) {
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Invitation sent (simulated).' } }));
        return { message: 'Invitation sent (simulated).' };
    }
    if (!supabase) throw new Error("Auth client not available.");
    const { data: { session } } = await supabase.auth.getSession();
    const result = await fetchWithExponentialBackoff<any>('/api/invite-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ studentId })
    });
    window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: result.message } }));
    return result;
};
export const apiSubmitParentUpdate = (parentId, changes) => apiUpsertParent({ id: parentId, pendingChanges: changes });
export const apiApproveParentUpdate = async (parentId) => {
    const parents = await apiGetParents();
    const parent = parents.find(p => p.id === parentId);
    if (!parent || !parent.pendingChanges) return;
    await apiUpsertParent({ ...parent, ...parent.pendingChanges, pendingChanges: null });
};
export const apiRejectParentUpdate = (parentId) => apiUpsertParent({ id: parentId, pendingChanges: null });

// --- Teachers ---
export const apiGetTeachers = async (options: { limit?: number, offset?: number } = {}): Promise<Teacher[]> => {
    if (isDemo()) {
        let teachers = CORE_DEMO_DATA.teachers || [];
        const limit = options.limit ?? undefined;
        const offset = options.offset ?? 0;
        if (limit !== undefined) teachers = teachers.slice(offset, offset + limit);
        return teachers;
    }
    if (!supabase) return [];
    return withRetry(async () => {
        let query = supabase.from('teachers').select('*');
        const limit = options.limit ?? undefined;
        const offset = options.offset ?? 0;
        if (limit !== undefined) query = query.range(offset, offset + limit - 1);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    });
};
export const apiUpsertTeacher = (teacher: Partial<Teacher>) => {
    // Validate and sanitize input
    const validatedTeacher = validateInput(teacherSchema.partial(), teacher);
    
    const actionType = validatedTeacher.id ? 'TEACHER_UPDATE' : 'TEACHER_ADD';
    const description = validatedTeacher.id ? `Updated details for ${validatedTeacher.firstName} ${validatedTeacher.lastName}` : `Added new staff ${validatedTeacher.firstName} ${validatedTeacher.lastName}`;
    apiLogActivity(actionType, description);
    return upsert('teachers', validatedTeacher);
};
export const apiDeleteTeacher = (teacherId: string) => {
    apiLogActivity('TEACHER_DELETE', `Deleted teacher with ID ${teacherId}`);
    return del('teachers', teacherId);
};

// --- Academics ---
export const apiGetSubjects = () => get<Subject>('subjects');
export const apiSaveSubjects = (subjects: Subject[]) => {
    apiLogActivity('SUBJECT_UPDATE', `Updated ${subjects.length} subjects.`);
    return batchUpsert('subjects', subjects);
};
export const apiGetScores = async (options: {studentIds?: string[]} = {}) => {
    if (isDemo()) {
        if (options.studentIds) {
            const idSet = new Set(options.studentIds);
            return CORE_DEMO_DATA.scores.filter(s => idSet.has(s.studentId));
        }
        return CORE_DEMO_DATA.scores;
    }
    
    if (!supabase) return [];
    
    // Fixed: Direct query instead of N+1 pattern
    let query = supabase.from('scores').select('*');
    
    if (options.studentIds && options.studentIds.length > 0) {
        query = query.in('studentId', options.studentIds);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};
export const apiUpsertScore = (score: Partial<Score>) => {
     apiLogActivity('SCORE_UPDATE', `Updated score for student ${score.studentId} in subject ${score.subjectId}`);
    return upsert('scores', score);
};
export const apiBatchUpsertScores = (scores: Partial<Score>[]) => {
    apiLogActivity('SCORE_BATCH_UPDATE', `Batch updated ${scores.length} score records.`);
    return batchUpsert('scores', scores);
};
export const apiGetRemarks = () => get<Remark>('remarks');
export const apiUpsertRemark = (remark: Partial<Remark>) => upsert('remarks', remark);
export const apiGetBehavioralRecords = () => get<BehavioralLogEntry>('behavioral_log');
export const apiUpsertBehavioralRecord = (record: Partial<BehavioralLogEntry>) => upsert('behavioral_log', record);
export const apiDeleteBehavioralRecord = (recordId: string) => del('behavioral_log', recordId);
export const apiGetAttendance = () => get<AttendanceRecord>('attendance');
export const apiSaveAttendance = (record: AttendanceRecord) => upsert('attendance', record);
export const apiGetAssignments = () => get<Assignment>('assignments');
export const apiSaveAssignments = (assignments: Assignment[]) => batchUpsert('assignments', assignments);
export const apiGetAssignmentScores = () => get<AssignmentScore>('assignment_scores');
export const apiSaveAssignmentScores = (scores: AssignmentScore[]) => batchUpsert('assignment_scores', scores);

// --- Financials ---
export const apiGetInvoices = () => get<Invoice>('invoices');
export const apiUpsertInvoice = (invoice: Partial<Invoice>) => {
     apiLogActivity('INVOICE_UPDATE', `Updated invoice ${invoice.id}`);
    return upsert('invoices', invoice);
};
export const apiBatchUpdateInvoices = (invoices: Partial<Invoice>[]) => batchUpsert('invoices', invoices);
export const apiGetPayments = () => get<Payment>('payments');
export const apiUpsertPayment = (payment: Partial<Payment>) => upsert('payments', payment);
export const apiBatchUpsertPayments = (payments: Partial<Payment>[]) => batchUpsert('payments', payments);
export const apiGetFeeStructures = () => get<{data: FeeStructure[]}>('fee_structures').then(data => data[0]?.data || []);
export const apiSaveFeeStructures = (structures: FeeStructure[]) => upsert('fee_structures', { id: 1, data: structures });
export const apiGetExpenses = () => get<Expense>('expenses');
export const apiUpsertExpense = (expense: Partial<Expense>) => upsert('expenses', expense);
export const apiDeleteExpense = (expenseId: string) => del('expenses', expenseId);
export const apiGetIncome = () => get<Income>('income');
export const apiUpsertIncome = (income: Partial<Income>) => upsert('income', income);
export const apiDeleteIncome = (incomeId: string) => del('income', incomeId);
export const apiGetPayrollRuns = () => get<{runs: PayrollRun[]}>('payroll').then(data => data[0]?.runs || []);
export const apiSavePayrollRun = async (runData: Omit<PayrollRun, 'id'>) => {
    const allRuns = await apiGetPayrollRuns();
    const newRun = { ...runData, id: `run_${Date.now()}` };
    return upsert('payroll', { id: 1, runs: [...allRuns, newRun] });
};
export const apiGetScratchCards = (schoolId: string | null = null) => {
    // This function needs to operate outside tenant context for public result viewer
    const effectiveTenantId = schoolId || getTenantId();
    if(effectiveTenantId === DEMO_TENANT_ID) return Promise.resolve([{ pin: '123456789012', used: false }]);
    if (!supabase) return [];
    return supabase.from('scratch_cards').select('cards').eq('tenant_id', effectiveTenantId).single().then(res => {
        if(res.error && res.error.code !== 'PGRST116') throw res.error; // no rows
        return res.data?.cards || [];
    });
};
export const apiSaveScratchCards = (cards: any[]) => batchUpsert('scratch_cards', cards);
export const apiUseScratchCard = async (pin: string, schoolId: string) => {
    if (schoolId === DEMO_TENANT_ID) {
      return { success: true };
    }
    
    const result = await fetchWithExponentialBackoff<any>('/api/use-scratch-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, schoolId })
    });
    return result;
};
export const apiGetPaymentMethods = () => get<{data: any[]}>('payment_methods').then(res => res[0]?.data || []);
export const apiSavePaymentMethods = (methods: any) => upsert('payment_methods', { id: 1, data: methods });

// --- Settings & Config ---
export const apiGetSchoolSettings = (tenant_id = getTenantId()) => {
    // Ensure demo mode uses local demo settings regardless of subdomain
    if (isDemo()) return Promise.resolve(CORE_DEMO_DATA.settings);
    if (!supabase) return Promise.resolve(null);
    return supabase
        .from('settings')
        .select('*')
        .eq('tenant_id', tenant_id)
        .single()
        .then(res => {
            if (res.error && res.error.code !== 'PGRST116') throw res.error; // PGRST116 = no rows found
            return res.data;
        });
};
export const apiSaveSchoolSettings = (settings: Partial<SchoolSettings>, tenant_id = getTenantId()) => {
    window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Settings saved successfully!' } }));
    return upsert('settings', { id: 1, tenant_id, ...settings });
};

// --- Timetable ---
export const apiGetTimetableData = async () => {
    if(isDemo()) return {};
    if(!supabase) return {};
    const { data, error } = await supabase.from('timetable').select('data').single();
    if(error && error.code !== 'PGRST116') throw error;
    return data?.data || {};
};
export const apiSaveTimetableData = (timetable: any) => upsert('timetable', { id: 1, data: timetable });

// --- Communications ---
export const apiSendMessage = async ({ channel, content, recipients, type = 'announcement' }: {
    channel: 'sms' | 'email',
    content: string,
    recipients: string[] | 'all',
    type?: 'announcement' | 'reminder' | 'direct'
}) => {
    // Validate and sanitize communication input
    const validatedComm = validateInput(communicationSchema.partial(), {
        channel,
        content,
        recipients: recipients === 'all' ? ['all'] : recipients,
        type
    });
    
    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeHtml(validatedComm.content);
    
    if (isDemo()) {
        await apiUpsertCommunicationLog({ type, channel, content: sanitizedContent, recipients, sentAt: new Date().toISOString() });
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `Message sent to recipients.` } }));
        return { success: true };
    }

    const { data: { session } } = await supabase.auth.getSession();

    const rateLimiter = ClientRateLimiter.getInstance();
    if (!rateLimiter.canMakeRequest('/api/send-communication', 'POST', 20)) {
        const waitTime = rateLimiter.waitTime('/api/send-communication', 'POST');
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const result = await fetchWithExponentialBackoff<any>('/api/send-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ channel, content: sanitizedContent, recipients, type })
    });
    return result;
};

export const apiSendAlumniEmail = async (recipients: string[], subject: string, body: string) => {
    return apiSendMessage({
        channel: 'email',
        content: `Subject: ${subject}\n\n${body}`,
        recipients,
        type: 'direct'
    });
};

export const apiGetCommunicationLogs = () => get<CommunicationLog>('communication_logs');
export const apiUpsertCommunicationLog = (log: Partial<CommunicationLog>) => upsert('communication_logs', log);
export const apiGetMessageTemplates = async (): Promise<MessageTemplate[]> => {
    if (isDemo()) {
        // Provide sensible defaults in demo
        return [
            { id: 'tmpl_fee_overdue_sms', name: 'Overdue Fees Reminder (SMS)', type: 'sms', content: 'Dear Parent, your ward has an outstanding school fee of ₦{{outstanding}} for {{term}} {{session}}. Please pay by {{due_date}}. Thank you.' } as any,
            { id: 'tmpl_fee_partial_sms', name: 'Partial Payment Reminder (SMS)', type: 'sms', content: 'Dear Parent, a partial payment was made. Balance outstanding: ₦{{balance}}. Kindly settle by {{due_date}}.' } as any,
            { id: 'tmpl_attendance_absent_sms', name: 'Attendance Alert (Absent) (SMS)', type: 'sms', content: 'Dear Parent, {{student_name}} was marked absent today ({{date}}). Please contact the school if this is unexpected.' } as any,
            { id: 'tmpl_performance_update_email', name: 'Performance Update (Email)', type: 'email', subject: 'Performance Update for {{student_name}}', content: 'Dear Parent/Guardian,\n\nHere is a brief performance update for {{student_name}} for {{term}} {{session}}. Average score: {{average}}%. Kindly encourage consistent study habits.\n\nRegards,\n{{school_name}}' } as any,
        ];
    }
    return get<MessageTemplate>('message_templates');
};
export const apiUpsertMessageTemplate = (template: Partial<MessageTemplate>) => upsert('message_templates', template);
export const apiDeleteMessageTemplate = (templateId: string) => del('message_templates', templateId);
export const apiGetScheduledReminders = () => get<ScheduledReminder>('scheduled_reminders');
export const apiUpsertScheduledReminder = (reminder: Partial<ScheduledReminder>) => upsert('scheduled_reminders', reminder);
export const apiDeleteScheduledReminder = (reminderId: string) => del('scheduled_reminders', reminderId);

// Scheduled Campaigns (Newsletters)
export const apiGetScheduledCampaigns = () => get<ScheduledCampaign>('scheduled_campaigns');
export const apiUpsertScheduledCampaign = (campaign: Partial<ScheduledCampaign>) => upsert('scheduled_campaigns', campaign);
export const apiDeleteScheduledCampaign = (campaignId: string) => del('scheduled_campaigns', campaignId);

export const apiGetConversationSummaries = async (userId: string, userRole: UserRole): Promise<Conversation[]> => {
    if (isDemo()) return [];
    if (!supabase) return [];

    const tenant_id = getTenantId();
    if (!tenant_id) return [];

    const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select('*')
        .eq('tenant_id', tenant_id)
        .contains('participants', [userId]);

    if (convoError) throw convoError;
    if (!convos) return [];

    const [teachers, parents] = await Promise.all([apiGetTeachers(), apiGetParents()]);
    const userMap = new Map<string, { name: string, role: UserRole }>();
    teachers.forEach(t => userMap.set(t.id, { name: t.name, role: t.role }));
    parents.forEach(p => userMap.set(p.id, { name: p.name, role: USER_ROLES.PARENT as UserRole }));

    const summaries: Conversation[] = convos.map(convo => {
        const otherParticipantId = convo.participants.find((pId: string) => pId !== userId);
        const otherParticipant = otherParticipantId ? userMap.get(otherParticipantId) : null;

        if (!otherParticipant) return null;

        return {
            id: convo.id,
            otherParticipant: {
                id: otherParticipantId,
                name: otherParticipant.name,
                role: otherParticipant.role,
            },
            lastMessage: {
                content: convo.last_message_content || 'No messages yet.',
                timestamp: convo.last_message_timestamp || convo.created_at,
            },
        };
    }).filter((c): c is Conversation => c !== null);

    summaries.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

    return summaries;
};

export const apiGetMessages = async (conversationId: string): Promise<Message[]> => {
    if (isDemo()) return [];
    if (!supabase) return [];

    const tenant_id = getTenantId();
    const currentUser = await getCurrentUser();
    if (!tenant_id || !currentUser) return [];

    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

    if (msgError) throw msgError;

    const unreadMessageIds = messages
        .filter(m => m.sender_id !== currentUser.id && !m.is_read)
        .map(m => m.id);

    if (unreadMessageIds.length > 0) {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessageIds);
    }
    
    return messages.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        content: m.content,
        timestamp: m.timestamp,
        isRead: m.is_read,
    }));
};

export const apiSendDirectMessage = async (message: Message): Promise<Message> => {
    if (isDemo()) return message;
    if (!supabase) throw new Error("Database client not available.");
    
    // Validate and sanitize message content
    const validatedMessage = validateInput(messageSchema.partial(), {
        content: message.content,
        recipientId: message.recipientId
    });
    
    // Sanitize HTML content to prevent XSS
    const sanitizedContent = sanitizeHtml(validatedMessage.content);
    
    const tenant_id = getTenantId();
    if (!tenant_id) throw new Error("Tenant not identified.");

    const dmRateLimiter = ClientRateLimiter.getInstance();
    if (!dmRateLimiter.canMakeRequest('supabase:messages', 'INSERT', 50)) {
        const waitTime = dmRateLimiter.waitTime('supabase:messages', 'INSERT');
        throw new Error(`Rate limit exceeded for direct messages. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
            tenant_id: tenant_id,
            conversation_id: message.conversationId,
            sender_id: message.senderId,
            recipient_id: message.recipientId,
            content: sanitizedContent,
            timestamp: message.timestamp,
        })
        .select()
        .single();
    
    if (insertError) throw insertError;

    const { error: updateConvoError } = await supabase
        .from('conversations')
        .update({
            last_message_content: message.content,
            last_message_timestamp: message.timestamp,
        })
        .eq('id', message.conversationId);

    if (updateConvoError) {
        logger.error('Failed to update conversation summary', { error: updateConvoError });
    }
    
    return {
        id: newMessage.id,
        conversationId: newMessage.conversation_id,
        senderId: newMessage.sender_id,
        recipientId: newMessage.recipient_id,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
        isRead: newMessage.is_read,
    };
};

export const apiStartConversation = async (senderId: string, recipientId: string): Promise<Partial<Conversation>> => {
    if (isDemo()) return { id: 'convo_new' };
    if (!supabase) throw new Error("Database client not available.");

    const tenant_id = getTenantId();
    if (!tenant_id) throw new Error("Tenant not identified.");

    const { data: existingConvos, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', tenant_id)
        .contains('participants', [senderId])
        .contains('participants', [recipientId]);

    if (findError) throw findError;

    if (existingConvos && existingConvos.length > 0) {
        return { id: existingConvos[0].id };
    }

    const convoRateLimiter = ClientRateLimiter.getInstance();
    if (!convoRateLimiter.canMakeRequest('supabase:conversations', 'INSERT', 20)) {
        const waitTime = convoRateLimiter.waitTime('supabase:conversations', 'INSERT');
        throw new Error(`Rate limit exceeded for starting conversations. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    const { data: newConvo, error: createError } = await supabase
        .from('conversations')
        .insert({
            tenant_id,
            participants: [senderId, recipientId],
        })
        .select('id')
        .single();
    
    if (createError) throw createError;

    return { id: newConvo.id };
};

export const getCurrentUser = async (): Promise<any> => {
    const activeUserSession = sessionStorage.getItem('activeUser');
    if (activeUserSession) {
        const parsedUser = JSON.parse(activeUserSession);
        // For parent role, we need the parent's actual ID, not the child's ID.
        if (parsedUser.role === USER_ROLES.PARENT) {
            const [student] = await apiGetStudents({ studentIds: [parsedUser.userId], limit: 1 });
            if (student && student.parentId) {
                const allParents = await apiGetParents();
                const parent = allParents.find(p => p.id === student.parentId);
                // Return the full parent object which includes an `id`.
                if(parent) return parent;
            }
        }
        return parsedUser;
    }
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // This handles staff logins and real parent logins
    if (user.user_metadata?.parent_id) {
        const parents = await apiGetParents();
        return parents.find(p => p.id === user.user_metadata.parent_id);
    }
    
    const teachers = await apiGetTeachers();
    return teachers.find(t => t.email.toLowerCase() === user.email.toLowerCase());
};

export const apiGetMessagableUsers = async (currentUser) => {
    const [teachers, parents] = await Promise.all([
        apiGetTeachers({ limit: 500 }),
        apiGetParents({ limit: 500 })
    ]);
    return [...teachers, ...parents].filter(u => u.id !== currentUser.id);
};

// --- Resources ---
export const apiGetSharedLessonPlans = () => get<SharedLessonPlan>('shared_lesson_plans');
export const apiUpvoteLessonPlan = async (planId: string) => {
    if (isDemo()) { return; }
    if (!supabase) return;

    const { data: plan, error: fetchError } = await supabase
        .from('shared_lesson_plans')
        .select('upvotes')
        .eq('id', planId)
        .single();

    if (fetchError) throw fetchError;
    if (!plan) throw new Error("Lesson plan not found.");
    
    const newUpvotes = (plan.upvotes || 0) + 1;
    const { error: updateError } = await supabase
        .from('shared_lesson_plans')
        .update({ upvotes: newUpvotes })
        .eq('id', planId);

    if (updateError) throw updateError;
};


// --- Events & Absences ---
export const apiGetEvents = () => get<Event>('events');
export const apiUpsertEvent = (event) => upsert('events', event);
export const apiDeleteEvent = (eventId) => del('events', eventId);
export const apiGetAbsenceReports = () => get<AbsenceReport>('absence_reports');
export const apiUpsertAbsenceReport = (report) => upsert('absence_reports', report);

// --- Activity Log ---
export const apiGetActivityLog = () => get<ActivityLog>('activity_log').then(data => data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15));
export const apiLogActivity = (type: string, description: string) => {
    if (isDemo()) return;
    // In a real app, user would be identified from session
    return upsert('activity_log', { user: 'Admin', type, description });
};

// --- Platform Level ---
export const apiGetTenants = () => isDemo() ? [{id: DEMO_TENANT_ID, name: 'Brightstar Demo Academy'}] : get<Tenant>('tenants');
export const apiAddTenant = (tenant) => upsert('tenants', tenant);
export const apiDeleteTenant = (tenantId) => del('tenants', tenantId);

const PLATFORM_SETTINGS_CACHE_KEY = 'platform_settings_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const fetchFromNetworkAndCache = async (): Promise<PlatformSettings> => {
    const headers = { "Content-Type": "application/json" };
    let data: PlatformSettings | null = null;

    // Attempt Cloudflare first (Primary)
    try {
        data = await fetchWithTimeout<PlatformSettings>(CLOUDFLARE_URL, { headers }, 4000);
    } catch (err: any) {
            logger.warn('Cloudflare platform settings fetch failed', { error: err.message });
        }

    // Fallback: Supabase Edge Function with retry logic
    if (!data) {
        try {
            data = await fetchWithExponentialBackoff<PlatformSettings>(
                getSupabaseFallbackUrl(), 
                { headers }
            );
        } catch (err: any) {
            logger.error('Supabase fallback failed after all retries', { error: err.message });
            throw new Error("Both primary and fallback sources failed.");
        }
    }
    
    // Merge with defaults before caching and returning
    const fullSettings = {
        ...data,
        landingPageContent: data.landingPageContent || DEFAULT_LANDING_PAGE_CONTENT,
        menus: data.menus || { header: DEFAULT_MENU_ITEMS },
        pages: data.pages || [], articles: data.articles || [], plans: data.plans || [],
    };
    
    const cachePayload = {
        timestamp: Date.now(),
        data: fullSettings
    };
    
    try {
        localStorage.setItem(PLATFORM_SETTINGS_CACHE_KEY, JSON.stringify(cachePayload));
    } catch (e) {
        logger.warn('Could not write platform settings cache to localStorage', { error: e });
    }
    
    return fullSettings;
};

/**
 * Fetches platform settings with a multi-layered fallback and caching strategy.
 * 1. Checks for demo mode.
 * 2. Checks for a fresh `localStorage` cache.
 * 3. If cache is stale, returns stale data immediately and re-fetches in the background.
 * 4. If no cache, fetches from network (Cloudflare -> Supabase).
 * 5. If network fails, returns default content.
 * @returns {Promise<any>} A promise that resolves to the platform settings object.
 */
export const apiGetPlatformSettings = async () => {
    // Preserve demo mode logic, which bypasses cache
    if (isDemo()) {
        return { 
            plans: [], articles: [], pages: [], 
            menus: { header: DEFAULT_MENU_ITEMS },
            landingPageContent: DEFAULT_LANDING_PAGE_CONTENT,
        };
    }
    
    const cachedItem = localStorage.getItem(PLATFORM_SETTINGS_CACHE_KEY);

    if (cachedItem) {
        try {
            const { timestamp, data } = JSON.parse(cachedItem);
            const isStale = Date.now() - timestamp > CACHE_DURATION_MS;

            if (isStale) {
                // Don't await, let it run in the background to update cache for next time
                fetchFromNetworkAndCache().catch(err => {
                    logger.error('Background cache refresh failed', { error: err?.message });
                });
            }
            
            return data; // Return cached data (stale or fresh) immediately

        } catch (e) {
            logger.warn('Failed to parse platform settings cache, fetching from network', { error: e });
            localStorage.removeItem(PLATFORM_SETTINGS_CACHE_KEY); // Clear bad cache
        }
    }

    // Cache miss or parse error, fetch from network
    try {
        return await fetchFromNetworkAndCache();
    } catch (err) {
        logger.error('All platform settings fetch attempts failed; using defaults', { error: (err as any)?.message });
        // Ensure we always return a valid object with all required properties
        const defaultSettings = { 
            landingPageContent: DEFAULT_LANDING_PAGE_CONTENT, 
            menus: { header: DEFAULT_MENU_ITEMS },
            pages: [], articles: [], plans: []
        };
        
        // Store default settings in cache to prevent repeated failed requests
        try {
            localStorage.setItem(PLATFORM_SETTINGS_CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: defaultSettings
            }));
        } catch (cacheErr) {
            logger.warn('Failed to cache default platform settings', { error: cacheErr });
        }
        
        return defaultSettings;
    }
};


export const apiSavePlatformSettings = async (settings: any) => {
  if (isDemo()) return settings;
  if (!supabase) return settings;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/platform-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({ settings })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    throw new Error(err?.details || err?.error || 'Failed to save platform settings');
  }
  // Invalidate cache so next read refreshes
  try { localStorage.removeItem(PLATFORM_SETTINGS_CACHE_KEY); } catch (e) { logger.warn('Failed to clear platform settings cache', { error: e }); }
  return settings;
};

export const apiUpdateTenantSubscription = async (planId: string, cycle: 'monthly' | 'termly' | 'yearly') => {
    if (isDemo()) {
        return { success: true };
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    const result = await fetchWithExponentialBackoff<any>('/api/update-tenant-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ planId, cycle })
    });
    return result;
};

export const apiUpdateTenant = async (tenant: Partial<Tenant>) => {
    if (isDemo()) return tenant;

    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/update-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ tenant })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Failed to update tenant.');
    }
    return response.json();
};
export const apiFindTenantByEmail = async (email) => {
    if (isDemo()) return null;
    if (!supabase) return null;
    const { data, error } = await supabase.from('teachers').select('tenant_id').eq('email', email).single();
    if (error || !data) return null;
    return data.tenant_id;
};
export const apiGetPlatformUsers = () => get<{data: any}>('platform_settings').then(d => d[0]?.data?.platform_users || []);

export const apiGetRolePermissions = async (): Promise<Record<string, Record<string, boolean>>> => {
  const settings = await apiGetPlatformSettings();
  return (settings?.role_permissions || {}) as Record<string, Record<string, boolean>>;
};

export const apiSaveRolePermissions = async (rolePermissions: Record<string, Record<string, boolean>>) => {
  const settings = await apiGetPlatformSettings();
  return apiSavePlatformSettings({ ...(settings || {}), role_permissions: rolePermissions });
};

export const apiCreatePlatformUser = async (payload: { email: string; role: string; name?: string; password?: string }) => {
  if (!supabase) throw new Error('Auth client not available.');
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/platform-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to create user');
  }
  const body = await res.json();
  // Do not persist tempPassword anywhere; caller may handle clipboard
  return body as { user: any; tempPassword?: string };
};

export const apiDeletePlatformUser = async (id: string) => {
  if (!supabase) throw new Error('Auth client not available.');
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/platform-users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({ id })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to delete user');
  }
  return res.json();
};

// --- Super Admin (platform) ---
export const apiSuperAdminCreateTenant = async (payload: { schoolName: string; slug: string; schoolType?: string; adminEmail: string; adminPassword: string; adminName: string; }) => {
    if (!supabase) throw new Error('Auth client not available.');
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.details || err?.error || 'Failed to create tenant');
    }
    return res.json();
};

export const apiSuperAdminCreateTenantAdmin = async (tenantId: string, payload: { adminEmail: string; adminPassword: string; adminName: string; }) => {
    if (!supabase) throw new Error('Auth client not available.');
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/tenants/${tenantId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.details || err?.error || 'Failed to create admin user');
    }
    return res.json();
};
export const apiSavePlatformUsers = (users) => apiGetPlatformSettings().then(s => apiSavePlatformSettings({...s, platform_users: users}));
export const apiGetKbArticles = () => get<{data: any}>('platform_settings').then(d => d[0]?.data?.kb_articles || []);
export const apiSaveKbArticles = (articles) => apiGetPlatformSettings().then(s => apiSavePlatformSettings({...s, kb_articles: articles}));

// Alias for backward compatibility
export const apiGetStudentScores = apiGetScores;
