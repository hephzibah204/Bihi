// utils/retry.ts
// Retry logic with exponential backoff for resilient operations

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeouts, and server errors (5xx)
    const errorMessage = error?.message?.toLowerCase() || '';
    const status = error?.status || error?.code;
    
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      (typeof status === 'number' && status >= 500) ||
      status === 'PGRST301' || // Supabase connection error
      status === 'ECONNRESET' ||
      status === 'ETIMEDOUT'
    );
  },
  onRetry: (attempt, error, delay) => {
    logger.warn('[Retry] Operation will retry', { attempt, message: error?.message || String(error), delay });
  },
};

/**
 * Executes an async operation with exponential backoff retry logic
 * @param operation The async function to execute
 * @param options Retry configuration options
 * @returns Promise resolving to the operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted retries or error is not retryable
      if (attempt === config.maxRetries || !config.shouldRetry(error)) {
        throw error;
      }

      // Call retry callback
      config.onRetry(attempt + 1, error, delay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff with jitter (50% of delay)
      const jitter = delay * 0.5 * Math.random();
      delay = Math.min(delay * 2 + jitter, config.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Creates a retryable version of an async function
 * @param fn The async function to make retryable
 * @param options Retry configuration options
 * @returns A new function with retry logic applied
 */
export function makeRetryable<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}
