// supabase/functions/sync-ai-simulations/index.ts
// Supabase Edge Function: fetch PhET simulations and upsert into ai_simulations.
// Supports manual triggering and can be used for nightly scheduled refresh.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/reportsheet\.com\.ng$/,
  /^https:\/\/.+\.reportsheet\.com\.ng$/,
  /^https:\/\/reportsheet\.pages\.dev$/,
  /^https:\/\/.+\.pages\.dev$/,
  /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/,
  /^https:\/\/.+\.googleusercontent\.com$/,
  /^https:\/\/.+\.web\.app$/,
  /^https:\/\/.*\.google\.internal$/,
];

function handleCors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

type SourceSim = {
  id: string;
  title?: string;
  name?: string;
  subject?: string;
  description?: string;
  keywords?: string[];
  url?: string;
  image_url?: string;
  languages?: string[];
};

type AiSimRow = {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  keywords: string[] | null;
  url: string | null;
  image_url: string | null;
  languages: string[] | null;
  provider: string;
  updated_at: string;
};

function normalizeSim(sim: SourceSim): AiSimRow | null {
  const id = sim.id?.trim();
  if (!id) return null;
  const title = (sim.title || sim.name || '').trim();
  const now = new Date().toISOString();
  return {
    id,
    title,
    subject: sim.subject || null,
    description: sim.description || null,
    keywords: sim.keywords || null,
    url: sim.url || null,
    image_url: sim.image_url || null,
    languages: sim.languages || null,
    provider: 'PhET',
    updated_at: now,
  };
}

async function fetchSourceList(sourceUrl: string): Promise<SourceSim[]> {
  const res = await fetch(sourceUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Source fetch failed: ${res.status}`);
  const json = await res.json();
  // Support simple array or object-wrapped arrays
  if (Array.isArray(json)) return json as SourceSim[];
  if (Array.isArray((json as any).data)) return (json as any).data as SourceSim[];
  if (Array.isArray((json as any).results)) return (json as any).results as SourceSim[];
  // PhET official feed structure mapping (best-effort)
  if (Array.isArray((json as any).simulations)) {
    const sims = (json as any).simulations as any[];
    return sims.map((s) => ({
      id: (s?.name || s?.id || '').toLowerCase().replace(/\s+/g, '-'),
      title: s?.title || s?.name || '',
      subject: s?.category || s?.subjects?.[0] || null,
      description: s?.description || null,
      keywords: Array.isArray(s?.keywords) ? s.keywords : null,
      url: s?.links?.sim?.en || s?.simUrl || null,
      image_url: s?.screenshot || s?.thumbnail || null,
      languages: Array.isArray(s?.locales) ? s.locales : null,
    }));
  }
  // Fallback: unknown shape
  return [];
}

serve(async (req: Request) => {
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(req);
  if (corsResponse) return corsResponse;
  if (!isAllowed) {
    const res = new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { status: 403 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  if (req.method !== "GET" && req.method !== "POST") {
    const res = new Response("Method Not Allowed", { status: 405 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const env = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    AI_SIMULATIONS_FUNCTION_URL: Deno.env.get("AI_SIMULATIONS_FUNCTION_URL"),
  };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    const res = new Response(JSON.stringify({ error: "Server not configured (Supabase URL/Service Key missing)." }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const sourceOverride = url.searchParams.get('source');
    const limit = Math.max(1, Math.min(1000, Number(limitParam) || 500));

    // Default to the provided ai_simulations function URL if available, otherwise PhET official feed
    const defaultSource = env.AI_SIMULATIONS_FUNCTION_URL
      ? `${env.AI_SIMULATIONS_FUNCTION_URL}?limit=${limit}`
      : `https://phet.colorado.edu/services/metadata/1.6/simulations?format=json`;
    let sourceUrl = defaultSource;
    if (sourceOverride && sourceOverride.trim()) {
      try {
        const candidate = new URL(sourceOverride.trim());
        const allowedHosts = new Set<string>();
        allowedHosts.add('phet.colorado.edu');
        if (env.AI_SIMULATIONS_FUNCTION_URL) {
          try { allowedHosts.add(new URL(env.AI_SIMULATIONS_FUNCTION_URL).hostname); } catch {}
        }
        if (candidate.protocol === 'https:' && allowedHosts.has(candidate.hostname)) {
          sourceUrl = candidate.toString();
        }
      } catch {}
    }
    const rawList = await fetchSourceList(sourceUrl);
    const normalized = rawList
      .map(normalizeSim)
      .filter((s): s is AiSimRow => !!s && !!s.id && !!s.title);

    if (normalized.length === 0) {
      const res = new Response(JSON.stringify({ message: "No simulations fetched from source.", source: sourceUrl }), { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Upsert via PostgREST
    const upsertUrl = `${env.SUPABASE_URL}/rest/v1/ai_simulations?on_conflict=id`;
    const upsertRes = await fetch(upsertUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(normalized),
    });

    if (!upsertRes.ok) {
      const text = await upsertRes.text();
      throw new Error(`Upsert failed: ${upsertRes.status} ${text}`);
    }

    const resultCount = normalized.length;
    const res = new Response(JSON.stringify({
      message: 'Simulations synced',
      source: sourceUrl,
      upserted: resultCount,
    }), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: (err as any)?.message || 'Unknown error' }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
});