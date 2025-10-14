// services/supabaseClient.ts
// Smart Supabase client: supports both "publishable" and legacy "anon" keys.
// Prioritizes CDN client, then ESM fallback, then offline mode.

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
      readonly VITE_SUPABASE_ANON_KEY?: string;
    };
  }
  interface Window {
    supabase?: any;
    process?: {
      env?: {
        VITE_SUPABASE_PUBLISHABLE_KEY?: string;
        VITE_SUPABASE_ANON_KEY?: string;
      };
    };
  }
}

let supabase: any = null;

export async function initSupabase() {
  if (supabase) return supabase;

  let createClient: any;

  // 1️⃣ Prefer CDN client (AI Studio / Cloudflare)
  if (window.supabase && typeof window.supabase.createClient === "function") {
    createClient = window.supabase.createClient;
    console.info("[Supabase] Using CDN client.");
  } else {
    console.warn("[Supabase] CDN not found. Trying ESM fallback...");
    try {
      const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      createClient = mod.createClient;
      console.info("[Supabase] Loaded client via ESM fallback.");
    } catch (err) {
      console.error("[Supabase] Failed to load Supabase library:", err);
    }
  }

  // 2️⃣ Fixed project URL
  const SUPABASE_URL = "https://shzwolantavauszuxwlp.supabase.co";

  // 3️⃣ Key detection logic (publishable preferred)
  const SUPABASE_KEY =
    window.process?.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    window.process?.env?.VITE_SUPABASE_ANON_KEY ||
    import.meta.env?.VITE_SUPABASE_ANON_KEY ||
    "<MISSING_KEY>";

  const keySource = SUPABASE_KEY.includes("publishable_")
    ? "publishable"
    : SUPABASE_KEY.includes("anon")
    ? "anon"
    : "unknown";

  console.log(`[Supabase] URL: ${SUPABASE_URL}`);
  console.log(`[Supabase] Key type detected: ${keySource}`);
  console.log(
    "[Supabase] Key:",
    SUPABASE_KEY !== "<MISSING_KEY>" ? "✅ Present" : "❌ Missing"
  );

  // 4️⃣ Offline fallback
  if (!SUPABASE_KEY || !createClient || SUPABASE_KEY === "<MISSING_KEY>") {
    console.error("[Supabase] Missing publishable/anon key or client. Running in offline mode.");
    supabase = { _offline: true };
    return supabase;
  }

  // 5️⃣ Create client
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  supabase._offline = false;
  console.info(`[Supabase] Client initialized successfully using ${keySource} key.`);
  return supabase;
}

// Get initialized client safely
export function getSupabase() {
  if (!supabase)
    throw new Error("Supabase not initialized. Call await initSupabase() first.");
  return supabase;
}

// Optional: test connectivity
export async function isSupabaseOnline() {
  if (!supabase || supabase._offline) return false;
  try {
    const { data, error } = await supabase.from("platform_settings").select("id").limit(1);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export { supabase };