/**
 * Generates text content by calling a server-side proxy endpoint.
 * This approach keeps the API key secure on the server.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text response.
 */
export const generateText = async (prompt: string): Promise<string> => {
  try {
    // This calls a serverless function (e.g., a Cloudflare Worker) that you will create.
    // This function securely holds the API key and calls the Gemini API.
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'The AI service returned an error.');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error calling AI service proxy:", error);
    // Provide a more user-friendly error message.
    return "Sorry, there was an error communicating with the AI service. Please check the server logs and try again.";
  }
};
