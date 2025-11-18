// functions/api/ai/ollama-generate.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const { prompt, model, stream } = req.body || {};
    const text = String(prompt || '').slice(0, 8000);
    const mdl = String(model || process.env.OLLAMA_MODEL || 'llama3.1');
    const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const url = `${base.replace(/\/$/, '')}/api/generate`;
    const body = { model: mdl, prompt: text, stream: !!stream };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return res.status(r.status).json({ error: t || 'ollama_error' });
    }
    const j = await r.json().catch(() => ({}));
    return res.status(200).json(j);
  } catch (e) {
    return res.status(500).json({ error: 'proxy_failure' });
  }
}
