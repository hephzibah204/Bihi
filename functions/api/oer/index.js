import { handleCors } from '../../_lib/cors.js';
import { requireSuperAdmin } from '../../_lib/auth.js';

export const onRequestPost = async ({ request, env }) => {
  const { response: corsResponse, corsHeaders } = handleCors(request, env, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  const { ok, res } = await requireSuperAdmin(request, env);
  if (!ok) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  try {
    const body = await request.json();
    const sources = Array.isArray(body?.sources) ? body.sources : [];
    const overrides = Array.isArray(body?.items) ? body.items : [];

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    const adminHeaders = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    } : null;

    if (overrides.length && adminHeaders) {
      const payload = overrides.map(normalizeItem);
      await fetch(`${SUPABASE_URL}/rest/v1/oer_items`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(payload) });
    } else if (overrides.length) {
      for (const item of overrides) INDEX.set(keyFor(item), normalizeItem(item));
    }

    const fetched = [];
    if (sources.includes('OpenStax')) fetched.push(...OPENSTAX_SAMPLE);
    if (sources.includes('LibreTexts')) fetched.push(...LIBRETEXTS_SAMPLE);
    if (fetched.length) {
      if (adminHeaders) {
        await fetch(`${SUPABASE_URL}/rest/v1/oer_items`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(fetched) });
      } else {
        for (const item of fetched) INDEX.set(keyFor(item), item);
      }
    }

    const count = adminHeaders ? (await (await fetch(`${SUPABASE_URL}/rest/v1/oer_items?select=count`, { headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' } })).json())?.count ?? null : INDEX.size;
    const response = new Response(JSON.stringify({ ok: true, count }), { headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  } catch (e) {
    const response = new Response(JSON.stringify({ ok: false, error: 'index_failed', message: e?.message || 'Failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }
};

// Transient in-memory index; per worker instance
const INDEX = new Map();
const keyFor = (m) => `${(m.source||'')}:${(m.url||m.title||'')}`;
const normalizeItem = (x) => ({
  title: x.title || '',
  author: x.author || '',
  year: x.year || null,
  subject: x.subject || '',
  url: x.url || '',
  source: x.source || 'Custom',
  tags: Array.isArray(x.tags) ? x.tags : [],
});

const OPENSTAX_SAMPLE = [
  { title: 'Biology 2e', author: 'OpenStax', year: 2020, subject: 'Biology', url: 'https://openstax.org/details/books/biology-2e', source: 'OpenStax', tags: ['STEM', 'College', 'Textbook'] },
];
const LIBRETEXTS_SAMPLE = [
  { title: 'Chemistry LibreTexts: General Chemistry', author: 'LibreTexts', year: 2019, subject: 'Chemistry', url: 'https://chem.libretexts.org/Bookshelves/General_Chemistry', source: 'LibreTexts', tags: ['STEM', 'Chemistry'] },
];
