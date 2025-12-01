// services/supabaseClient.ts
// Smart Supabase client with fallbacks (CDN → NPM → Offline)
// Includes automatic reconnection, environment resolution,
// demo-mode auth shim, realtime settings, diagnostics, and safe guards.

import { getSupabaseConfig, getSupabaseEnv, getKeyType } from '../utils/env';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

import type { SupabaseClient } from '@supabase/supabase-js';

// Global ambient declarations
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

// Client instance + state
let supabase: SupabaseClient & { _offline?: boolean } | any = null;
let connectionHealthInterval: NodeJS.Timeout | null = null;
let isMonitoring = false;

/* ============================================================
 *  INITIALIZER
 * ============================================================ */
export async function initSupabase() {
  if (supabase) return supabase;

  let createClient: any = null;

  /* ---------------------------------------------------------
   * 1️⃣ Prefer CDN client (AI Studio / Cloudflare, etc.)
   * --------------------------------------------------------- */
  if (typeof window !== 'undefined' && window.supabase?.createClient) {
    createClient = window.supabase.createClient;
    logger.info('[Supabase] Using CDN client.');
  } else {
    /* -------------------------------------------------------
     * 2️⃣ Try ESM (NPM) client
     * ------------------------------------------------------- */
    try {
      const { createClient: npmCreateClient } = await import('@supabase/supabase-js');
      createClient = npmCreateClient;
      logger.info('[Supabase] Using npm package client.');
    } catch (err) {
      logger.error('[Supabase] Failed to load supabase-js.', { error: err });
    }
  }

  /* ---------------------------------------------------------
   * 3️⃣ Resolve environment variables
   * --------------------------------------------------------- */
  let SUPABASE_URL: string;
  let SUPABASE_KEY: string;
  let keySource: string;

  try {
    const config = getSupabaseConfig();
    SUPABASE_URL = config.url;
    SUPABASE_KEY = config.anonKey!;
    keySource = getKeyType(SUPABASE_KEY);
  } catch (e: any) {
    logger.error('[Supabase] Invalid environment config', { message: e.message });

    const isProd = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.PROD) === true;

    if (isProd) {
      throw new Error(`Supabase config invalid in production: ${e?.message || 'unknown error'}`);
    }

    logger.warn('[Supabase] Using offline mode (config error).');
    supabase = createOfflineClient();
    return supabase;
  }

  /* ---------------------------------------------------------
   * 3️⃣b Guard against empty or missing envs
   * --------------------------------------------------------- */
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logger.error('[Supabase] Missing URL/KEY. Offline mode activated.');
    supabase = createOfflineClient();
    return supabase;
  }

  /* ---------------------------------------------------------
   * 4️⃣ Check if createClient exists
   * --------------------------------------------------------- */
  if (!createClient) {
    logger.error('[Supabase] createClient not available → offline mode.');
    supabase = createOfflineClient();
    return supabase;
  }

  /* ---------------------------------------------------------
   * 5️⃣ Instantiate client
   * --------------------------------------------------------- */
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        storageKey: 'dossier-auth-token',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application-name': 'dossier-ng',
          'x-client-info': 'dossier-ng@1.0.0',
          'x-key-type': keySource
        },
        // Ensure fetch is available
        fetch: typeof window !== 'undefined' ? window.fetch : (typeof global !== 'undefined' ? global.fetch : undefined)
      },
      db: { schema: 'public' },
      realtime: {
        params: { eventsPerSecond: 10 },
        heartbeatIntervalMs: 30000,
        reconnectIntervalMs: 5000
      }
    });

    // Validate client was created properly
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    // Ensure client has required methods
    if (typeof supabase.from !== 'function') {
      logger.error('[Supabase] Client missing .from() method');
      throw new Error('Supabase client not properly initialized');
    }

    supabase._offline = false;
  } catch (clientErr: any) {
    logger.error('[Supabase] Failed to create client', { error: clientErr });
    supabase = createOfflineClient();
    return supabase;
  }

  if (!supabase.auth) supabase.auth = {} as any;
  if (typeof (supabase as any).auth.signInWithPassword !== 'function') {
    (supabase as any).auth.signInWithPassword = async (_args: any) => ({ data: null, error: new Error('Authentication service unavailable') });
  }
  if (typeof (supabase as any).auth.updateUser !== 'function') {
    (supabase as any).auth.updateUser = async (_args: any) => ({ data: null, error: new Error('Authentication service unavailable') });
  }

  logger.info(`[Supabase] Client initialized. Key type: ${keySource}`);

  /* ---------------------------------------------------------
   * 6️⃣ Demo mode authentication stub
   * --------------------------------------------------------- */
  setupDemoAuthShim();

  /* ---------------------------------------------------------
   * 7️⃣ Start monitoring network & Supabase connectivity
   * --------------------------------------------------------- */
  startConnectionMonitoring();

  return supabase;
}

/* ============================================================
 *  OFFLINE CLIENT FALLBACK (SAFE NO-OPS)
 * ============================================================ */
function createOfflineClient() {
  // Create a safe query builder that returns errors instead of crashing
  const createQueryBuilder = () => ({
    select: () => createQueryBuilder(),
    insert: () => createQueryBuilder(),
    update: () => createQueryBuilder(),
    delete: () => createQueryBuilder(),
    limit: () => createQueryBuilder(),
    eq: () => createQueryBuilder(),
    then: async () => ({ data: null, error: new Error('Database offline - check configuration') })
  });

  const offline = {
    _offline: true,
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Offline') }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Offline') }),
      updateUser: async () => ({ data: null, error: new Error('Offline') }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (cb: any) => {
        cb('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: () => {} } }, error: null };
      }
    },
    from: (_table: string) => createQueryBuilder(),
    channel: (_name: string) => ({
      on: () => offline,
      subscribe: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null })
    }),
    removeChannel: () => {}
  };

  logger.warn('[Supabase] Offline client initialized.');
  return offline;
}

