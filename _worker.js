import { GoogleGenAI } from "@google/genai";

// Modern Cloudflare Pages middleware syntax
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only intercept API calls. All other requests (for the app itself)
  // are passed through to the static asset server.
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  // --- API Logic ---

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Health check endpoint
  if (url.pathname === '/api/ai/health' && request.method === 'GET') {
    const apiKey = env.API_KEY;
    if (apiKey && apiKey.startsWith('AIza')) {
      return new Response(JSON.stringify({ status: 'ok', message: 'AI service proxy is configured correctly.' }), { headers });
    } else {
      return new Response(JSON.stringify({ status: 'error', message: 'AI service is not configured. The API_KEY is missing or invalid in the server environment.' }), { status: 500, headers });
    }
  }

  // Client key endpoint
  if (url.pathname === '/api/ai/client-key' && request.method === 'GET') {
      const apiKey = env.API_KEY;
      if (apiKey) {
          return new Response(JSON.stringify({ key: apiKey }), { headers });
      } else {
          return new Response(JSON.stringify({ error: 'API_KEY is not configured on the server.' }), { status: 500, headers });
      }
  }

  // AI generation endpoint
  if (url.pathname === '/api/ai/generate' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { prompt } = body;
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400, headers });
      }

      const apiKey = env.API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'AI service is not configured on the server. The API_KEY secret is missing.' }), { status: 500, headers });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (typeof response?.text !== 'string') {
          console.error("Invalid or unexpected response structure from Gemini API:", JSON.stringify(response));
          throw new Error("Received an invalid response from the AI service.");
      }

      const text = response.text;
      return new Response(JSON.stringify({ text }), { headers });

    } catch (error) {
      console.error('Error in Gemini generate proxy:', error);
      let errorMessage = 'An internal server error occurred while contacting the AI service.';
      if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid'))) {
        errorMessage = 'The provided AI API key is not valid. Please check the API_KEY secret in your server settings.';
      } else if (error.message) {
          errorMessage = error.message;
      }
      return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers });
    }
  }
  
  // Fallback for unhandled API routes
  return new Response(JSON.stringify({ error: 'API Route Not Found' }), {
      status: 404,
      headers,
  });
}
