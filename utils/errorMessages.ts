// utils/errorMessages.ts
// Standardized error message system with consistent patterns and user-friendly messages

export interface ErrorContext {
  entity?: string;
  operation?: string;
  field?: string;
  value?: string;
  userId?: string;
  tenantId?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  code?: string;
}

/**
 * Error message templates with placeholders
 */
export const ERROR_TEMPLATES = {
  // Validation errors
  VALIDATION_REQUIRED: 'Please provide a valid {field}',
  VALIDATION_FORMAT: 'The {field} format is invalid. Expected format: {format}',
  VALIDATION_LENGTH: 'The {field} must be between {min} and {max} characters',
  VALIDATION_RANGE: 'The {field} must be between {min} and {max}',
  VALIDATION_UNIQUE: 'This {field} is already in use. Please choose a different one',
  VALIDATION_REFERENCE: 'The selected {field} does not exist',

  // Authentication errors
  AUTH_REQUIRED: 'You need to be logged in to perform this action',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password. Please try again',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please log in again',
  AUTH_INSUFFICIENT_PERMISSIONS: 'You don\'t have permission to {operation} {entity}',
  AUTH_ACCOUNT_LOCKED: 'Your account has been temporarily locked. Please contact support',

  // Resource errors
  RESOURCE_NOT_FOUND: 'The {entity} you\'re looking for could not be found',
  RESOURCE_ALREADY_EXISTS: 'A {entity} with this information already exists',
  RESOURCE_IN_USE: 'This {entity} cannot be deleted because it\'s being used by other records',
  RESOURCE_LIMIT_EXCEEDED: 'You\'ve reached the maximum number of {entity} allowed',

  // Database errors
  DB_CONNECTION_FAILED: 'Unable to connect to the database. Please try again',
  DB_OPERATION_FAILED: 'Failed to {operation} {entity}. Please try again',
  DB_TIMEOUT: 'The operation took too long to complete. Please try again',
  DB_CONFLICT: 'This operation conflicts with another recent change. Please refresh and try again',

  // Network errors
  NETWORK_OFFLINE: 'You appear to be offline. Please check your internet connection',
  NETWORK_TIMEOUT: 'The request timed out. Please check your connection and try again',
  NETWORK_SERVER_ERROR: 'The server is experiencing issues. Please try again later',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait {waitTime} before trying again',

  // File upload errors
  FILE_TOO_LARGE: 'The file is too large. Maximum size allowed is {maxSize}',
  FILE_INVALID_TYPE: 'Invalid file type. Only {allowedTypes} files are allowed',
  FILE_UPLOAD_FAILED: 'File upload failed. Please try again',

  // Import/Export errors
  IMPORT_INVALID_FORMAT: 'The import file format is invalid. Please check the template',
  IMPORT_VALIDATION_ERRORS: 'Found {count} validation errors in the import file',
  EXPORT_FAILED: 'Failed to export data. Please try again',

  // Payment/Financial errors
  PAYMENT_FAILED: 'Payment processing failed. Please check your payment details',
  PAYMENT_INSUFFICIENT_FUNDS: 'Insufficient funds. Please check your account balance',
  PAYMENT_EXPIRED: 'The payment session has expired. Please start again',

  // Tenant/Multi-tenancy errors
  TENANT_NOT_FOUND: 'School organization not found',
  TENANT_ACCESS_DENIED: 'You don\'t have access to this school organization',
  TENANT_SUSPENDED: 'This school account has been suspended. Please contact support',

  // Communication errors
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again or contact the recipient directly',
  SMS_SEND_FAILED: 'Failed to send SMS. Please verify the phone number and try again',
  NOTIFICATION_FAILED: 'Failed to send notification. The recipient will be notified when they log in'
};

/**
 * User-friendly error mappings for common technical errors
 */
