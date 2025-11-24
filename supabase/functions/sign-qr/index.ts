// Supabase Edge Function: /functions/v1/sign-qr
// Signs an RS1 core payload using HMAC SHA-256 with a server-side secret.
// Request: POST { core: string }
// Response: { signature: string }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { qrSigningSchema, validateAndSanitize, getSecurityHeaders } from "../_shared/validation.ts";

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa expects Latin1; Uint8Array conversion is fine for raw bytes
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
  const securityHeaders = getSecurityHeaders();
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...securityHeaders,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        ...securityHeaders 
      },
    });
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*",
          ...securityHeaders 
        },
      });
    }

    // Validate and sanitize input using Zod schema
    let validatedInput;
    try {
      validatedInput = validateAndSanitize(qrSigningSchema, body);
    } catch (validationError) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        details: validationError instanceof Error ? validationError.message : "Invalid input data"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*",
          ...securityHeaders 
        },
      });
    }

    const { core } = validatedInput;
    const secret = Deno.env.get("SIGNING_SECRET");
    if (!secret) {
      return new Response(JSON.stringify({ error: "SIGNING_SECRET not configured" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*",
          ...securityHeaders 
        },
      });
    }

    // Sign the core payload with HMAC SHA-256
    const signature = await hmacSha256(core + "|" + secret, secret);
    return new Response(JSON.stringify({ signature }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        ...securityHeaders 
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        ...securityHeaders 
      },
    });
  }
});