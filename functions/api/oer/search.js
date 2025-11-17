export const onRequestGet = async ({ request }) => {
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
    return new Response(JSON.stringify({ ok: true, cached: true, items: cached.items }), { headers: { 'content-type': 'application/json' } });
  }

  let items = [];
  try {
    if (source === 'OpenStax') {
      items = OPENSTAX.filter(m => filterMatch(m, q, year, author, subject));
    } else if (source === 'LibreTexts') {
      items = LIBRETEXTS.filter(m => filterMatch(m, q, year, author, subject));
    } else if (source === 'OER Commons') {
      items = OER_COMMONS.filter(m => filterMatch(m, q, year, author, subject));
    } else {
      items = [].filter(m => filterMatch(m, q, year, author, subject));
    }
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'search_failed', message: e?.message || 'Failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  CACHE.set(cacheKey, { t: now, items });
  return new Response(JSON.stringify({ ok: true, cached: false, items }), { headers: { 'content-type': 'application/json' } });
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

