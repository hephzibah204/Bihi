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
      // 1. Try to get the key from Cloudflare secrets (SECURE METHOD)
      // 2. If not found, use the hardcoded key (INSECURE FALLBACK)

      // WARNING: THIS IS AN INSECURE FALLBACK. DO NOT USE IN PRODUCTION.
      const HARDCODED_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"; 

      const apiKey = env.API_KEY || HARDCODED_API_KEY;

      if (!env.API_KEY) {
          console.warn('--- SECURITY WARNING ---');
          console.warn('API_KEY is not configured in Cloudflare secrets. Using hardcoded fallback key.');
          console.warn('This is NOT recommended for production and exposes your API key if your code is public.');
      }
      
      if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
        console.error('API_KEY is not configured in Cloudflare secrets and no hardcoded key is provided.');
        return new Response(JSON.stringify({ error: 'AI service is not configured on the server.' }), {
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
      return new Response(JSON.stringify({ error: 'An internal server error occurred while contacting the AI service.' }), {
        status: 500,
        headers,
      });
    }
  },
};