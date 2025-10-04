// functions/_middleware.js

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only catch API calls
  if (!url.pathname.startsWith("/api/")) {
    return next();
  }

  // Common headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Handle preflight CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // --- Health check ---
  if (url.pathname === "/api/ai/health" && request.method === "GET") {
    if (env.API_KEY && env.API_KEY.startsWith("AIza")) {
      return new Response(
        JSON.stringify({ status: "ok", message: "API_KEY is set." }),
        { headers }
      );
    }
    return new Response(
      JSON.stringify({
        status: "error",
        message:
          "API_KEY not found. Please set it in Cloudflare Pages → Settings → Environment Variables.",
      }),
      { status: 500, headers }
    );
  }

  // --- Client-side key provider for Live API ---
  // This is kept to ensure the AI Academic Tutor feature continues to work.
  if (url.pathname === "/api/ai/client-key" && request.method === "GET") {
    if (env.API_KEY) {
      return new Response(
        JSON.stringify({ key: env.API_KEY }),
        { headers }
      );
    }
    return new Response(
      JSON.stringify({ error: "API_KEY not found in Cloudflare env" }),
      { status: 500, headers }
    );
  }

  // --- AI Generate ---
  if (url.pathname === "/api/ai/generate") {
    // Requirement: Handle only POST requests.
    if (request.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method Not Allowed" }),
            { status: 405, headers }
        );
    }

    try {
      const body = await request.json();
      const { prompt } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "Prompt is required." }),
          { status: 400, headers }
        );
      }

      const apiKey = env.API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API_KEY is missing on server." }),
          { status: 500, headers }
        );
      }

      // Call Google AI API - using gemini-2.5-flash as per guidelines
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        let details = errText;
        try {
            details = JSON.parse(errText);
        } catch(e) { /* Not JSON, use raw text */ }
        
        return new Response(
          JSON.stringify({
            error: "Gemini API error",
            status: aiRes.status,
            details: details,
          }),
          { status: aiRes.status, headers }
        );
      }

      const data = await aiRes.json();
      
      // Extract text as per REST API response structure
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        "⚠️ No response text received.";

      return new Response(JSON.stringify({ text }), { headers });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          details: err.message,
        }),
        { status: 500, headers }
      );
    }
  }

  // --- Fallback ---
  return new Response(
    JSON.stringify({ error: "API route not found." }),
    { status: 404, headers }
  );
}