export const FRIENDLY_ERROR_MAPPINGS: Record<string, UserFriendlyError> = {
  // Database errors
  'PGRST116': {
    title: 'Not Found',
    message: 'The requested information could not be found.',
    action: 'Please refresh the page and try again.'
  },
  'PGRST301': {
    title: 'Connection Error',
    message: 'Unable to connect to the database.',
    action: 'Please check your internet connection and try again.'
  },
  '23505': {
    title: 'Duplicate Entry',
    message: 'This information already exists in the system.',
    action: 'Please check your input and try with different values.'
  },
  '23503': {
    title: 'Invalid Reference',
    message: 'The referenced item no longer exists.',
    action: 'Please refresh the page and select a valid option.'
  },

  // Authentication errors
  'invalid_credentials': {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect.',
    action: 'Please check your credentials and try again.'
  },
  'email_not_confirmed': {
    title: 'Email Not Verified',
    message: 'Please check your email and click the verification link.',
    action: 'Didn\'t receive the email? Click here to resend.'
  },
  'signup_disabled': {
    title: 'Registration Unavailable',
    message: 'New account registration is currently disabled.',
    action: 'Please contact your administrator for access.'
  },

  // Network errors
  'NetworkError': {
    title: 'Connection Problem',
    message: 'Unable to reach the server.',
    action: 'Please check your internet connection and try again.'
  },
  'TimeoutError': {
    title: 'Request Timeout',
    message: 'The operation took too long to complete.',
    action: 'Please try again or contact support if the problem persists.'
  }
};

/**
 * Context-specific error messages for different entities
 */
export const ENTITY_ERROR_CONTEXTS = {
  student: {
    notFound: 'Student not found. They may have been transferred or graduated.',
    createFailed: 'Failed to add the student. Please check all required fields.',
    updateFailed: 'Failed to update student information. Please try again.',
    deleteFailed: 'Cannot remove this student because they have associated records.'
  },
  teacher: {
    notFound: 'Teacher not found. They may no longer be with the school.',
    createFailed: 'Failed to add the teacher. Please check all required fields.',
    updateFailed: 'Failed to update teacher information. Please try again.',
    deleteFailed: 'Cannot remove this teacher because they have associated classes or records.'
  },
  parent: {
    notFound: 'Parent/Guardian not found in the system.',
    createFailed: 'Failed to add the parent. Please check all required fields.',
    updateFailed: 'Failed to update parent information. Please try again.',
    deleteFailed: 'Cannot remove this parent because they have children in the system.'
  },
  class: {
    notFound: 'Class not found. It may have been archived.',
    createFailed: 'Failed to create the class. Please check the class details.',
    updateFailed: 'Failed to update class information. Please try again.',
    deleteFailed: 'Cannot delete this class because it has enrolled students.'
  },
  score: {
    notFound: 'Grade/Score record not found.',
    createFailed: 'Failed to save the grade. Please check the score value.',
    updateFailed: 'Failed to update the grade. Please try again.',
    deleteFailed: 'Cannot delete this grade record.'
  },
  payment: {
    notFound: 'Payment record not found.',
    createFailed: 'Failed to process the payment. Please check payment details.',
    updateFailed: 'Failed to update payment information.',
    deleteFailed: 'Cannot delete this payment record.'
  }
};

/**
 * Generate error message from template
 */
export function formatErrorMessage(template: string, context: ErrorContext = {}): string {
  let message = template;
  
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });
  
  return message;
}

/**
 * Get user-friendly error for technical error
 */
