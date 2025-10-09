// hooks/useAI.ts
import { useState, useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { callGeminiApi } from '../services/geminiService';
import { generateFallbackResponse } from '../services/fallbackAiService';

export type AIStatus = 'gemini' | 'fallback';
export type AIStatusChange = null | 'to_fallback_network' | 'to_fallback_error' | 'to_gemini';

export const useAI = () => {
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState<AIStatus>(isOnline ? 'gemini' : 'fallback');
  const [statusChange, setStatusChange] = useState<AIStatusChange>(null);

  useEffect(() => {
    if (isOnline && status === 'fallback') {
      setStatus('gemini');
      setStatusChange('to_gemini');
    }
    if (!isOnline && status === 'gemini') {
      setStatus('fallback');
      setStatusChange('to_fallback_network');
    }
  }, [isOnline, status]);

  const generateResponse = async ({ prompt, context = {} }: { prompt: string; context?: any }) => {
    if (status === 'gemini') {
      try {
        const fullPrompt = context.history 
            ? buildPromptWithHistory(prompt, context) 
            : prompt;
        return await callGeminiApi(fullPrompt);
      } catch (e) {
        console.error("Gemini API call failed, switching to fallback:", e);
        setStatus('fallback');
        setStatusChange('to_fallback_error'); 
        // Pass the full context to the fallback for intelligent responses
        return generateFallbackResponse({ prompt, context });
      }
    } else {
      // Pass the full context to the fallback for intelligent responses
      return generateFallbackResponse({ prompt, context });
    }
  };

  const clearStatusChange = () => setStatusChange(null);
  
  const buildPromptWithHistory = (newPrompt, context) => {
      const historyText = (context.history || []).map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');
      let fullPrompt = historyText ? `${historyText}\nUser: ${newPrompt}` : newPrompt;

      if (context.performanceContext) {
          fullPrompt = `CONTEXT:\n${context.performanceContext}\n\n---\n\n${fullPrompt}`;
      }
      return fullPrompt;
  };

  return { generateResponse, status, statusChange, clearStatusChange };
};
