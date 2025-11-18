#!/usr/bin/env node
const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
async function main() {
  const out = { base };
  try {
    const r = await fetch(`${base.replace(/\/$/, '')}/api/tags`);
    out.tagsOk = r.ok;
    out.status = r.status;
    out.models = r.ok ? (await r.json()).models?.map((m) => m.name) || [] : [];
  } catch (e) {
    out.error = e?.message || String(e);
  }
  console.log(JSON.stringify(out, null, 2));
}
main();
