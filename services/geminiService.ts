// services/geminiService.ts
// Back-compat shim that re-exports tolerant AI functions
export { generateResponse, generateReport, generateAnnouncement, generateLessonPlan, normalizePrompt } from './geminiAIService';

import { supabase } from './supabaseClient';
import { getTenantId } from './api';
import { getAIResponseCache } from './aiResponseCache';

/**
 * Generates text content by sending a prompt to a secure, server-side proxy
 * which then calls the Gemini API. This is the primary online generation function.
 * @param prompt The text prompt to send to the model or options object
 * @param context Additional context (deprecated, use prompt only)
 * @returns The generated text response.
 */
export const callGeminiApi = async (prompt: string | { prompt: string }, context?: string): Promise<string> => {
  // Handle both old object format and new string format
  const actualPrompt = typeof prompt === 'string' ? prompt : prompt.prompt;
  
  // Try to get cached response first
  const cache = getAIResponseCache();
  const cached = cache.getCachedResponse(actualPrompt, context);
  
  if (cached && cached.source === 'gemini') {
    console.log('✅ Returning cached Gemini response (Cache hit)');
    return cached.response;
  }
  
  try {
    if (!supabase) {
        throw new Error("Authentication service is not available.");
    }

    const { data: { session } } = await supabase.auth.getSession();
    const isDemo = sessionStorage.getItem('isDemoMode') === 'true';

    if (!session && !isDemo) {
        throw new Error("User not authenticated.");
    }
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    
    // Prioritize demo mode check to prevent lingering sessions from interfering.
    if (isDemo) {
        headers['X-Demo-Mode'] = 'true';
    } else if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Get tenant context for API key resolution
    const tenantId = getTenantId();
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ prompt: actualPrompt, tenantId }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with status: ${response.status}`;

        if (errorText) {
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorText;
            } catch (e) {
                errorMessage = errorText;
            }
        }
        
        throw new Error(errorMessage);
    }

    // The backend returns Server-Sent Events (text/event-stream). Parse and concatenate.
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.substring(6);
                    if (jsonString.trim() === '[DONE]') continue;
                    try {
                        const chunk = JSON.parse(jsonString);
                        const textChunk = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textChunk) fullText += textChunk;
                    } catch (e) {
                        // If parsing fails, ignore this chunk and continue
                        console.warn('SSE chunk parse error:', e);
                    }
                }
            }
        }
        
        // Cache the successful Gemini response
        if (fullText) {
            cache.cacheResponse(actualPrompt, fullText, 'gemini', context);
            console.log('📦 Cached Gemini response for future use');
        }
        
        return fullText;
    }

    // Fallback: try to parse as JSON if not streaming
    try {
        const data = await response.json();
        // Support both {text} and raw Gemini JSON structures
        const text = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Cache the successful Gemini response
        if (text) {
            cache.cacheResponse(actualPrompt, text, 'gemini', context);
            console.log('📦 Cached Gemini response for future use');
        }
        
        return text;
    } catch (e) {
        const text = await response.text();
        
        // Cache even raw text responses
        if (text) {
            cache.cacheResponse(actualPrompt, text, 'gemini', context);
        }
        
        return text; // As a last resort, return raw text
    }
    
  } catch (error) {
    console.error("Error calling the AI proxy service:", error);
    // Rethrow a more user-friendly and specific error for the useAI hook to catch.
    if (error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Could not reach AI service.');
    }
    throw new Error(`The AI service is currently unavailable. ${error.message}`);
  }
};


/**
 * Generates text content in a stream by sending a prompt to a secure, server-side proxy.
 * @param prompt The text prompt to send to the model or options object.
 * @param onChunk A callback function that receives chunks of text as they are generated.
 * @returns A promise that resolves when the stream is complete.
 */
export const callGeminiApiStream = async (prompt: string | { prompt: string }, onChunk: (chunk: string) => void): Promise<void> => {
  // Handle both old object format and new string format
  const actualPrompt = typeof prompt === 'string' ? prompt : prompt.prompt;
  try {
    if (!supabase) {
        throw new Error("Authentication service is not available.");
    }

    const { data: { session } } = await supabase.auth.getSession();
    const isDemo = sessionStorage.getItem('isDemoMode') === 'true';

    if (!session && !isDemo) {
        throw new Error("User not authenticated.");
    }
    
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    if (isDemo) {
        headers['X-Demo-Mode'] = 'true';
    } else if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Get tenant context for API key resolution
    const tenantId = getTenantId();
    
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ prompt: actualPrompt, tenantId }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with status: ${response.status}`;
        try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.error || errorText; } catch (e) { errorMessage = errorText; }
        throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Streaming response not supported by the browser.");
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonString = line.substring(6);
                if (jsonString.trim() === '[DONE]') continue;
                try {
                    const data = JSON.parse(jsonString);
                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textChunk) {
                        onChunk(textChunk);
                    }
                } catch (e) {
                    console.error("Error parsing streaming JSON chunk:", e, jsonString);
                }
            }
        }
    }

  } catch (error) {
    console.error("Error calling the AI proxy service (stream):", error);
    if (error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Could not reach AI service.');
    }
    throw new Error(`The AI service is currently unavailable. ${error.message}`);
  }
};

/**
 * @deprecated This function is now a wrapper for `callGeminiApi`.
 * New components should use the `useAI` hook for robust error handling and fallback capabilities.
 */
export const generateText = async (prompt: string): Promise<string> => {
    return callGeminiApi(prompt);
};