/* ============================================================
 *  DEMO AUTH MODE (FAKE TEACHER USER)
 * ============================================================ */
function setupDemoAuthShim() {
  try {
    const isDemo =
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('isDemoMode') === 'true' ||
        localStorage.getItem('isDemoMode') === 'true');

    const role = typeof window !== 'undefined' ? localStorage.getItem('demoUserRole') : null;

    if (isDemo && role === 'Teacher') {
      const original = supabase.auth.getUser.bind(supabase.auth);

      supabase.auth.getUser = async () => {
        try {
          const real = await original();
          if (real?.data?.user) return real;
        } catch {}

        return {
          data: { user: { id: 'auth_teacher_demo', email: 'teacher@demo.com' } },
          error: null
        };
      };

      logger.info('[Supabase] Demo auth shim active (Teacher).');
    }
  } catch {
    logger.warn('[Supabase] Demo auth shim failed.');
  }
}

/* ============================================================
 *  ACCESSORS
 * ============================================================ */
export function getSupabase() {
  if (!supabase) throw new Error('Supabase not initialized. Call initSupabase() first.');
  return supabase;
}

/* ============================================================
 *  CONNECTIVITY CHECKER
 * ============================================================ */
export async function isSupabaseOnline(): Promise<boolean> {
  // Ensure client is initialized
  if (!supabase || supabase._offline) {
    try { 
      await initSupabase(); 
      // Double-check after initialization
      if (!supabase || supabase._offline) return false;
    } catch (initErr: any) {
      logger.error('[Supabase] Initialization failed in isSupabaseOnline', { error: initErr?.message });
      return false;
    }
  }
  
  if (!supabase || supabase._offline) return false;

  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  
  // Ensure fetch is available (required for Supabase client)
  if (typeof window !== 'undefined' && typeof window.fetch === 'undefined') {
    logger.error('[Supabase] Fetch API not available');
    return false;
  }

  // Ensure supabase has the 'from' method before using it
  if (!supabase || typeof supabase.from !== 'function') {
    logger.warn('[Supabase] Client missing query methods');
    return false;
  }

  // Light REST ping: `platform_settings` table
  try {
    await withRetry(
      async () => {
        if (!supabase || typeof supabase.from !== 'function') {
          throw new Error('Supabase client not properly initialized');
        }
        
        // Additional safety check - ensure the query builder exists
        const queryBuilder = supabase.from('platform_settings');
        if (!queryBuilder || typeof queryBuilder.select !== 'function') {
          throw new Error('Query builder not available');
        }
        
        const { error } = await queryBuilder.select('id').limit(1);
        if (error) throw error;
      },
      { maxRetries: 1, initialDelay: 250 }
    );
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || 'Unknown error';
    // Check for fetch-related errors
    if (errorMsg.includes('fetch') || errorMsg.includes('undefined')) {
      logger.error('[Supabase] Fetch error - client may not be properly initialized', { error: errorMsg });
    } else {
      logger.warn('[Supabase] Connection test failed', { error: errorMsg });
    }
  }

  // Optional: Edge Functions ping
  const enable = ((typeof window !== 'undefined')
    ? (import.meta as any)?.env?.VITE_ENABLE_FUNCTIONS_PING
    : process.env.VITE_ENABLE_FUNCTIONS_PING) === 'true';

  const config = getSupabaseConfig();
  const SUPABASE_URL = config.url;

  if (SUPABASE_URL && enable) {
    try {
      const pingCore = `RS1|SID=ping|TS=${Date.now()}|CS=0000`;
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/sign-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ core: pingCore })
      });
      if (resp.ok) return true;
    } catch {}
  }

  return false;
}

/* ============================================================
 *  AUTO-RECONNECT + MONITORING
 * ============================================================ */
export function startConnectionMonitoring() {
  if (isMonitoring || !supabase || supabase._offline) return;

  isMonitoring = true;

  connectionHealthInterval = setInterval(async () => {
    const online = await isSupabaseOnline();
    if (!online) await reconnectSupabase();
  }, 30000);

  logger.info('[Supabase] Connection monitoring started.');
}

export function stopConnectionMonitoring() {
  if (connectionHealthInterval) {
    clearInterval(connectionHealthInterval);
    connectionHealthInterval = null;
  }
  isMonitoring = false;
  logger.info('[Supabase] Connection monitoring stopped.');
}

async function reconnectSupabase() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      throw new Error('Device offline.');

    supabase = null;
    await initSupabase();

    if (await isSupabaseOnline()) {
      logger.info('[Supabase] Reconnected successfully.');

      if (typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent('supabase-reconnected'));

      return;
    }

    throw new Error('Connection test failed after reconnection.');
  } catch (e) {
    logger.error('[Supabase] Reconnection failed.', { error: e });

    if (typeof window !== 'undefined')
      window.dispatchEvent(new CustomEvent('supabase-connection-lost'));
  }
}

/* ============================================================
 *  STATUS DASHBOARD
 * ============================================================ */
export function getConnectionStatus() {
  return {
    initialized: supabase !== null,
    offline: !!supabase?._offline,
    monitoring: isMonitoring
  };
}

/* ============================================================
 *  BACKGROUND AUTO-INIT
 * ============================================================ */
void (async () => {
  try { await initSupabase(); } catch {}
})();

export { supabase };
