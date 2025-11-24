// src/utils/env.ts
// Centralized environment variable management

const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  // 1. Check Cloudflare environment (production)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  // 2. Check Vite build-time environment
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key] as string;
  }
  
  // 3. Check global window.ENV (runtime injection)
  if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
    return (window as any).ENV[key];
  }
  
  // 4. Return default value if provided
  return defaultValue;
};

const getRequiredEnvVar = (key: string): string => {
  const value = getEnvVar(key);
  if (!value) {
    throw new Error(`Required environment variable ${key} is not configured`);
  }
  return value;
};

// Supabase Configuration
export const getSupabaseConfig = () => {
  const url = getRequiredEnvVar('VITE_SUPABASE_URL');
  const anonKey = getRequiredEnvVar('VITE_SUPABASE_ANON_KEY');
  return { url, anonKey };
};

// AI Provider Configuration
export const getGeminiConfig = () => ({
  provider: 'google' as const,
  apiKey: getEnvVar('VITE_GEMINI_API_KEY'),
  baseUrl: getEnvVar('VITE_GEMINI_BASE_URL'),
  model: getEnvVar('VITE_GEMINI_MODEL', 'gemini-pro')
});

export const getOpenAIConfig = () => ({
  provider: 'openai' as const,
  apiKey: getEnvVar('VITE_OPENAI_API_KEY'),
  baseUrl: getEnvVar('VITE_OPENAI_BASE_URL'),
  model: getEnvVar('VITE_OPENAI_MODEL', 'gpt-4-turbo')
});

export const getAnthropicConfig = () => ({
  provider: 'anthropic' as const,
  apiKey: getEnvVar('VITE_ANTHROPIC_API_KEY'),
  baseUrl: getEnvVar('VITE_ANTHROPIC_BASE_URL'),
  model: getEnvVar('VITE_ANTHROPIC_MODEL', 'claude-3-opus-20240229')
});

export const getOfflineAIConfig = () => ({
  provider: 'offline' as const,
  model: 'offline'
});

// Development/Production Checks
export const isDevelopment = () => {
  return getEnvVar('NODE_ENV') === 'development' || 
         getEnvVar('VITE_NODE_ENV') === 'development' ||
         import.meta.env?.DEV === true;
};

export const isProduction = () => !isDevelopment();

export const ENV = {
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  GEMINI_API_KEY: getEnvVar('VITE_GEMINI_API_KEY'),
  OPENAI_API_KEY: getEnvVar('VITE_OPENAI_API_KEY'),
  ANTHROPIC_API_KEY: getEnvVar('VITE_ANTHROPIC_API_KEY'),
  isDevelopment: isDevelopment(),
  isProduction: isProduction()
};

export default ENV;