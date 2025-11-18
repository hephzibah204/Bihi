// functions/api/ai/ollama-tags.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const r = await fetch(`${base.replace(/\/$/, '')}/api/tags`, { method: 'GET' });
    const txt = await r.text().catch(() => '');
    if (!r.ok) return res.status(r.status).send(txt || '');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(txt);
  } catch (e) {
    return res.status(500).json({ error: 'tags_failure' });
  }
}