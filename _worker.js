import { GoogleGenerativeAI } from "@google/genai";

// Cloudflare Pages Function (middleware style)
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only handle API routes
  if (!url.pathname.startsWith("/api/")) {
    return next();
  }

  // Common headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Health check
  if (url.pathname === "/api/ai/health" && request.method === "GET") {
    if (env.API_KEY && env.API_KEY.startsWith("AIza")) {
      return new Response(
        JSON.stringify({ status: "ok", message: "AI service is configured" }),
        { headers }
      );
    }
    return new Response(
      JSON.stringify({ status: "error", message: "API_KEY not found in Cloudflare env" }),
      { status: 500, headers }
    );
  }

  // Generate text
  if (url.pathname === "/api/ai/generate" && request.method === "POST") {
    try {
      const body = await request.json();
      const { prompt } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "Prompt is required" }),
          { status: 400, headers }
        );
      }

      if (!env.API_KEY) {
        return new Response(
          JSON.stringify({ error: "API_KEY is missing from Cloudflare env" }),
          { status: 500, headers }
        );
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(env.API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return new Response(JSON.stringify({ text }), { headers });
    } catch (err) {
      console.error("Gemini error:", err);
      return new Response(
        JSON.stringify({ error: err.message || "Internal AI error" }),
        { status: 500, headers }
      );
    }
  }

  // Fallback
  return new Response(
    JSON.stringify({ error: "API Route Not Found" }),
    { status: 404, headers }
  );
}
