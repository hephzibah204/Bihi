import { GoogleGenAI } from "@google/genai";

// IMPORTANT: API_KEY is sourced from environment variables.
// Do not hardcode the API key in the code.
const apiKey = process.env.API_KEY;

let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

/**
 * Generates text content using the Gemini Flash model.
 * @param prompt The text prompt to send to the model.
 * @returns The generated text response.
 */
// Fix: Added explicit types for the function parameters and return value for better type safety.
export const generateText = async (prompt: string): Promise<string> => {
  if (!ai) {
    return "AI features are disabled because the API key is not configured.";
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    return "Sorry, there was an error communicating with the AI. Please try again later.";
  }
};