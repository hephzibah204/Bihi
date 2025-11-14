// functions/_lib/cors.js

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/reportsheet\.com\.ng$/,
  /^https:\/\/.+\.reportsheet\.com\.ng$/,
  /^https:\/\/reportsheet\.pages\.dev$/,
  /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/,
  /^https:\/\/.+\.googleusercontent\.com$/,
];

export function handleCors(request, env, methods = 'GET, POST, DELETE, OPTIONS') {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demo-Mode',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
    // Security headers for API responses
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'self'",
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cache-Control': 'no-store',
  };
  let isAllowed = false;

  // If ALLOWED_ORIGINS provided in env, prefer exact match
  const envAllowed = typeof env?.ALLOWED_ORIGINS === 'string'
    ? env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (origin) {
    if (envAllowed.length && envAllowed.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      isAllowed = true;
    } else if (allowedOriginPatterns.some((p) => p.test(origin))) {
      headers['Access-Control-Allow-Origin'] = origin;
      isAllowed = true;
    }
  }

  if (request.method === 'OPTIONS') {
    return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
  }
  return { response: null, corsHeaders: headers, isAllowed };
}
