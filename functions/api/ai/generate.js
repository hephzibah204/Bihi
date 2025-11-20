export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
    const body = await parseJson(req);
    const prompt = String(body.prompt || body.input || '').slice(0, 8000);
    if (!prompt) return res.status(400).json({ error: 'empty_prompt' });
    const key = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
    const model = process.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct';
    if (!key) return res.status(500).json({ error: 'missing_openrouter_key' });
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2 })
    });
    if (!r.ok) { const t = await r.text().catch(() => ''); return res.status(r.status).json({ error: t || 'openrouter_error' }); }
    const j = await r.json().catch(() => ({}));
    const content = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({ error: 'generate_failure' });
  }
}

async function parseJson(req) {
  try { return await new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch (e) { resolve({}) } })
    req.on('error', reject)
  }) } catch { return {} }
}
