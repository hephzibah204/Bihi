// services/api.ts
import { supabase } from './supabaseClient';
import { DEMO_TENANT_ID, CORE_DEMO_DATA } from '../utils/demoData';
// FIX: Add missing type imports
import { Student, Subject, SchoolSettings, Score, Teacher, Parent, Invoice, FeeStructure, BehavioralLogEntry, Remark, Assignment, AssignmentScore, Payslip, PayrollRun, CommunicationLog, MessageTemplate, ScheduledReminder, Conversation, Message, SharedLessonPlan, Event, AbsenceReport, ActivityLog, Tenant, Plan, Page, PlatformUser, AttendanceRecord, Payment, Expense, Income, UserRole } from '../types';
import { USER_ROLES } from '../utils/constants';
import { DEFAULT_LANDING_PAGE_CONTENT, DEFAULT_MENU_ITEMS } from '../utils/landingPageContent';
import { getSubdomain } from '../utils/subdomain';

// --- New Fallback Logic Implementation ---

type PlatformSettings = Record<string, any>;

const CLOUDFLARE_URL = "/api/platform-settings";
const SUPABASE_FALLBACK_URL = "https://shzwolantavauszuxwlp.supabase.co/functions/v1/platform-settings";

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
        console.error(`All ${maxRetries} attempts failed for ${url}.`, error);
        throw error; // Rethrow the last error after all retries fail.
      }
      
      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = delay * 0.5 * Math.random(); // Jitter is up to 50% of the delay
      const backoffTime = delay + jitter;
      
      console.warn(
        `Attempt ${attempt} for ${url} failed: ${error.message}. Retrying in ${Math.round(backoffTime)}ms...`
      );
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
const isDemo = () => getTenantId() === DEMO_TENANT_ID;

const get = async <T>(table: string, options: { filter?: string, select?: string } = {}): Promise<T[]> => {
    if (isDemo()) {
        return (CORE_DEMO_DATA[table] || []) as any;
    }
    if (!supabase) return [];
    let query = supabase.from(table).select(options.select || '*');
    if (options.filter) {
        // This is a simplification; a real app might need more complex filtering
        const [field, value] = options.filter.split('=');
        query = query.eq(field, value);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as T[];
};

const upsert = async (table: string, record: any) => {
    if (isDemo()) return record;
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).upsert(record).select();
    if (error) throw error;
    return data[0];
};

const batchUpsert = async (table: string, records: any[]) => {
    if (isDemo()) return records;
    if (!supabase) return null;
    const { data, error } = await supabase.from(table).upsert(records).select();
    if (error) throw error;
    return data;
}

const del = async (table: string, id: string) => {
    if (isDemo()) return { id };
    if (!supabase) return null;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { id };
};

