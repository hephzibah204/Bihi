/**
 * Centralized API helper utilities for consistent error handling and data fetching
 */

import { AppError } from './errors';

/**
 * Result type for API operations
 */
export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

/**
 * Handles API calls with consistent error handling
 * 
 * @param apiCall - The async function to execute
 * @param errorMessage - Custom error message if the call fails
 * @returns Promise with standardized result object
 * 
 * @example
 * ```ts
 * const { data, error, success } = await handleApiCall(
 *   () => apiGetStudents(),
 *   'Failed to fetch students'
 * );
 * ```
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<ApiResult<T>> {
  try {
    const data = await apiCall();
    return { data, error: null, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    console.error(errorMessage, error);
    return { data: null, error: message, success: false };
  }
}

/**
 * Handles multiple API calls in parallel with error aggregation
 * 
 * @param apiCalls - Array of async functions to execute
 * @returns Promise with results array and any errors
 * 
 * @example
 * ```ts
 * const [students, teachers, subjects] = await Promise.allSettled([
 *   () => apiGetStudents(),
 *   () => apiGetTeachers(),
 *   () => apiGetSubjects()
 * ]);
 * ```
 */
export async function handleParallelApiCalls<T extends readonly unknown[]>(
  ...apiCalls: { [K in keyof T]: () => Promise<T[K]> }
): Promise<{
  results: { [K in keyof T]: T[K] | null };
  errors: (string | null)[];
}> {
  const results = await Promise.allSettled(
    apiCalls.map(call => call())
  );

  const data = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`API call ${index} failed:`, result.reason);
    return null;
  }) as { [K in keyof T]: T[K] | null };

  const errors = results.map((result) =>
    result.status === 'rejected'
      ? result.reason?.message || 'Unknown error'
      : null
  );

  return { results: data, errors };
}

/**
 * Retries an API call with exponential backoff
 * 
 * @param apiCall - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns Promise with result
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError;
}

/**
 * Validates API response data using a schema
 * 
 * @param data - Data to validate
 * @param schema - Zod schema for validation
 * @returns Validated data or throws error
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: { parse: (data: unknown) => T }
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new AppError(
      'Invalid API response format',
      'VALIDATION_ERROR',
      400,
      error
    );
  }
}

/**
 * Creates a debounced API call function
 * 
 * @param apiCall - The async function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounceApiCall<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await apiCall(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = null;
          pendingPromise = null;
        }
      }, delay);
    });
  };
}

