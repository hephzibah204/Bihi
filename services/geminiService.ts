import { supabase } from './supabaseClient';

/**
 * Generates text content by sending a prompt to a secure, server-side proxy
 * which then calls the Gemini API.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text response.
 */
export const generateText = async (prompt: string): Promise<string> => {
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
    throw new Error(`Failed to get a response from the AI service. ${error.message}`);
  }
};