
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
    if (!session) {
        throw new Error("User not authenticated.");
    }

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        // The response is an error. We need to handle it gracefully.
        // The body could be JSON, text, or empty.
        const errorText = await response.text();
        let errorMessage = `Server responded with status: ${response.status}`;

        if (errorText) {
            try {
                // See if the error text is actually our expected JSON format
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorText;
            } catch (e) {
                // If parsing fails, it's not JSON. Use the raw text.
                errorMessage = errorText;
            }
        }
        
        throw new Error(errorMessage);
    }

    const data = await response.json();
    // The Gemini API response structure was updated in the proxy.
    return data.text;
    
  } catch (error) {
    console.error("Error calling the AI proxy service:", error);
    // Re-throw a user-friendly message that can be caught by UI components
    throw new Error(`Failed to get a response from the AI service. ${error.message}`);
  }
};
