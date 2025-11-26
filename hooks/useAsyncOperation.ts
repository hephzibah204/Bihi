import { useState, useCallback } from 'react';
import { getUserFriendlyError } from '../utils/errorMessages';

interface UseAsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  showSuccessMessage?: boolean;
}

interface AsyncOperationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useAsyncOperation = (options: UseAsyncOperationOptions = {}) => {
  const [state, setState] = useState<AsyncOperationState>({
    loading: false,
    error: null,
    success: false
  });

  const execute = useCallback(async (operation: () => Promise<any>) => {
    setState({ loading: true, error: null, success: false });
    
    try {
      const result = await operation();
      setState({ loading: false, error: null, success: true });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options.showSuccessMessage) {
        // Dispatch success notification
        window.dispatchEvent(new CustomEvent('show-global-success', {
          detail: { message: 'Operation completed successfully' }
        }));
      }
      
      return result;
    } catch (error) {
      const friendlyError = getUserFriendlyError(error);
      setState({ loading: false, error: friendlyError.message, success: false });
      
      if (options.onError) {
        options.onError(error);
      }
      
      // Dispatch error notification
      window.dispatchEvent(new CustomEvent('show-global-error', {
        detail: { 
          title: friendlyError.title,
          message: friendlyError.message 
        }
      }));
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

export default useAsyncOperation;
