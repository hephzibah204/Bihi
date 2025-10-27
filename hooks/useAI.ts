import { useState, useCallback } from 'react';
import { callGeminiApi } from '../services/geminiService';
import { generateFallbackResponse } from '../services/fallbackAiService';
import { logger } from '../utils/logger';

export interface AIResponse {
  content: string;
  isOnline: boolean;
  error?: string;
  fallbackReason?: string;
  notification?: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  };
}

export interface AINotificationCallback {
  (notification: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  }): void;
}

export const useAI = (onNotification?: AINotificationCallback) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const showNotification = useCallback((notification: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  }) => {
    if (onNotification) {
      onNotification(notification);
    }
  }, [onNotification]);

  const generateResponse = useCallback(async (
    prompt: string,
    context?: string,
    type?: string
  ): Promise<AIResponse> => {
    setIsLoading(true);
    
    try {
      // Try Gemini API first if online
      if (isOnline) {
        try {
          const response = await callGeminiApi(prompt, context);
          setIsLoading(false);
          return {
            content: response,
            isOnline: true
          };
        } catch (error) {
          logger.captureError(error as any, 'Gemini API failed, falling back to local AI');
          
          // Determine fallback reason
          let fallbackReason = 'API service unavailable';
          let notificationMessage = 'The AI service is temporarily unavailable. Using offline AI with limited capabilities.';
          
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              fallbackReason = 'Network connectivity issues';
              notificationMessage = 'Network connection issues detected. Switching to offline AI mode.';
            } else if (error.message.includes('quota') || error.message.includes('limit')) {
              fallbackReason = 'API quota exceeded';
              notificationMessage = 'AI service quota exceeded. Using offline AI until quota resets.';
            } else if (error.message.includes('auth') || error.message.includes('key')) {
              fallbackReason = 'Authentication error';
              notificationMessage = 'AI service authentication failed. Using offline AI mode.';
            }
          }
          
          // Show notification about fallback
          showNotification({
            type: 'warning',
            title: 'Switched to Offline AI',
            message: `${notificationMessage} Results may be less comprehensive than our premium AI service.`
          });
          
          // Fall through to fallback with reason
          const fallbackResponse = generateFallbackResponse(prompt, context || type, type);
          setIsLoading(false);
          setIsOnline(false);
          
          return {
            content: fallbackResponse,
            isOnline: false,
            fallbackReason,
            notification: {
              type: 'warning',
              title: 'Offline AI Active',
              message: `Using in-house AI due to: ${fallbackReason}. Responses may be more basic.`
            }
          };
        }
      } else {
        // Offline mode notification
        showNotification({
          type: 'info',
          title: 'Offline Mode',
          message: 'No internet connection detected. Using offline AI with basic responses.'
        });
      }
      
      // Use fallback AI service
      const fallbackResponse = generateFallbackResponse(prompt, context || type, type);
      setIsLoading(false);
      setIsOnline(false);
      
      return {
        content: fallbackResponse,
        isOnline: false,
        fallbackReason: isOnline ? 'API service failed' : 'No internet connection',
        notification: {
          type: 'info',
          title: 'Offline AI Active',
          message: 'Using in-house AI. Responses are more basic but still helpful for common tasks.'
        }
      };
    } catch (error) {
      setIsLoading(false);
      
      showNotification({
        type: 'error',
        title: 'AI Service Error',
        message: 'Both online and offline AI services encountered errors. Please try again.'
      });
      
      return {
        content: 'Sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.',
        isOnline: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notification: {
          type: 'error',
          title: 'Service Error',
          message: 'AI services are temporarily unavailable.'
        }
      };
    }
  }, [isOnline, showNotification]);

  const generateResponseStream = useCallback(async ({
    prompt,
    context,
    type,
    onChunk
  }: {
    prompt: string;
    context?: string;
    type?: string;
    onChunk: (chunk: string) => void;
  }): Promise<void> => {
    setIsLoading(true);
    
    try {
      // For now, we'll simulate streaming by getting the full response and chunking it
      // In a real implementation, you'd want to use actual streaming APIs
      const response = await generateResponse(prompt, context, type);
      
      // Check if the response contains an error
      if (response.error || response.content.includes('Sorry, I encountered an error')) {
        setIsLoading(false);
        
        // Provide a more helpful error message based on the context
        let errorMessage = 'I apologize, but I\'m having trouble processing your request right now. ';
        
        if (!isOnline) {
          errorMessage += 'I\'m currently in offline mode with limited capabilities. Please check your internet connection for the full AI experience.';
        } else if (response.fallbackReason) {
          errorMessage += `I'm using offline mode because: ${response.fallbackReason}. The response may be more basic than usual.`;
        } else {
          errorMessage += 'Please try rephrasing your question or try again in a moment.';
        }
        
        onChunk(errorMessage);
        
        showNotification({
          type: 'warning',
          title: isOnline ? 'AI Service Issue' : 'Offline Mode',
          message: isOnline ? 'AI service temporarily unavailable. Using offline mode.' : 'Limited AI capabilities in offline mode.'
        });
        
        return;
      }
      
      // Simulate streaming by sending chunks of the response
      const text = response.content;
      const chunkSize = 10; // Characters per chunk
      
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        onChunk(chunk);
        
        // Add a small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      
      const errorMessage = isOnline 
        ? 'I\'m experiencing technical difficulties. Please try again in a moment or check your internet connection.'
        : 'I\'m in offline mode with limited capabilities. Please connect to the internet for the full AI experience.';
      
      onChunk(errorMessage);
      
      showNotification({
        type: 'error',
        title: 'AI Service Error',
        message: 'Failed to generate response. Please try again.'
      });
      
      logger.captureError(error as any, 'AI Streaming Error');
    }
  }, [generateResponse, showNotification, isOnline]);

  return {
    generateResponse,
    generateResponseStream,
    isLoading,
    isOnline,
    status: isLoading ? 'loading' : 'idle'
  };
};