export function getUserFriendlyError(
  error: any, 
  context: ErrorContext = {}
): UserFriendlyError {
  // Check if it's a known technical error code
  const errorCode = error?.code || error?.error_code || error?.status;
  if (errorCode && FRIENDLY_ERROR_MAPPINGS[errorCode]) {
    return FRIENDLY_ERROR_MAPPINGS[errorCode];
  }
  
  // Check error message patterns
  const errorMessage = error?.message || error?.error_description || String(error);
  
  // Network-related errors
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
    return FRIENDLY_ERROR_MAPPINGS['NetworkError'];
  }
  
  if (errorMessage.toLowerCase().includes('timeout')) {
    return FRIENDLY_ERROR_MAPPINGS['TimeoutError'];
  }
  
  // Generic database errors
  if (errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('sql')) {
    return {
      title: 'Database Error',
      message: 'There was a problem with the database operation.',
      action: 'Please try again or contact support if the problem persists.',
      code: 'DB_ERROR'
    };
  }
  
  // Validation errors
  if (errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('invalid')) {
    return {
      title: 'Invalid Input',
      message: 'Please check your input and try again.',
      action: 'Make sure all required fields are filled correctly.',
      code: 'VALIDATION_ERROR'
    };
  }
  
  // Default fallback
  return {
    title: 'Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Get entity-specific error message
 */
export function getEntityError(
  entity: string, 
  operation: 'create' | 'read' | 'update' | 'delete' | 'notFound',
  customMessage?: string
): string {
  const entityContext = ENTITY_ERROR_CONTEXTS[entity as keyof typeof ENTITY_ERROR_CONTEXTS];
  
  if (customMessage) {
    return customMessage;
  }
  
  if (entityContext) {
    switch (operation) {
      case 'create':
        return entityContext.createFailed;
      case 'update':
        return entityContext.updateFailed;
      case 'delete':
        return entityContext.deleteFailed;
      case 'notFound':
        return entityContext.notFound;
      default:
        return `An error occurred while processing the ${entity}.`;
    }
  }
  
  // Fallback for unknown entities
  return formatErrorMessage(ERROR_TEMPLATES.DB_OPERATION_FAILED, { entity, operation });
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: any,
  context: ErrorContext = {}
): {
  success: false;
  error: UserFriendlyError;
  timestamp: string;
  context?: ErrorContext;
} {
  const friendlyError = getUserFriendlyError(error, context);
  
  return {
    success: false,
    error: friendlyError,
    timestamp: new Date().toISOString(),
    context: process.env.NODE_ENV === 'development' ? context : undefined
  };
}

/**
 * Log error with context for debugging
 */
export function logError(
  error: any,
  context: ErrorContext = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const errorInfo = {
    message: error?.message || String(error),
    code: error?.code || error?.status,
    stack: error?.stack,
    context,
    severity,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorInfo);
  }
  
  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production' && severity === 'critical') {
    // sendToErrorTrackingService(errorInfo);
  }
}

/**
 * Validation error formatter
 */
export function formatValidationErrors(
  errors: Record<string, string[]>
): string[] {
  const messages: string[] = [];
  
  Object.entries(errors).forEach(([field, fieldErrors]) => {
    fieldErrors.forEach(error => {
      messages.push(formatErrorMessage(error, { field }));
    });
  });
  
  return messages;
}

/**
 * Success message templates
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'The {entity} has been created successfully.',
  UPDATED: 'The {entity} has been updated successfully.',
  DELETED: 'The {entity} has been deleted successfully.',
  SAVED: 'Changes have been saved successfully.',
  SENT: 'The {type} has been sent successfully.',
  UPLOADED: 'File has been uploaded successfully.',
  IMPORTED: 'Data has been imported successfully. {count} records processed.',
  EXPORTED: 'Data has been exported successfully.',
  PAYMENT_PROCESSED: 'Payment has been processed successfully.',
  EMAIL_SENT: 'Email has been sent successfully.',
  INVITATION_SENT: 'Invitation has been sent successfully.'
};

/**
 * Format success message
 */
export function formatSuccessMessage(template: string, context: Record<string, any> = {}): string {
  return formatErrorMessage(template, context);
}

// Export commonly used error creators
export const createValidationError = (field: string, message?: string) => 
  new Error(message || formatErrorMessage(ERROR_TEMPLATES.VALIDATION_REQUIRED, { field }));

export const createNotFoundError = (entity: string) => 
  new Error(formatErrorMessage(ERROR_TEMPLATES.RESOURCE_NOT_FOUND, { entity }));

export const createPermissionError = (operation: string, entity: string) => 
  new Error(formatErrorMessage(ERROR_TEMPLATES.AUTH_INSUFFICIENT_PERMISSIONS, { operation, entity }));

export default {
  ERROR_TEMPLATES,
  FRIENDLY_ERROR_MAPPINGS,
  formatErrorMessage,
  getUserFriendlyError,
  getEntityError,
  createErrorResponse,
  logError,
  formatValidationErrors,
  SUCCESS_MESSAGES,
  formatSuccessMessage
};