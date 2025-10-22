// utils/errors.ts
// Custom error classes for better error handling and context

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT',
    public table?: string,
    public originalError?: any
  ) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      table: this.table,
      originalError: this.originalError?.message || this.originalError?.toString(),
    };
  }
}

/**
 * Connection error
 */
export class ConnectionError extends AppError {
  constructor(
    message: string,
    public isOffline: boolean = false,
    public originalError?: any
  ) {
    super(message, 'CONNECTION_ERROR', 503);
    this.name = 'ConnectionError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      isOffline: this.isOffline,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    public validationErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    public requiredPermission?: string
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      requiredPermission: this.requiredPermission,
    };
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    public resource?: string,
    public resourceId?: string
  ) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      resourceId: this.resourceId,
    };
  }
}

/**
 * Conflict error (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    public conflictingField?: string
  ) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      conflictingField: this.conflictingField,
    };
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Check if an error is operational (expected) vs programmer error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert unknown error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false // Not operational since it's unexpected
    );
  }

  return new AppError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    false
  );
}

/**
 * Parse Supabase/PostgreSQL error into appropriate error type
 */
export function parseSupabaseError(
  error: any,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT',
  table?: string
): AppError {
  const message = error?.message || 'Database operation failed';
  const code = error?.code;

  // Connection errors
  if (
    code === 'PGRST301' ||
    message.includes('connection') ||
    message.includes('network')
  ) {
    return new ConnectionError(
      'Database connection failed',
      false,
      error
    );
  }

  // Not found
  if (code === 'PGRST116') {
    return new NotFoundError(
      'Resource not found',
      table,
      undefined
    );
  }

  // Duplicate key/unique constraint violation
  if (code === '23505') {
    return new ConflictError(
      'A record with this value already exists',
      undefined
    );
  }

  // Foreign key violation
  if (code === '23503') {
    return new DatabaseError(
      'Referenced record does not exist',
      operation,
      table,
      error
    );
  }

  // Check constraint violation
  if (code === '23514') {
    return new ValidationError(
      'Data does not meet validation requirements',
      undefined,
      undefined
    );
  }

  // Authentication required
  if (code === '401' || message.includes('JWT')) {
    return new AuthenticationError('Authentication required');
  }

  // Permission denied
  if (
    code === '42501' ||
    code === '403' ||
    message.includes('permission')
  ) {
    return new AuthorizationError(
      'Insufficient permissions for this operation'
    );
  }

  // Generic database error
  return new DatabaseError(
    message,
    operation,
    table,
    error
  );
}
