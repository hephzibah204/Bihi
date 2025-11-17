export const onRequestPost = async ({ request }) => {
  try {
    const body = await request.json();
    const sources = Array.isArray(body?.sources) ? body.sources : [];
    const overrides = Array.isArray(body?.items) ? body.items : [];

    if (overrides.length) {
      // Allow pushing custom items into a transient index; no persistence.
      for (const item of overrides) {
        const normalized = normalizeItem(item);
        const key = keyFor(normalized);
        INDEX.set(key, normalized);
      }
    }

    // Optionally fetch remote catalogs (best-effort; can be extended)
    const fetched = [];
    if (sources.includes('OpenStax')) {
      // Placeholder: in production, fetch OpenStax catalog API and map
      fetched.push(...OPENSTAX_SAMPLE);
    }
    if (sources.includes('LibreTexts')) {
      fetched.push(...LIBRETEXTS_SAMPLE);
    }

    for (const item of fetched) {
      INDEX.set(keyFor(item), item);
    }

    const items = Array.from(INDEX.values());
    return new Response(JSON.stringify({ ok: true, count: items.length }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'index_failed', message: e?.message || 'Failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
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

