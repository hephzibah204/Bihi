// Supabase Edge Function: /functions/v1/verify-qr
// Verifies RS1 payload signature using HMAC SHA-256 with a server-side secret.
// Request: POST { core: string, signature: string }
// Response: { valid: boolean }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/reportsheet\.com\.ng$/,
  /^https:\/\/.+\.reportsheet\.com\.ng$/,
  /^https:\/\/reportsheet\.pages\.dev$/,
  /^https:\/\/.+\.pages\.dev$/,
];

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // @ts-expect-error Deno env has btoa
  return btoa(binary);
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64FromBytes(new Uint8Array(signature));
}

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const corsHeaders: Record<string,string> = {
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { core, signature } = await req.json();
    if (!core || typeof core !== "string" || !core.startsWith("RS1|")) {
      return new Response(JSON.stringify({ error: "Invalid core payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!signature || typeof signature !== "string") {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const secret = Deno.env.get("SIGNING_SECRET");
    if (!secret) {
      return new Response(JSON.stringify({ error: "SIGNING_SECRET not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const expected = await hmacSha256(core + "|" + secret, secret);
    const valid = signature === expected;
    return new Response(JSON.stringify({ valid }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});