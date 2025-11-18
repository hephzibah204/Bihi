// functions/api/ai/embeddings.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const { text, model } = req.body || {};
    const prompt = String(text || '').slice(0, 4000);
    if (!prompt) return res.status(400).json({ error: 'empty_text' });
    const preferred = String(model || 'nomic-embed-text');
    try {
      const r = await Promise.race([
        fetch('http://localhost:11434/api/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: preferred, prompt }) }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
      ]);
      if (r && r.ok) {
        const j = await r.json();
        return res.status(200).json({ embedding: j.embedding });
      }
    } catch {}
    const dim = 1024;
    const tokens = prompt.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const vec = new Array(dim).fill(0);
    for (const t of tokens) {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
      vec[h % dim] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    for (let i = 0; i < dim; i++) vec[i] = vec[i] / norm;
    return res.status(200).json({ embedding: vec });
  } catch (e) {
    return res.status(500).json({ error: 'embedding_failure' });
  }
}
