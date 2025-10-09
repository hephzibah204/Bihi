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
 * @deprecated This function is now a wrapper for `callGeminiApi`.
 * New components should use the `useAI` hook for robust error handling and fallback capabilities.
 */
export const generateText = async (prompt: string): Promise<string> => {
    return callGeminiApi(prompt);
};
