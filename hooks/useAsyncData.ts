/**
 * Reusable hook for async data fetching with loading and error states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { handleApiCall, ApiResult } from '../utils/apiHelpers';

export interface UseAsyncDataOptions<T> {
  /**
   * Function that returns a promise with the data
   */
  fetchFn: () => Promise<T>;
  
  /**
   * Dependencies array for useEffect (default: [])
   */
  deps?: React.DependencyList;
  
  /**
   * Whether to fetch immediately on mount (default: true)
   */
  immediate?: boolean;
  
  /**
   * Custom error message
   */
  errorMessage?: string;
  
  /**
   * Initial data value
   */
  initialData?: T | null;
}

export interface UseAsyncDataReturn<T> {
  /**
   * The fetched data (null if not loaded or error occurred)
   */
  data: T | null;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Error message (null if no error)
   */
  error: string | null;
  
  /**
   * Whether the fetch was successful
   */
  success: boolean;
  
  /**
   * Manually trigger a refetch
   */
  refetch: () => Promise<void>;
  
  /**
   * Reset to initial state
   */
  reset: () => void;
}

/**
 * Hook for fetching async data with automatic loading and error handling
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useAsyncData({
 *   fetchFn: () => apiGetStudents(),
 *   errorMessage: 'Failed to load students',
 *   deps: [selectedClass]
 * });
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * return <StudentList students={data} />;
 * ```
 */
export function useAsyncData<T>(
  options: UseAsyncDataOptions<T>
): UseAsyncDataReturn<T> {
  const {
    fetchFn,
    deps = [],
    immediate = true,
    errorMessage = 'Failed to fetch data',
    initialData = null,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await handleApiCall(fetchFn, errorMessage);

    if (!isMountedRef.current) return;

    setData(result.data);
    setError(result.error);
    setSuccess(result.success);
    setLoading(false);
  }, [fetchFn, errorMessage]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, [initialData]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (immediate) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, deps);

  return {
    data,
    loading,
    error,
    success,
    refetch,
    reset,
  };
}

/**
 * Hook for fetching multiple async data sources in parallel
 * 
 * @example
 * ```tsx
 * const { data, loading, error } = useParallelData({
 *   fetchFns: {
 *     students: () => apiGetStudents(),
 *     teachers: () => apiGetTeachers(),
 *     subjects: () => apiGetSubjects(),
 *   }
 * });
 * ```
 */
export function useParallelData<T extends Record<string, () => Promise<any>>>(
  options: {
    fetchFns: T;
    deps?: React.DependencyList;
    immediate?: boolean;
  }
) {
  const { fetchFns, deps = [], immediate = true } = options;

  type DataType = {
    [K in keyof T]: Awaited<ReturnType<T[K]>> | null;
  };

  const [data, setData] = useState<DataType>({} as DataType);
  const [loading, setLoading] = useState(immediate);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  useEffect(() => {
    if (!immediate) return;

    setLoading(true);
    setErrors({});

    const fetchAll = async () => {
      const entries = await Promise.allSettled(
        Object.entries(fetchFns).map(async ([key, fn]) => {
          const result = await handleApiCall(fn, `Failed to fetch ${key}`);
          return [key, result] as const;
        })
      );

      const newData = {} as DataType;
      const newErrors = {} as Partial<Record<keyof T, string>>;

      entries.forEach((entry) => {
        if (entry.status === 'fulfilled') {
          const [key, result] = entry.value;
          if (result.success && result.data) {
            newData[key as keyof T] = result.data;
          } else {
            newErrors[key as keyof T] = result.error || 'Unknown error';
          }
        }
      });

      setData(newData);
      setErrors(newErrors);
      setLoading(false);
    };

    fetchAll();
  }, deps);

  return {
    data,
    loading,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
}

