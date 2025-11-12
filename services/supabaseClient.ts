// services/supabaseClient.ts
// Smart Supabase client: supports both "publishable" and legacy "anon" keys.
// Prioritizes CDN client, then ESM fallback, then offline mode.

import { getSupabaseEnv, getKeyType } from '../utils/env';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

declare global {
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
    logger.info('[Supabase] Using CDN client.');
  } else {
    // 2️⃣ Use npm package as primary fallback
    try {
      const { createClient: npmCreateClient } = await import("@supabase/supabase-js");
      createClient = npmCreateClient;
      logger.info('[Supabase] Using npm package client.');
    } catch (err) {
      logger.error('[Supabase] Failed to load Supabase library', { error: err as any });
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
    logger.error('[Supabase] Config error', { message: error.message });
    const isProd = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.PROD) === true;
    if (isProd) {
      // In production, fail-fast to surface misconfiguration
      throw new Error('Supabase configuration invalid in production: ' + (error?.message || 'unknown error'));
    } else {
      logger.error('[Supabase] Running in offline mode due to configuration error.');
      // 3️⃣ Offline fallback for development
      supabase = createOfflineClient();
      return supabase;
    }
  }

  // 3️⃣b Guard against empty envs (utils/env returns empty strings when unset)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logger.error('[Supabase] Missing SUPABASE_URL or KEY. Switching to offline mode.');
    supabase = createOfflineClient();
    return supabase;
  }

  // 4️⃣ Check if client library is available
  if (!createClient) {
    logger.error('[Supabase] Client library not available. Running in offline mode.');
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
  logger.info(`[Supabase] Client initialized successfully using ${keySource} key.`);

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
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const subscription = { unsubscribe: () => {} } as any;
        try {
          // Simulate an initial signed-out state in offline mode
          callback('SIGNED_OUT', null);
        } catch { /* noop */ }
        return { data: { subscription }, error: null } as any;
      }
    },
    // Minimal realtime no-op stubs to avoid runtime errors in offline mode
    channel: (_name: string) => {
      const api = {
        on: (_event: string, _config: any, _callback: any) => api,
        subscribe: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null })
      } as any;
      return api;
    },
    removeChannel: (_channel: any) => { /* noop */ },
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
        } catch { /* noop */ }
        return { data: { user: { id: 'auth_teacher_demo', email: 'teacher@demo.com' } }, error: null } as any;
      };
    }
  } catch (e) {
    logger.warn('[Supabase] Demo auth shim failed');
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

  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  const SUPABASE_URL = (typeof window !== 'undefined')
    ? (window.process?.env?.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)
    : process.env.VITE_SUPABASE_URL;

  // First try a lightweight REST query (works even if Edge Functions are not deployed)
  try {
    await withRetry(
      async () => {
        const { error } = await supabase.from("platform_settings").select("id").limit(1);
        if (error) throw error;
      },
      { maxRetries: 1, initialDelay: 300 }
    );
    return true;
  } catch { /* fall through to optional functions ping */ }

  // Optional: test the Edge Functions endpoint if explicitly enabled
  const enableFunctionsPing = ((typeof window !== 'undefined')
    ? (import.meta as any)?.env?.VITE_ENABLE_FUNCTIONS_PING
    : process.env.VITE_ENABLE_FUNCTIONS_PING) === 'true';

  if (SUPABASE_URL && enableFunctionsPing) {
    try {
      const pingCore = `RS1|SID=ping|ADM=|TS=${Date.now()}|CS=0000`;
      const resp = await withRetry(
        async () => fetch(`${SUPABASE_URL}/functions/v1/sign-qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ core: pingCore })
        }),
        { maxRetries: 1, initialDelay: 300 }
      );
      if (resp.ok) return true;
    } catch { /* ignore */ }
  }

  // If both checks failed, consider offline
  try {
    await withRetry(
      async () => {
        const { error } = await supabase.from("platform_settings").select("id").limit(1);
        if (error) throw error;
      },
      { maxRetries: 1, initialDelay: 300 }
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
  logger.info('[Supabase] Connection health monitoring started');
  
  connectionHealthInterval = setInterval(async () => {
    const isOnline = await isSupabaseOnline();
    
    if (!isOnline && !supabase._offline) {
      logger.warn('[Supabase] Connection lost, attempting reconnection...');
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
    logger.info('[Supabase] Connection health monitoring stopped');
  }
}

/**
 * Attempt to reconnect to Supabase
 */
async function reconnectSupabase() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Network offline');
    }
    // Reset connection
    supabase = null;
    await initSupabase();
    
    // Verify connection
    const isOnline = await isSupabaseOnline();
    if (isOnline) {
      logger.info('[Supabase] ✅ Reconnection successful');
      // Dispatch event for UI to react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-reconnected'));
      }
    } else {
      throw new Error('Connection test failed after reconnection');
    }
  } catch (error) {
    logger.error('[Supabase] ❌ Reconnection failed', { error: error as any });
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

// Auto-initialize in background on module load to reduce null usage windows
void (async () => { try { await initSupabase(); } catch { /* noop */ } })();

export { supabase };
