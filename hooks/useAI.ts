// hooks/useAI.ts
import { useState, useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { callGeminiApi, callGeminiApiStream } from '../services/geminiService';
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
        return generateFallbackResponse({ prompt, context });
      }
    } else {
      return generateFallbackResponse({ prompt, context });
    }
  };

  const generateResponseStream = async ({ prompt, context = {}, onChunk }: { prompt: string; context?: any; onChunk: (chunk: string) => void; }) => {
    if (status === 'gemini') {
        try {
            const fullPrompt = context.history
                ? buildPromptWithHistory(prompt, context)
                : prompt;
            await callGeminiApiStream(fullPrompt, onChunk);
        } catch (e) {
            console.error("Gemini API stream call failed, switching to fallback:", e);
            setStatus('fallback');
            setStatusChange('to_fallback_error');
            const fallbackResponse = generateFallbackResponse({ prompt, context });
            onChunk(fallbackResponse); // Send the full fallback response in one chunk
            throw e; // Re-throw so the UI can also handle the error state
        }
    } else {
        const fallbackResponse = generateFallbackResponse({ prompt, context });
        onChunk(fallbackResponse);
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

  return { generateResponse, generateResponseStream, status, statusChange, clearStatusChange };
};