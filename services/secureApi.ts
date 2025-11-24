// services/secureApi.ts
// Secure API service with explicit column selection and capped pagination

import { supabase } from './supabaseClient';
import { withRetry } from '../utils/retry';
import { parseSupabaseError, DatabaseError, NotFoundError } from '../utils/errors';
import { 
  validateInput, 
  studentSchema, 
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
  SchoolSettings, TeacherAttendanceRecord,
  Tenant, Plan, ActivityLog,
  CommunicationLog, MessageTemplate, ScheduledReminder, ScheduledCampaign, Conversation, Message,
  Page, Event,
  Admission
} from '../types';

import { USER_ROLES } from '../utils/constants';
import { DEFAULT_LANDING_PAGE_CONTENT, DEFAULT_MENU_ITEMS } from '../utils/landingPageContent';
import { getSubdomain } from '../utils/subdomain';
import { logger } from '../utils/logger';

// Security constants
const MAX_PAGE_SIZE = 100; // Maximum number of records per page
const DEFAULT_PAGE_SIZE = 20; // Default page size
const MAX_OFFSET = 10000; // Maximum offset to prevent DoS

// Column selection constants - explicitly define allowed columns to prevent data leakage
const STUDENT_COLUMNS = 'id,name,admissionNo,class,dob,gender,photo,address,parentId,parentName,parentEmail,parentPhone,status,created_at';
const TEACHER_COLUMNS = 'id,auth_id,tenant_id,name,email,role,classTeacherOf,baseSalary,subjects';
const PARENT_COLUMNS = 'id,name,email,phone,auth_id,pendingChanges';
const SCORE_COLUMNS = 'id,studentId,subjectId,class,session,term,ca1,ca2,exam,total,grade,remark,created_at';
const ATTENDANCE_COLUMNS = 'id,date,class,session,term,statuses,created_at';
const INVOICE_COLUMNS = 'id,studentId,class,session,term,issueDate,dueDate,totalAmount,amountPaid,status,items,created_at';
const PAYMENT_COLUMNS = 'id,invoiceId,studentId,amount,paymentDate,paymentMethod,reference,status,created_at';
const COMMUNICATION_COLUMNS = 'id,type,channel,content,recipients,sentAt,status,created_at';

