import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^[+]?[1-9]\d{0,15}$/, 'Invalid phone number');
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');
export const idSchema = z.string().min(1, 'ID is required');
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format');

// Student validation schema
export const studentSchema = z.object({
  id: idSchema.optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(500, 'Address too long').optional(),
  parentId: idSchema.optional(),
  classId: idSchema.optional(),
  enrollmentDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']).optional(),
});

// Teacher validation schema
export const teacherSchema = z.object({
  id: idSchema.optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subjects: z.array(z.string()).optional(),
  qualifications: z.string().max(1000, 'Qualifications too long').optional(),
  hireDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on-leave']).optional(),
});

// Parent validation schema
export const parentSchema = z.object({
  id: idSchema.optional(),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: z.string().max(500, 'Address too long').optional(),
  occupation: z.string().max(100, 'Occupation too long').optional(),
  relationship: z.enum(['father', 'mother', 'guardian', 'other']).optional(),
});

// Message validation schema
export const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  recipientId: idSchema,
  type: z.enum(['direct', 'announcement', 'reminder']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// Communication validation schema
export const communicationSchema = z.object({
  channel: z.enum(['sms', 'email', 'push', 'in-app']),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  recipients: z.array(idSchema).min(1, 'At least one recipient required'),
  type: z.enum(['announcement', 'reminder', 'alert', 'newsletter']),
});

// Pagination validation schema
export const paginationSchema = z.object({
  limit: z.number().min(1).max(1000).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

// Search validation schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
  filters: z.record(z.string()).optional(),
});

// Tenant validation schema
export const tenantSchema = z.object({
  id: idSchema.optional(),
  name: nameSchema,
  slug: slugSchema,
  subdomain: slugSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500, 'Address too long').optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// Utility function to validate and sanitize input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

// Sanitize HTML content to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize SQL input to prevent injection
export function sanitizeSql(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}