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

      // --- HYBRID KEY LOGIC ---
      const HARDCODED_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"; 

      const apiKey = env.API_KEY || HARDCODED_API_KEY;

      if (!env.API_KEY) {
          console.warn('--- SECURITY WARNING ---');
          console.warn('API_KEY is not configured in Cloudflare secrets. Using hardcoded fallback key.');
          console.warn('This is NOT recommended for production and exposes your API key if your code is public.');
      }
      
      if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE" || apiKey.startsWith("ey")) {
        let errorMsg = 'AI service is not configured on the server.';
        if (apiKey && apiKey.startsWith("ey")) {
          errorMsg = "Invalid Gemini API key detected in _worker.js. It looks like a Supabase key. Please use a valid Gemini key.";
        }
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
          errorMessage = 'The provided AI API key is not valid. Please ensure you have pasted the correct Gemini API key in `_worker.js`.';
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers,
      });
    }
  },
};
