// This is the server-side code for a Cloudflare Worker.
// It acts as a secure proxy for your frontend to call the Gemini API.
import { GoogleGenAI } from "@google/genai";

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests (for cross-domain communication)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*', // In production, restrict this to your app's domain
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Restrict this in production
    };

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers,
      });
    }

    try {
      const body = await request.json();
      const { prompt } = body;

      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
          headers,
        });
      }

      // --- Use environment variable for API key ---
      const apiKey = env.API_KEY;
      
      if (!apiKey) {
        let errorMsg = 'AI service is not configured on the server. The API_KEY secret is missing.';
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: 500,
          headers,
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text;

      return new Response(JSON.stringify({ text }), {
        headers,
      });

    } catch (error) {
      console.error('Error in Cloudflare Worker:', error);
      let errorMessage = 'An internal server error occurred while contacting the AI service.';
      if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid'))) {
          errorMessage = 'The provided AI API key is not valid. Please check the API_KEY secret in your Cloudflare Worker settings.';
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers,
      });
    }
  },
};
