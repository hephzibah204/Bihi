import { supabase } from './supabaseClient';

/**
 * Generates text content by sending a prompt to a secure, server-side proxy
 * which then calls the Gemini API. This is the primary online generation function.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text response.
 */
export const callGeminiApi = async (prompt: string): Promise<string> => {
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

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ prompt }),
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

    const data = await response.json();
    return data.text;
    
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
 * @param prompt The text prompt to send to the model.
 * @param onChunk A callback function that receives chunks of text as they are generated.
 * @returns A promise that resolves when the stream is complete.
 */
export const callGeminiApiStream = async (prompt: string, onChunk: (chunk: string) => void): Promise<void> => {
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

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ prompt }),
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