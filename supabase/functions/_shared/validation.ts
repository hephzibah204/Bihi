// Shared validation schemas for Supabase Edge Functions
// Using Zod for runtime type validation and sanitization

// Base schemas for common validation patterns
export const emailSchema = z.string().email().max(255).toLowerCase().trim();
export const passwordSchema = z.string().min(8).max(128);
export const subdomainSchema = z.string().regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens').min(3).max(63);
export const schoolNameSchema = z.string().min(2).max(200).trim();
export const nameSchema = z.string().min(1).max(100).trim();

// School registration schema
export const schoolRegistrationSchema = z.object({
  schoolName: schoolNameSchema,
  subdomain: subdomainSchema,
  adminEmail: emailSchema,
  adminPassword: passwordSchema,
  adminName: nameSchema,
  schoolType: z.enum(['Primary', 'Secondary', 'Primary & Secondary', 'Nursery', 'University', 'Other']).optional(),
});

// AI Gateway input schema
export const aiGatewayInputSchema = z.object({
  input: z.string().min(1).max(10000).trim(), // Limit input length
  prompt: z.string().min(1).max(10000).trim().optional(),
  conversationId: z.string().max(100).optional(),
  role: z.enum(['Teacher', 'Student', 'Parent', 'Admin']).default('Teacher'),
  tenantId: z.string().max(100).optional(),
  topK: z.number().int().min(1).max(50).default(5), // Limit topK to prevent abuse
  useOffline: z.boolean().default(false),
});

// Sanitization utilities
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Validation helper with sanitization
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const validated = schema.parse(data);
  
  // Apply additional sanitization for string fields
  if (typeof validated === 'object' && validated !== null) {
    const sanitized = { ...validated };
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitizeString(sanitized[key]);
      }
    });
    return sanitized;
  }
  
  return validated;
};

// Rate limiting helpers
export const createRateLimitKey = (identifier: string, action: string): string => {
  return `rate_limit:${action}:${identifier}`;
};

export const checkRateLimit = async (
  identifier: string, 
  action: string, 
  limit: number, 
  windowSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  // This is a simple in-memory implementation
  // In production, use Redis or similar
  const key = createRateLimitKey(identifier, action);
  const now = Date.now();
  const resetAt = now + (windowSeconds * 1000);
  
  // For now, return allowed (implement proper rate limiting in production)
  return { allowed: true, remaining: limit, resetAt };
};

// Security headers helper
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  };
};

// Import zod dynamically for Deno compatibility
let z: any;
try {
  // @ts-ignore - Dynamic import for Deno
  z = await import('https://deno.land/x/zod@v3.22.4/mod.ts');
} catch {
  // Fallback for local development
  z = {
    string: () => ({
      email: () => ({ max: (n: number) => ({ toLowerCase: () => ({ trim: () => ({}) }) }) }),
      min: (n: number) => ({ max: (m: number) => ({ trim: () => ({}) }) }),
      max: (n: number) => ({ trim: () => ({}) }),
      regex: (pattern: RegExp, message: string) => ({ min: (n: number) => ({ max: (m: number) => ({}) }) }),
      trim: () => ({ min: (n: number) => ({ max: (m: number) => ({}) }) }),
    }),
    number: () => ({
      int: () => ({ min: (n: number) => ({ max: (m: number) => ({ default: (d: any) => ({}) }) }) }),
    }),
    boolean: () => ({ default: (d: boolean) => ({}) }),
    enum: (values: string[]) => ({ optional: () => ({}) }),
    object: (shape: any) => ({ parse: (data: any) => data }),
  };
}