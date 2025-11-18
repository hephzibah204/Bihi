import { handleCors } from '../../_lib/cors.js';

export const onRequestGet = async ({ request, env }) => {
  const { response: corsResponse, corsHeaders } = handleCors(request, env, 'GET, OPTIONS');
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const source = url.searchParams.get('source') || 'OpenStax';
  const year = url.searchParams.get('year') || '';
  const author = (url.searchParams.get('author') || '').toLowerCase();
  const subject = (url.searchParams.get('subject') || '').toLowerCase();

  const cacheKey = `${source}|${q}|${year}|${author}|${subject}`;
  const now = Date.now();
  const cached = CACHE.get(cacheKey);
  if (cached && (now - cached.t) < CACHE_TTL_MS) {
    const res = new Response(JSON.stringify({ ok: true, cached: true, items: cached.items }), { headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
  let items = [];
  try {
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const params = new URLSearchParams();
      params.set('select', 'title,author,year,subject,url,source,tags,published');
      params.set('published', 'eq.true');
      const ors = [];
      if (q) {
        ors.push(`title.ilike.%25${encodeURIComponent(q)}%25`);
        ors.push(`author.ilike.%25${encodeURIComponent(q)}%25`);
        ors.push(`subject.ilike.%25${encodeURIComponent(q)}%25`);
      }
      if (ors.length) params.set('or', `(${ors.join(',')})`);
      if (year) params.set('year', `eq.${year}`);
      if (author) params.set('author', `ilike.%25${encodeURIComponent(author)}%25`);
      if (subject) params.set('subject', `ilike.%25${encodeURIComponent(subject)}%25`);
      if (source) params.set('source', `eq.${encodeURIComponent(source)}`);
      const sup = await fetch(`${SUPABASE_URL}/rest/v1/oer_items?${params.toString()}`, {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY }
      });
      if (sup.ok) {
        items = await sup.json();
      }
    }
    if (!items || items.length === 0) {
      if (source === 'OpenStax') {
        items = OPENSTAX.filter(m => filterMatch(m, q, year, author, subject));
      } else if (source === 'LibreTexts') {
        items = LIBRETEXTS.filter(m => filterMatch(m, q, year, author, subject));
      } else if (source === 'OER Commons') {
        items = OER_COMMONS.filter(m => filterMatch(m, q, year, author, subject));
      } else {
        items = [].filter(m => filterMatch(m, q, year, author, subject));
      }
    }
  } catch (e) {
    const res = new Response(JSON.stringify({ ok: false, error: 'search_failed', message: e?.message || 'Failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  CACHE.set(cacheKey, { t: now, items });
  const res = new Response(JSON.stringify({ ok: true, cached: false, items }), { headers: { 'content-type': 'application/json' } });
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
};

// Simple in-memory cache (per worker instance)
const CACHE = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function filterMatch(m, q, year, author, subject) {
  const text = `${m.title} ${m.author || ''} ${m.subject || ''} ${(m.tags || []).join(' ')}`.toLowerCase();
  const qOk = !q || text.includes(q.toLowerCase());
  const yOk = !year || `${m.year || ''}` === `${year}`;
  const aOk = !author || (m.author || '').toLowerCase().includes(author);
  const sOk = !subject || (m.subject || '').toLowerCase().includes(subject);
  return qOk && yOk && aOk && sOk;
}

// Minimal curated indexes; extend or replace via POST /api/oer/index
const OPENSTAX = [
  { title: 'Biology 2e', author: 'OpenStax', year: 2020, subject: 'Biology', url: 'https://openstax.org/details/books/biology-2e', source: 'OpenStax', tags: ['STEM', 'College', 'Textbook'] },
  { title: 'College Physics', author: 'OpenStax', year: 2016, subject: 'Physics', url: 'https://openstax.org/details/books/college-physics', source: 'OpenStax', tags: ['STEM', 'Physics'] },
  { title: 'Principles of Macroeconomics', author: 'OpenStax', year: 2017, subject: 'Economics', url: 'https://openstax.org/details/books/principles-macroeconomics-2e', source: 'OpenStax', tags: ['Economics'] },
];

const LIBRETEXTS = [
  { title: 'Chemistry LibreTexts: General Chemistry', author: 'LibreTexts', year: 2019, subject: 'Chemistry', url: 'https://chem.libretexts.org/Bookshelves/General_Chemistry', source: 'LibreTexts', tags: ['STEM', 'Chemistry'] },
  { title: 'Mathematics LibreTexts: Precalculus', author: 'LibreTexts', year: 2018, subject: 'Mathematics', url: 'https://math.libretexts.org/Courses/Precalculus', source: 'LibreTexts', tags: ['Math'] },
];

const OER_COMMONS = [
  { title: 'US History', author: 'OpenStax/OER Commons', year: 2014, subject: 'History', url: 'https://www.oercommons.org/courses/us-history', source: 'OER Commons', tags: ['Humanities'] },
];