// Helper function to validate and cap pagination parameters
const validatePagination = (options: { limit?: number; offset?: number }): { limit: number; offset: number } => {
  const limit = Math.min(Math.max(1, options.limit || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const offset = Math.min(Math.max(0, options.offset || 0), MAX_OFFSET);
  return { limit, offset };
};

// Helper function to build secure queries with explicit column selection
const buildSecureQuery = <T>(
  table: string, 
  columns: string, 
  options: { filter?: string; limit?: number; offset?: number } = {}
) => {
  let query = supabase.from(table).select(columns);
  
  if (options.filter) {
    const [field, value] = options.filter.split('=');
    query = query.eq(field, value);
  }
  
  const { limit, offset } = validatePagination(options);
  query = query.range(offset, offset + limit - 1);
  
  return query;
};

// Secure data access layer
const secureGet = async <T>(
  table: string, 
  columns: string, 
  options: { filter?: string; limit?: number; offset?: number } = {}
): Promise<T[]> => {
  if (!supabase || (supabase as any)._offline) return [];
  
  return withRetry(async () => {
    const query = buildSecureQuery<T>(table, columns, options);
    const { data, error } = await query;
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as T[];
  });
};

// Secure student operations
export const secureApiGetStudents = async (
  options: { classFilter?: string; studentIds?: string[]; limit?: number; offset?: number } = {}
): Promise<Student[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('students').select(STUDENT_COLUMNS);
    
    if (options.classFilter) {
      query = query.eq('class', options.classFilter);
    }
    
    if (options.studentIds && options.studentIds.length > 0) {
      query = query.in('id', options.studentIds);
    }
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure teacher operations
export const secureApiGetTeachers = async (
  options: { limit?: number; offset?: number } = {}
): Promise<Teacher[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('teachers').select(TEACHER_COLUMNS);
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure parent operations
export const secureApiGetParents = async (
  options: { limit?: number; offset?: number } = {}
): Promise<Parent[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('parents').select(PARENT_COLUMNS);
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure score operations
export const secureApiGetScores = async (
  options: { studentIds?: string[]; limit?: number; offset?: number } = {}
): Promise<Score[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('scores').select(SCORE_COLUMNS);
    
    if (options.studentIds && options.studentIds.length > 0) {
      query = query.in('studentId', options.studentIds);
    }
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure attendance operations
export const secureApiGetAttendance = async (
  options: { classFilter?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number } = {}
): Promise<AttendanceRecord[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('attendance').select(ATTENDANCE_COLUMNS);
    
    if (options.classFilter) {
      query = query.eq('class', options.classFilter);
    }
    
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom);
    }
    
    if (options.dateTo) {
      query = query.lte('date', options.dateTo);
    }
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure financial operations
export const secureApiGetInvoices = async (
  options: { studentId?: string; status?: string; limit?: number; offset?: number } = {}
): Promise<Invoice[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('invoices').select(INVOICE_COLUMNS);
    
    if (options.studentId) {
      query = query.eq('studentId', options.studentId);
    }
    
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

export const secureApiGetPayments = async (
  options: { studentId?: string; invoiceId?: string; limit?: number; offset?: number } = {}
): Promise<Payment[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('payments').select(PAYMENT_COLUMNS);
    
    if (options.studentId) {
      query = query.eq('studentId', options.studentId);
    }
    
    if (options.invoiceId) {
      query = query.eq('invoiceId', options.invoiceId);
    }
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure communication operations
export const secureApiGetCommunicationLogs = async (
  options: { type?: string; channel?: string; limit?: number; offset?: number } = {}
): Promise<CommunicationLog[]> => {
  if (!supabase) return [];
  
  return withRetry(async () => {
    let query = supabase.from('communication_logs').select(COMMUNICATION_COLUMNS);
    
    if (options.type) {
      query = query.eq('type', options.type);
    }
    
    if (options.channel) {
      query = query.eq('channel', options.channel);
    }
    
    const { limit, offset } = validatePagination(options);
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

// Secure settings operations
export const secureApiGetSchoolSettings = async (tenant_id = getSubdomain()): Promise<SchoolSettings | null> => {
  if (!supabase) return null;
  
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('id,schoolName,schoolType,session,term,gradingSystem,maxCa1,maxCa2,maxExam,reportCardSettings,created_at')
      .eq('tenant_id', tenant_id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  });
};

// Secure conversation operations
export const secureApiGetConversationSummaries = async (
  userId: string, 
  userRole: UserRole,
  options: { limit?: number; offset?: number } = {}
): Promise<Conversation[]> => {
  if (!supabase) return [];
  
  const tenant_id = getSubdomain();
  if (!tenant_id) return [];
  
  return withRetry(async () => {
    const { limit, offset } = validatePagination(options);
    
    const { data: convos, error: convoError } = await supabase
      .from('conversations')
      .select('id,participants,last_message_content,last_message_timestamp,created_at')
      .eq('tenant_id', tenant_id)
      .contains('participants', [userId])
      .range(offset, offset + limit - 1);

    if (convoError) throw convoError;
    if (!convos) return [];

    const [teachers, parents] = await Promise.all([
      secureApiGetTeachers({ limit: 100 }),
      secureApiGetParents({ limit: 100 })
    ]);
    
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
  });
};

// Secure message operations
export const secureApiGetMessages = async (
  conversationId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Message[]> => {
  if (!supabase) return [];
  
  const tenant_id = getSubdomain();
  if (!tenant_id) return [];
  
  return withRetry(async () => {
    const { limit, offset } = validatePagination(options);
    
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id,conversation_id,sender_id,recipient_id,content,timestamp,is_read')
      .eq('tenant_id', tenant_id)
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })
      .range(offset, offset + limit - 1);

    if (msgError) throw msgError;
    
    // Mark messages as read
    const unreadMessageIds = messages
      .filter(m => !m.is_read)
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
  });
};

// Export secure API functions
export const secureApi = {
  getStudents: secureApiGetStudents,
  getTeachers: secureApiGetTeachers,
  getParents: secureApiGetParents,
  getScores: secureApiGetScores,
  getAttendance: secureApiGetAttendance,
  getInvoices: secureApiGetInvoices,
  getPayments: secureApiGetPayments,
  getCommunicationLogs: secureApiGetCommunicationLogs,
  getSchoolSettings: secureApiGetSchoolSettings,
  getConversationSummaries: secureApiGetConversationSummaries,
  getMessages: secureApiGetMessages,
};