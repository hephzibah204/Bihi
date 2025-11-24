// utils/env.ts
// Centralized environment variable management for Cloudflare Pages/Workers
// Single source of truth for all environment variable access

import { logger } from "./logger";

// Type definitions
export type GeminiConfig = { apiKey: string | undefined; model: string };
export type HuggingFaceConfig = { apiKey: string | undefined };
export type OpenAIConfig = { apiKey: string | undefined };
export type OpenRouterConfig = { apiKey: string | undefined };
export type SupabaseConfig = {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string; // server-side only
  aiChatUrl?: string;
  registerTenantUrl?: string;
};
export type LivekitConfig = {
  apiKey?: string;
  apiSecret?: string; // server-side only
  url?: string;
};
export type RoutingConfig = {
  previewDomain?: string;
  protocol: string;
  rootDomains: string[];
  useLocalApi: boolean;
  useSubdomains: boolean;
};

// Helper to check for server-side context
const isServer = typeof window === "undefined";

/**
 * Get Gemini API configuration
 * Precedence: VITE_GEMINI_API_KEY > VITE_API_KEY > GEMINI_API_KEY (server-only)
 */
export function getGeminiConfig(): GeminiConfig {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_GEMINI_API ||
    import.meta.env.VITE_API_KEY ||
    (isServer ? process.env.GEMINI_API_KEY : undefined);

  if (!apiKey) {
    logger.warn("[Env] Missing Gemini API key");
  }

  return {
    apiKey,
    model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash",
  };
}

/**
 * Get HuggingFace API configuration
 * Handles spelling mismatch: HUGGINFACE vs HUGGINGFACE
 * Precedence: VITE_HUGGINGFACE_API_KEY > NEXT_PUBLIC_HUGGINFACE_API_KEY > HUGGINFACE_API_KEY (server-only)
 */
export function getHuggingFaceConfig(): HuggingFaceConfig {
  const apiKey =
    import.meta.env.VITE_HUGGINGFACE_API_KEY ||
    import.meta.env.NEXT_PUBLIC_HUGGINFACE_API_KEY ||
    (isServer ? process.env.HUGGINFACE_API_KEY : undefined);

  if (!apiKey) {
    logger.warn("[Env] Missing HuggingFace API key");
  }

  return { apiKey };
}

/**
 * Get OpenAI API configuration
 * Precedence: VITE_OPENAI_API_KEY > API_KEY (server-only)
 */
export function getOpenAIConfig(): OpenAIConfig {
  const apiKey =
    import.meta.env.VITE_OPENAI_API_KEY ||
    (isServer ? process.env.API_KEY : undefined);

  if (!apiKey) {
    logger.warn("[Env] Missing OpenAI API key");
  }

  return { apiKey };
}

/**
 * Get OpenRouter API configuration
 * Precedence: VITE_OPENROUTER_API_KEY > API_KEY (server-only)
 */
export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey =
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    (isServer ? process.env.API_KEY : undefined);

  if (!apiKey) {
    logger.warn("[Env] Missing OpenRouter API key");
  }

  return { apiKey };
}

/**
 * Get Supabase configuration
 * Precedence for URL: VITE_SUPABASE_URL > SUPABASE_URL (server-only)
 * Precedence for anonKey: VITE_SUPABASE_ANON_KEY > VITE_SUPABASE_PUBLISHABLE_KEY > SUPABASE_ANON_KEY > SUPABASE_PUBLISHABLE_KEY (server-only)
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    (isServer ? process.env.SUPABASE_URL : undefined);

  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (isServer ? process.env.SUPABASE_ANON_KEY : undefined) ||
    (isServer ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

  const serviceRoleKey = isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

  if (!url) {
    logger.warn("[Env] Missing Supabase URL");
  }
  if (!anonKey) {
    logger.warn("[Env] Missing Supabase anon key");
  }
  if (isServer && !serviceRoleKey) {
    logger.warn("[Env] Missing Supabase service role key (server-side only)");
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
    aiChatUrl: import.meta.env.VITE_SUPABASE_AI_CHAT_URL,
    registerTenantUrl: import.meta.env.VITE_SUPABASE_FUNCTION_REGISTER_URL,
  };
}

/**
 * Legacy function for backward compatibility with supabaseClient.ts
 * Returns env vars in the format expected by existing code
 */
export function getSupabaseEnv(): {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
} {
  const config = getSupabaseConfig();
  return {
    VITE_SUPABASE_URL: config.url,
    VITE_SUPABASE_ANON_KEY: config.anonKey,
    VITE_SUPABASE_PUBLISHABLE_KEY: config.anonKey, // Fallback to anonKey if publishable not set
  };
}

/**
 * Determine the type of Supabase key (anon vs service role)
 */
export function getKeyType(key?: string): string {
  if (!key) return "unknown";
  // Service role keys are typically longer and start with "eyJ" (JWT)
  // Anon keys also start with "eyJ" but we can check length/pattern
  if (key.length > 200) return "service_role";
  if (key.startsWith("eyJ")) return "anon";
  return "unknown";
}

/**
 * Get Livekit configuration
 * All values are server-side only (never exposed to client)
 */
export function getLivekitConfig(): LivekitConfig {
  const apiKey = isServer ? process.env.LIVEKIT_API_KEY : undefined;
  const apiSecret = isServer ? process.env.LIVEKIT_API_SECRET : undefined;
  const url =
    (isServer ? process.env.LIVEKIT_URL : undefined) ||
    "wss://dossier-ogeq78qt.livekit.cloud";

  if (isServer && !apiKey) {
    logger.warn("[Env] Missing Livekit API key");
  }
  if (isServer && !apiSecret) {
    logger.warn("[Env] Missing Livekit API secret");
  }

  return { apiKey, apiSecret, url };
}

/**
 * Get routing/domain configuration
 */
export function getRoutingConfig(): RoutingConfig {
  const rootDomainsStr = import.meta.env.VITE_ROOT_DOMAINS || "";
  const rootDomains = rootDomainsStr
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  return {
    previewDomain: import.meta.env.VITE_PREVIEW_DOMAIN,
    protocol: import.meta.env.VITE_PROTOCOL || "https:",
    rootDomains,
    useLocalApi: import.meta.env.VITE_USE_LOCAL_API === "true",
    useSubdomains: import.meta.env.VITE_USE_SUBDOMAINS === "true",
  };
}
