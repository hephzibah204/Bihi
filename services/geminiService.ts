/**
 * Generates text content by sending a prompt to a secure, server-side proxy
 * which then calls the Gemini API.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text response.
 */
export const generateText = async (prompt: string): Promise<string> => {
  try {
    // This endpoint is intercepted by the Cloudflare Worker (_worker.js)
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
    
  } catch (error) {
    console.error("Error calling the AI proxy service:", error);
    // Re-throw a user-friendly message that can be caught by UI components
    throw new Error(`Failed to get a response from the AI service. ${error.message}`);
  }
};