// --- Students ---
export const apiGetStudents = async (options: { classFilter?: string, studentIds?: string[] } = {}): Promise<Student[]> => {
    if (isDemo()) {
        let students = CORE_DEMO_DATA.students;
        if (options.classFilter) {
            students = students.filter(s => s.class === options.classFilter);
        }
        if (options.studentIds) {
            const idSet = new Set(options.studentIds);
            students = students.filter(s => idSet.has(s.id));
        }
        return students;
    }
    if (!supabase) return [];
    let query = supabase.from('students').select('*');
    if(options.classFilter) query = query.eq('class', options.classFilter);
    if(options.studentIds) query = query.in('id', options.studentIds);
    const { data, error } = await query;
    if (error) throw error;
    return data;
};
export const apiUpsertStudent = (student: Partial<Student>) => {
    const actionType = student.id ? 'STUDENT_UPDATE' : 'STUDENT_ADD';
    const description = student.id ? `Updated details for ${student.name}` : `Added new student ${student.name}`;
    apiLogActivity(actionType, description);
    return upsert('students', student);
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
export const apiGetParents = () => get<Parent>('parents');
export const apiUpsertParent = (parent: Partial<Parent>) => upsert('parents', parent);
export const apiDeleteParent = (parentId: string) => del('parents', parentId);
export const apiInviteParent = async (studentId: string) => {
    if (isDemo()) {
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Invitation sent (simulated).' } }));
        return { message: 'Invitation sent (simulated).' };
    }
    if (!supabase) throw new Error("Auth client not available.");
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/invite-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ studentId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Failed to send invitation.');
    }
    const result = await response.json();
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
export const apiGetTeachers = () => get<Teacher>('teachers');
export const apiUpsertTeacher = (teacher: Partial<Teacher>) => {
    const actionType = teacher.id ? 'TEACHER_UPDATE' : 'TEACHER_ADD';
    const description = teacher.id ? `Updated details for ${teacher.name}` : `Added new staff ${teacher.name}`;
    apiLogActivity(actionType, description);
    return upsert('teachers', teacher);
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
export const apiGetScores = (options: {studentIds?: string[]} = {}) => {
    if (isDemo()) {
        if (options.studentIds) {
            const idSet = new Set(options.studentIds);
            return CORE_DEMO_DATA.scores.filter(s => idSet.has(s.studentId));
        }
        return CORE_DEMO_DATA.scores;
    }
    return apiGetStudents(options).then(students => {
        if (!supabase) return [];
        const studentIds = students.map(s => s.id);
        return supabase.from('scores').select('*').in('studentId', studentIds).then(res => {
            if (res.error) throw res.error;
            return res.data;
        });
    });
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
    
    const response = await fetch('/api/use-scratch-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, schoolId })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to validate PIN.');
    }
    
    return response.json();
};
export const apiGetPaymentMethods = () => get<{data: any[]}>('payment_methods').then(res => res[0]?.data || []);
export const apiSavePaymentMethods = (methods: any) => upsert('payment_methods', { id: 1, data: methods });

// --- Settings & Config ---
export const apiGetSchoolSettings = (tenant_id = getTenantId()) => {
    if (tenant_id === DEMO_TENANT_ID) return Promise.resolve(CORE_DEMO_DATA.settings);
    if (!supabase) return Promise.resolve(null);
    return supabase.from('settings').select('*').eq('tenant_id', tenant_id).single().then(res => {
        if(res.error && res.error.code !== 'PGRST116') throw res.error; // PGRST116 = no rows found
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
    if (isDemo()) {
        await apiUpsertCommunicationLog({ type, channel, content, recipients, sentAt: new Date().toISOString() });
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `Message sent to ${recipients.length} recipients (simulated).` } }));
        return { success: true };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/send-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ channel, content, recipients, type })
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Failed to send message.');
    }
    
    return response.json();
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
export const apiGetMessageTemplates = () => get<MessageTemplate>('message_templates');
export const apiUpsertMessageTemplate = (template: Partial<MessageTemplate>) => upsert('message_templates', template);
export const apiDeleteMessageTemplate = (templateId: string) => del('message_templates', templateId);
export const apiGetScheduledReminders = () => get<ScheduledReminder>('scheduled_reminders');
export const apiUpsertScheduledReminder = (reminder: Partial<ScheduledReminder>) => upsert('scheduled_reminders', reminder);
export const apiDeleteScheduledReminder = (reminderId: string) => del('scheduled_reminders', reminderId);

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
    
    const tenant_id = getTenantId();
    if (!tenant_id) throw new Error("Tenant not identified.");

    const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
            tenant_id: tenant_id,
            conversation_id: message.conversationId,
            sender_id: message.senderId,
            recipient_id: message.recipientId,
            content: message.content,
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
        console.error("Failed to update conversation summary:", updateConvoError);
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
            const allStudents = await apiGetStudents();
            const student = allStudents.find(s => s.id === parsedUser.userId);
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
    const [teachers, parents] = await Promise.all([apiGetTeachers(), apiGetParents()]);
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
        console.warn("⚠️ Cloudflare failed:", err.message);
    }

    // Fallback: Supabase Edge Function with retry logic
    if (!data) {
        try {
            data = await fetchWithExponentialBackoff<PlatformSettings>(
                SUPABASE_FALLBACK_URL, 
                { headers }
            );
        } catch (err: any) {
            console.error("❌ Supabase fallback failed after all retries:", err.message);
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
        console.warn("Could not write to localStorage:", e);
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
                    console.error("Background cache refresh failed:", err.message);
                });
            }
            
            return data; // Return cached data (stale or fresh) immediately

        } catch (e) {
            console.warn("Failed to parse cache, fetching from network.", e);
            localStorage.removeItem(PLATFORM_SETTINGS_CACHE_KEY); // Clear bad cache
        }
    }

    // Cache miss or parse error, fetch from network
    try {
        return await fetchFromNetworkAndCache();
    } catch (err) {
        console.error("❌ All fetch attempts failed, falling back to default content:", err.message);
        return { 
            landingPageContent: DEFAULT_LANDING_PAGE_CONTENT, 
            menus: { header: DEFAULT_MENU_ITEMS },
            pages: [], articles: [], plans: []
        };
    }
};


export const apiSavePlatformSettings = (settings) => upsert('platform_settings', { id: 1, data: settings });

export const apiUpdateTenantSubscription = async (planId: string, cycle: 'monthly' | 'termly' | 'yearly') => {
    if (isDemo()) {
        return { success: true };
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/update-tenant-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ planId, cycle })
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Failed to update subscription.');
    }
    
    return response.json();
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
export const apiSavePlatformUsers = (users) => apiGetPlatformSettings().then(s => apiSavePlatformSettings({...s, platform_users: users}));
export const apiGetKbArticles = () => get<{data: any}>('platform_settings').then(d => d[0]?.data?.kb_articles || []);
export const apiSaveKbArticles = (articles) => apiGetPlatformSettings().then(s => apiSavePlatformSettings({...s, kb_articles: articles}));