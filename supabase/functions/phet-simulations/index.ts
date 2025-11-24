// supabase/functions/phet-simulations/index.ts
// Supabase Edge Function to fetch and optionally filter PhET simulations metadata.
// Supports optional query params: q (search term), limit (number of results).

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { phetSimulationQuerySchema, validateAndSanitize, getSecurityHeaders } from "../_shared/validation.ts";

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/reportsheet\.com\.ng$/,
  /^https:\/\/.+\.reportsheet\.com\.ng$/,
  /^https:\/\/reportsheet\.pages\.dev$/,
  /^https:\/\/.+\.pages\.dev$/,
];

function handleCors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };
  let isAllowed = false;
  if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
    isAllowed = true;
  }
  if (req.method === "OPTIONS") {
    return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
  }
  return { response: null as Response | null, corsHeaders: headers, isAllowed };
}

const PHET_URL = "https://phet.colorado.edu/services/metadata/1.0/simulations?format=json";

const FALLBACK: any[] = [
  {
    title: "Gravity Force Lab",
    subject: "physics",
    keywords: ["gravity", "force", "mass"],
    simulations: [
      {
        id: "gravity-force-lab",
        url: "https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_en.html",
      },
    ],
  },
  {
    title: "Circuit Construction Kit: DC",
    subject: "physics",
    keywords: ["circuit", "electricity", "battery"],
    simulations: [
      {
        id: "circuit-construction-kit-dc",
        url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html",
      },
    ],
  },
  {
    title: "Forces and Motion: Basics",
    subject: "physics",
    keywords: ["forces", "motion", "friction"],
    simulations: [
      {
        id: "forces-and-motion-basics",
        url: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html",
      },
    ],
  },
  {
    title: "Energy Skate Park",
    subject: "physics",
    keywords: ["energy", "kinetic", "potential"],
    simulations: [
      {
        id: "energy-skate-park",
        url: "https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_en.html",
      },
    ],
  },
];

async function fetchPhETSims(): Promise<any[]> {
  // Try up to 2 attempts due to occasional 503s
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(PHET_URL, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (_) {
      // swallow and retry once
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return FALLBACK;
}

function matchesQuery(sim: any, q: string): boolean {
  const needle = q.toLowerCase();
  const hay = [
    sim.title || "",
    sim.subject || "",
    ...(Array.isArray(sim.keywords) ? sim.keywords : []),
    ...(Array.isArray(sim.simulations) ? sim.simulations.map((s: any) => s.id || "") : []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

serve(async (req: Request) => {
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(req);
  if (corsResponse) return corsResponse;
  if (!isAllowed) {
    const res = new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { status: 403 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (req.method !== "GET") {
    const res = new Response("Method Not Allowed", { status: 405 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  try {
    const url = new URL(req.url);
    const rawQuery = url.searchParams.get("q") || "";
    const rawLimit = url.searchParams.get("limit");
    
    // Validate query parameters
    let validatedQuery;
    try {
      validatedQuery = validateAndSanitize(phetSimulationQuerySchema, {
        q: rawQuery,
        limit: rawLimit ? Number(rawLimit) : undefined,
      });
    } catch (validationError) {
      const res = new Response(JSON.stringify({ 
        error: "Invalid query parameters", 
        details: validationError instanceof Error ? validationError.message : "Invalid parameters"
      }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      res.headers.set("Content-Type", "application/json");
      return res;
    }

    const { q, limit } = validatedQuery;
    const effectiveLimit = limit || 50; // Default to 50 if not specified

    const sims = await fetchPhETSims();
    let filtered = q ? sims.filter((s) => matchesQuery(s, q)) : sims;
    if (effectiveLimit) filtered = filtered.slice(0, effectiveLimit);

    const res = new Response(JSON.stringify(filtered), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    res.headers.set("Content-Type", "application/json");
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: "Failed to load simulations." }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
});