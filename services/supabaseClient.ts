// services/supabaseClient.ts
// Smart Supabase client: supports both "publishable" and legacy "anon" keys.
// Prioritizes CDN client, then ESM fallback, then offline mode.

import { getSupabaseEnv, getKeyType } from '../utils/env';
import { withRetry } from '../utils/retry';

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
      readonly VITE_SUPABASE_ANON_KEY?: string;
      readonly VITE_SUPABASE_URL?: string;
    };
  }
  interface Window {
    supabase?: any;
    process?: {
      env?: {
        VITE_SUPABASE_PUBLISHABLE_KEY?: string;
        VITE_SUPABASE_ANON_KEY?: string;
        VITE_SUPABASE_URL?: string;
      };
    };
  }
}

let supabase: any = null;
let connectionHealthInterval: NodeJS.Timeout | null = null;
let isMonitoring = false;

export async function initSupabase() {
  if (supabase) return supabase;

  let createClient: any;

  // 1️⃣ Prefer CDN client (AI Studio / Cloudflare) if available
  if (window.supabase && typeof window.supabase.createClient === "function") {
    createClient = window.supabase.createClient;
    console.info("[Supabase] Using CDN client.");
  } else {
    // 2️⃣ Use npm package as primary fallback
    try {
      const { createClient: npmCreateClient } = await import("@supabase/supabase-js");
      createClient = npmCreateClient;
      console.info("[Supabase] Using npm package client.");
    } catch (err) {
      console.error("[Supabase] Failed to load Supabase library:", err);
    }
  }

  // 2️⃣ Get and validate environment variables
  let SUPABASE_URL: string;
  let SUPABASE_KEY: string;
  let keySource: string;

  try {
    const env = getSupabaseEnv();
    SUPABASE_URL = env.VITE_SUPABASE_URL;
    SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY!;
    keySource = getKeyType(SUPABASE_KEY);

    // Environment validated successfully
  } catch (error: any) {
    console.error(error.message);
    console.error("[Supabase] Running in offline mode due to configuration error.");
    
    // 3️⃣ Offline fallback
    supabase = createOfflineClient();
    return supabase;
  }

  // 4️⃣ Check if client library is available
  if (!createClient) {
    console.error("[Supabase] Client library not available. Running in offline mode.");
    supabase = createOfflineClient();
    return supabase;
  }

  // 5️⃣ Create client with configuration
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'dossier-auth-token',
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'dossier-ng',
        'x-client-info': 'dossier-ng@1.0.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      },
      heartbeatIntervalMs: 30000,
      reconnectIntervalMs: 5000
    }
  });
  
  supabase._offline = false;
  console.info(`[Supabase] Client initialized successfully using ${keySource} key.`);

  // 6️⃣ Demo auth shim: provide a fake teacher user when in demo mode
  setupDemoAuthShim();

  // 7️⃣ Start connection health monitoring
  startConnectionMonitoring();

  return supabase;
}

function createOfflineClient() {
  return { 
    _offline: true,
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Offline') }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    }
  };
}

function setupDemoAuthShim() {
  try {
    const isDemoMode = typeof window !== 'undefined' && (
      sessionStorage.getItem('isDemoMode') === 'true' ||
      localStorage.getItem('isDemoMode') === 'true'
    );
    const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demoUserRole') : null;
    
    if (isDemoMode && demoRole === 'Teacher') {
      const originalGetUser = supabase.auth?.getUser?.bind(supabase.auth);
      supabase.auth = supabase.auth || {};
      supabase.auth.getUser = async () => {
        try {
          const real = originalGetUser ? await originalGetUser() : { data: { user: null }, error: null };
          if (real?.data?.user) return real;
        } catch {}
        return { data: { user: { id: 'auth_teacher_demo', email: 'teacher@demo.com' } }, error: null } as any;
      };
    }
  } catch (e) {
    console.warn('[Supabase] Demo auth shim failed:', e);
  }
}

// Get initialized client safely
export function getSupabase() {
  if (!supabase)
    throw new Error("Supabase not initialized. Call await initSupabase() first.");
  return supabase;
}

// Test connectivity with retry logic
export async function isSupabaseOnline(): Promise<boolean> {
  if (!supabase || supabase._offline) return false;
  
  try {
    // Use a lightweight query to test connection
    await withRetry(
      async () => {
        const { error } = await supabase.from("platform_settings").select("id").limit(1);
        if (error) throw error;
      },
      { 
        maxRetries: 2,
        initialDelay: 500,
        onRetry: () => {} // Silent retry for connectivity check
      }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Start monitoring connection health and auto-reconnect if needed
 */
export function startConnectionMonitoring() {
  if (isMonitoring || !supabase || supabase._offline) return;
  
  isMonitoring = true;
  console.info('[Supabase] Connection health monitoring started');
  
  connectionHealthInterval = setInterval(async () => {
    const isOnline = await isSupabaseOnline();
    
    if (!isOnline && !supabase._offline) {
      console.warn('[Supabase] Connection lost, attempting reconnection...');
      await reconnectSupabase();
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Stop connection health monitoring
 */
export function stopConnectionMonitoring() {
  if (connectionHealthInterval) {
    clearInterval(connectionHealthInterval);
    connectionHealthInterval = null;
    isMonitoring = false;
    console.info('[Supabase] Connection health monitoring stopped');
  }
}

/**
 * Attempt to reconnect to Supabase
 */
async function reconnectSupabase() {
  try {
    // Reset connection
    supabase = null;
    await initSupabase();
    
    // Verify connection
    const isOnline = await isSupabaseOnline();
    if (isOnline) {
      console.info('[Supabase] ✅ Reconnection successful');
      // Dispatch event for UI to react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-reconnected'));
      }
    } else {
      throw new Error('Connection test failed after reconnection');
    }
  } catch (error) {
    console.error('[Supabase] ❌ Reconnection failed:', error);
    // Dispatch event for UI to show offline state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase-connection-lost'));
    }
  }
}

/**
 * Get connection status and metrics
 */
export function getConnectionStatus() {
  return {
    initialized: supabase !== null,
    offline: supabase?._offline ?? true,
    monitoring: isMonitoring
  };
}

export { supabase };