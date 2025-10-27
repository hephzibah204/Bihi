// functions/_lib/cors.js

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

export function handleCors(request, methods = 'GET, POST, DELETE, OPTIONS') {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  let isAllowed = false;
  if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
    isAllowed = true;
  }
  if (request.method === 'OPTIONS') {
    return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
  }
  return { response: null, corsHeaders: headers, isAllowed };
}