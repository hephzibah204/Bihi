import { supabase } from './supabaseClient';
import { getSubdomain } from '../utils/subdomain';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

const isDemo = () => {
  const tenantId = getSubdomain();
  const flag = typeof window !== 'undefined' && (
    sessionStorage.getItem('isDemoMode') === 'true' ||
    localStorage.getItem('isDemoMode') === 'true'
  );
  return tenantId === 'demo' || flag;
};

async function sha256Base64Client(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const apiSignQRPayload = async (core: string): Promise<string | null> => {
  const secret = (typeof window !== 'undefined')
    ? (window.process?.env?.VITE_QR_SIGNING_KEY || import.meta.env?.VITE_QR_SIGNING_KEY)
    : process.env.VITE_QR_SIGNING_KEY;
  if (isDemo()) {
    if (!secret) return null;
    const sig = await sha256Base64Client(core + '|' + secret);
    return sig;
  }
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const baseUrl = (typeof window !== 'undefined')
      ? (window.process?.env?.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)
      : process.env.VITE_SUPABASE_URL;
    const edgeUrl = baseUrl ? `${baseUrl}/functions/v1/sign-qr` : null;
    const preferEdge = ((typeof window !== 'undefined')
      ? (import.meta as any)?.env?.VITE_USE_EDGE_FUNCTIONS
      : process.env.VITE_USE_EDGE_FUNCTIONS) === 'true';

    const endpoints = preferEdge && edgeUrl ? [edgeUrl, '/api/sign-qr'] : ['/api/sign-qr', edgeUrl].filter(Boolean) as string[];

    for (const url of endpoints) {
      try {
        const resp = await withRetry(
          () => fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({ core })
          }),
          { maxRetries: 1, initialDelay: 300 }
        );
        if (resp.ok) {
          const json = await resp.json();
          return json?.signature || null;
        }
      } catch (err) {
        logger.warn('[QR] Signing via endpoint failed, trying next', { url, message: (err as any)?.message });
      }
    }

    // Final client-side fallback using secret
    if (!secret) return null;
    const sig = await sha256Base64Client(core + '|' + secret);
    return sig;
  } catch (e) {
    logger.captureError(e as unknown, '[QR] Signing failed');
    if (!secret) return null;
    const sig = await sha256Base64Client(core + '|' + secret);
    return sig;
  }
};

export const apiVerifyQRSignature = async (core: string, signature: string): Promise<boolean> => {
  const baseUrl = (typeof window !== 'undefined')
    ? (window.process?.env?.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)
    : process.env.VITE_SUPABASE_URL;
  const edgeUrl = baseUrl ? `${baseUrl}/functions/v1/verify-qr` : null;
  const preferEdge = ((typeof window !== 'undefined')
    ? (import.meta as any)?.env?.VITE_USE_EDGE_FUNCTIONS
    : process.env.VITE_USE_EDGE_FUNCTIONS) === 'true';

  const endpoints = preferEdge && edgeUrl ? [edgeUrl, '/api/verify-qr'] : ['/api/verify-qr', edgeUrl].filter(Boolean) as string[];

  for (const url of endpoints) {
    try {
      const resp = await withRetry(
        () => fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ core, signature })
        }),
        { maxRetries: 1, initialDelay: 300 }
      );
      if (resp.ok) {
        const json = await resp.json();
        return !!json?.valid;
      }
    } catch (e) {
      logger.warn('[QR] Verification via endpoint failed, trying next', { url, message: (e as any)?.message });
    }
  }

  return false;
};